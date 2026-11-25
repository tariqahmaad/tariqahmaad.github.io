/**
 * Title dock: as the page scrolls from the top of the hero, each letter of the
 * hero name glides smoothly along a staggered GPU-only FLIP path from its exact
 * pixel position in `#hero-title` to its exact pixel slot in `.site-logo__full`
 * (and reverses seamlessly when scrolling back up to the hero).
 *
 * Desktop & mobile smoothness:
 * - Zero-lag Lenis sync on desktop (`ui:scroll` inside Lenis's rAF) and
 *   immediate native scroll sync on touch devices so the glide stays locked
 *   to the finger with zero dropped frames.
 * - Mobile address-bar resilience: `resize` only remeasures when viewport
 *   width changes, preventing mid-scroll jumps when mobile toolbars hide/show.
 * - Responsive flight distance: tuned for both desktop (~360–540px) and phone
 *   viewports (~200–320px) so docking completes right as the hero exits.
 * - Graceful wrapped fallback: if extreme zoom wraps the name to two lines,
 *   the navbar still cleanly reveals the full wordmark once scrolled past the hero.
 * - Skipped for reduced motion and on pages without a hero.
 */
import { reducedMotion } from './env.js'
import { clamp01, markOpacityAt, smoothstep } from './dock-timeline.js'

const DESKTOP_FLIGHT_MIN = 360
const DESKTOP_FLIGHT_MAX = 540
const MOBILE_FLIGHT_MIN = 200
const MOBILE_FLIGHT_MAX = 320
const LAND_AT = 0.86 // all letters finish docking here
const MARK_FROM = 0.04 // compact "TA" opens smoothly across the flight...
const MARK_TO = 0.82 // ...so its A arrives on the AHMAD column right in lockstep
const BRAND_IN_FROM = 0.85 // real wordmark fades in to 1.0 first...
const BRAND_IN_TO = 0.92
const GHOST_OUT_FROM = 0.90 // ...then the ghost fades out (zero brightness dip)
const GHOST_OUT_TO = 0.96
const FLASH_MS = 720

const title = document.getElementById('hero-title')
const brand = document.querySelector('.site-logo__full')
const brandShort = document.querySelector('.site-logo__short')
const brandShortA = document.querySelector('.site-logo__short-a')
const header = document.getElementById('site-header')

const lerp = (from, to, t) => from + (to - from) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const easeY = (t) => 0.6 * easeOutCubic(t) + 0.4 * easeInOutSine(t)
const easeScale = (t) => 0.5 * easeOutCubic(t) + 0.5 * easeInOutSine(t)

const firstTextNode = (el) => {
  for (const node of el.childNodes) {
    if (node.nodeType === 3 && node.textContent.trim().length > 0) return node
  }
  return null
}

if (title && brand && brandShort && brandShortA && header && !reducedMotion.matches) {
  const logo = brand.closest('.site-logo')
  const ghost = document.createElement('span')
  ghost.className = 'hero__title hero-title-ghost'
  ghost.setAttribute('aria-hidden', 'true')

  const rawText = title.dataset.text || title.textContent.trim()
  const chars = []
  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i]
    if (ch === ' ') continue
    const span = document.createElement('span')
    span.className = 'hero-title-ghost__ch'
    span.textContent = ch
    ghost.appendChild(span)
    chars.push({ el: span, charIndex: i, startX: 0, endX: 0 })
  }
  document.body.appendChild(ghost)

  // Pristine, unmutated ruler so hero-fx decode glyphs never corrupt glyph X measurements.
  const ruler = document.createElement('span')
  ruler.className = 'hero__title hero-title-ruler'
  ruler.setAttribute('aria-hidden', 'true')
  ruler.textContent = rawText
  document.body.appendChild(ruler)

  let geometry = null
  let mode = ''
  let fullOpacity = null
  let markOpacity = null
  let landed = false
  let retries = 0
  let flashTimer = 0
  let frame = 0
  let measureFrame = 0
  let lastLenisTime = 0
  let lastScroll = -1
  let lastWidth = window.innerWidth

  const setFullOpacity = (value) => {
    const rounded = Math.round(value * 1000) / 1000
    if (rounded === fullOpacity) return
    fullOpacity = rounded
    brand.style.opacity = String(rounded)
  }

  const setMarkShift = (value) => {
    if (!value) {
      brandShortA.style.transform = 'none'
      return
    }
    brandShortA.style.transform = `translate3d(${value.toFixed(2)}px, 0, 0)`
  }

  // The compact mark hands the navbar to the flying copy while the copy is
  // crossing the logo columns, then takes it back as the copy drops into the
  // hero. Leaving both visible drew a doubled T/A in the header.
  const setMarkOpacity = (value) => {
    const rounded = Math.round(value * 1000) / 1000
    if (rounded === markOpacity) return
    markOpacity = rounded
    if (rounded >= 1) {
      brandShort.style.removeProperty('opacity')
      return
    }
    brandShort.style.opacity = String(rounded)
  }

  const setMarkGlow = (value) => {
    if (value < 0.01) {
      brandShort.style.removeProperty('--mark-glow')
      return
    }
    brandShort.style.setProperty('--mark-glow', value.toFixed(2))
  }

  const flashLogo = () => {
    if (!logo) return
    logo.classList.remove('is-docked')
    void logo.offsetWidth
    logo.classList.add('is-docked')
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => logo.classList.remove('is-docked'), FLASH_MS)
  }

  /* Measure exact per-glyph start and end boxes. Runs on load, width change,
     font swap or orientation change — never during normal scroll. */
  const measure = () => {
    if (title.classList.contains('is-glitching')) return false

    brandShortA.style.transform = 'none'
    const rect = title.getBoundingClientRect()
    const brandRect = brand.getBoundingClientRect()
    const shortARect = brandShortA.getBoundingClientRect()
    const layout = getComputedStyle(title)
    const brandStyle = getComputedStyle(brand)
    const lineHeight = parseFloat(layout.lineHeight) || rect.height

    // Wrapped name (e.g. extreme zoom): disable per-letter flight and use clean fallback.
    if (rect.height > lineHeight * 1.5 || rect.width < 1 || brandRect.width < 1) {
      geometry = null
      return false
    }

    const rulerNode = firstTextNode(ruler)
    const brandNode = firstTextNode(brand)
    if (!rulerNode || !brandNode) {
      geometry = null
      return false
    }

    const rulerRect = ruler.getBoundingClientRect()
    const rulerStr = rulerNode.textContent
    const brandStr = brandNode.textContent
    const rulerOffset = rulerStr.length - rulerStr.trimStart().length
    const brandOffset = brandStr.length - brandStr.trimStart().length
    const range = document.createRange()

    for (const item of chars) {
      const ri = rulerOffset + item.charIndex
      const bi = brandOffset + item.charIndex
      if (ri + 1 > rulerStr.length || bi + 1 > brandStr.length) {
        geometry = null
        return false
      }
      range.setStart(rulerNode, ri)
      range.setEnd(rulerNode, ri + 1)
      item.startX = rect.left + (range.getBoundingClientRect().left - rulerRect.left)

      range.setStart(brandNode, bi)
      range.setEnd(brandNode, bi + 1)
      item.endX = range.getBoundingClientRect().left
    }

    const sampleHeight = rulerRect.height || rect.height

    let markShift = 0
    const aIndex = brandStr.indexOf(' ', brandOffset) + 1
    if (aIndex > brandOffset && aIndex + 1 <= brandStr.length) {
      range.setStart(brandNode, aIndex)
      range.setEnd(brandNode, aIndex + 1)
      markShift = range.getBoundingClientRect().left - shortARect.left
    }

    const docTop = rect.top + window.scrollY
    const endScale = Math.min(
      1,
      Math.max(0.02, parseFloat(brandStyle.fontSize) / (parseFloat(layout.fontSize) || 1))
    )
    const isPhone = window.innerWidth < 768
    const minFlight = isPhone ? MOBILE_FLIGHT_MIN : DESKTOP_FLIGHT_MIN
    const maxFlight = isPhone ? MOBILE_FLIGHT_MAX : DESKTOP_FLIGHT_MAX

    geometry = {
      flight: Math.min(maxFlight, Math.max(minFlight, docTop + rect.height * 1.2)),
      startY: docTop,
      endY: brandRect.top + (brandRect.height - sampleHeight * endScale) / 2,
      endScale,
      markShift,
      isPhone
    }
    retries = 0
    return true
  }

  const setMode = (next) => {
    if (next === mode) return
    mode = next
    if (next === 'rest') {
      ghost.style.visibility = 'hidden'
      ghost.style.opacity = '0'
      title.style.removeProperty('opacity')
      setFullOpacity(0)
      setMarkOpacity(1)
      setMarkShift(0)
      setMarkGlow(0)
      landed = false
    } else if (next === 'docked') {
      ghost.style.visibility = 'hidden'
      ghost.style.opacity = '0'
      title.style.opacity = '0'
      setFullOpacity(1)
      setMarkOpacity(0)
      setMarkShift(geometry ? geometry.markShift : 0)
      setMarkGlow(0)
      landed = true
    } else if (next === 'fallback-docked') {
      // Wrapped name fallback: keep real h1 untouched and show full navbar wordmark.
      ghost.style.visibility = 'hidden'
      ghost.style.opacity = '0'
      title.style.removeProperty('opacity')
      setFullOpacity(1)
      setMarkOpacity(0)
      setMarkShift(0)
      setMarkGlow(0)
      landed = true
    }
  }

  const render = (scrollY) => {
    const safeScroll = Math.max(0, scrollY)

    if (!geometry) {
      if (safeScroll > 140) {
        setMode('fallback-docked')
      } else {
        setMode('rest')
      }
      return
    }

    if (safeScroll === lastScroll && mode !== '') return
    lastScroll = safeScroll

    const p = clamp01(safeScroll / geometry.flight)

    if (p <= 0.001) {
      setMode('rest')
      return
    }
    if (p >= 0.999) {
      setMode('docked')
      return
    }

    mode = 'flight'
    const flightT = clamp01(p / LAND_AT)
    const brandIn = smoothstep(p, BRAND_IN_FROM, BRAND_IN_TO)
    const ghostOut = smoothstep(p, GHOST_OUT_FROM, GHOST_OUT_TO)

    title.style.opacity = '0'
    ghost.style.visibility = 'visible'
    ghost.style.opacity = String(1 - ghostOut)

    const ex = easeInOutSine(flightT)
    const ey = easeY(flightT)
    const es = easeScale(flightT)
    const y = lerp(geometry.startY, geometry.endY, ey)
    const scale = lerp(1, geometry.endScale, es)
    const glow = Math.sin(Math.PI * flightT)
    const yStr = y.toFixed(2)
    const scaleStr = scale.toFixed(4)
    const glowStr = (glow * 0.38).toFixed(3)

    for (let i = 0; i < chars.length; i++) {
      const item = chars[i]
      const x = lerp(item.startX, item.endX, ex)
      item.el.style.transform = `translate3d(${x.toFixed(2)}px, ${yStr}px, 0) scale(${scaleStr})`
      if (!geometry.isPhone) {
        item.el.style.setProperty('--ch-glow', glowStr)
      }
    }

    const markProgress = clamp01((p - MARK_FROM) / (MARK_TO - MARK_FROM))
    setMarkShift(geometry.markShift * easeInOutSine(markProgress))
    setMarkGlow(Math.sin(Math.PI * markProgress) * 0.42)
    setFullOpacity(brandIn)
    setMarkOpacity(markOpacityAt(p))

    if (p >= LAND_AT && !landed) {
      landed = true
      flashLogo()
    } else if (p < LAND_AT - 0.04) {
      landed = false
    }
  }

  const onLenisScroll = (e) => {
    lastLenisTime = performance.now()
    render(e.detail.scroll)
  }

  const onNativeScroll = () => {
    if (performance.now() - lastLenisTime < 32) return
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      render(window.scrollY)
    })
  }

  const remeasure = () => {
    const ok = measure()
    lastScroll = -1
    if (!ok) {
      render(window.scrollY)
      if (retries < 2 && title.classList.contains('is-glitching')) {
        retries += 1
        setTimeout(remeasure, 420)
      }
      return
    }
    render(window.scrollY)
  }

  const scheduleRemeasure = () => {
    if (measureFrame) return
    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0
      remeasure()
    })
  }

  // On mobile, scrolling collapses/expands the address bar and fires `resize`
  // without changing width — ignore height-only resizes so the dock never jumps.
  const onResize = () => {
    if (window.innerWidth === lastWidth) return
    lastWidth = window.innerWidth
    scheduleRemeasure()
  }

  remeasure()

  window.addEventListener('ui:scroll', onLenisScroll)
  window.addEventListener('scroll', onNativeScroll, { passive: true })
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', scheduleRemeasure)
  window.addEventListener('pageshow', scheduleRemeasure)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure)
}
