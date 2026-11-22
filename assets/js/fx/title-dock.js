/**
 * Title dock: as the page scrolls, the hero name lifts out of the hero and
 * compresses onto the navbar wordmark, reversing when the visitor scrolls back.
 *
 * A fixed copy of the name (`.hero-title-ghost`) is moved with a transform while
 * the real <h1> stays in the flow and only fades: the hero layout never reflows
 * and the name remains in the document once (the copy is aria-hidden). The
 * flight is a pure function of the scroll position, so it is reversible and
 * needs no state machine. Skipped entirely for reduced motion, on narrow screens
 * where the name wraps, and on pages without a hero.
 *
 * The navbar shows the compact "TA" while the hero is in view and the full name
 * once the name has docked. The copy starts exactly on the <h1> (same class, same
 * tracking) and ends on `.site-logo__full` with that wordmark's font size *and*
 * letter-spacing, so the hand-over is pixel-aligned instead of a doubled word.
 * The mark never fades: its T and A are the columns the incoming letters merge
 * onto, and the full name fades in over them when the copy lands.
 */
import { reducedMotion } from './env.js'

const DETACH_GAP = 96 // px below the header bar where the name detaches
const FLIGHT_MIN = 180 // shortest / longest flight, in px of scrolling
const FLIGHT_MAX = 420
const LAUNCH_FADE = 0.03 // h1 / copy cross-fade at the start (they overlap there)
const LAND_AT = 0.55 // the flight completes here: the copy is exactly on the wordmark
const MARK_FROM = 0.05 // the compact "TA" starts spacing as the page moves...
const MARK_TO = 0.5 // ...so its A reaches the AHMAD column as the name lands
const HANDOFF_FROM = 0.52 // the copy hands over to the real wordmark...
const HANDOFF_TO = 0.62 // ...right at the landing, and the mark stays underneath
const FLASH_MS = 560

const title = document.getElementById('hero-title')
const brand = document.querySelector('.site-logo__full')
const brandShort = document.querySelector('.site-logo__short')
const brandShortA = document.querySelector('.site-logo__short-a')
const header = document.getElementById('site-header')

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const lerp = (from, to, t) => from + (to - from) * t
const smoothstep = (t, from, to) => {
  const x = clamp01((t - from) / (to - from))
  return x * x * (3 - 2 * x)
}
// Fast lift, slow settle: also what keeps the shrinking name clear of the hero
// copy below it while that copy scrolls up.
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)

if (title && brand && brandShort && brandShortA && header && !reducedMotion.matches) {
  const logo = brand.closest('.site-logo')
  const ghost = document.createElement('span')
  ghost.className = 'hero__title hero-title-ghost'
  ghost.setAttribute('aria-hidden', 'true')
  ghost.textContent = title.dataset.text || title.textContent.trim()
  document.body.appendChild(ghost)

  let geometry = null
  let mode = ''
  let fullOpacity = null
  let landed = false
  let retries = 0
  let flashTimer = 0
  let frame = 0
  let measureFrame = 0

  const setFullOpacity = (value) => {
    if (value === fullOpacity) return
    fullOpacity = value
    brand.style.opacity = String(value)
  }

  const setMarkShift = (value) => {
    if (!value) {
      brandShortA.style.transform = 'none'
      return
    }
    brandShortA.style.transform = `translate3d(${value.toFixed(2)}px, 0, 0)`
  }

  // A soft HUD glow rides the mark while its A is in motion.
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
    void logo.offsetWidth // restart the pulse if it is already running
    logo.classList.add('is-docked')
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => logo.classList.remove('is-docked'), FLASH_MS)
  }

  /* Cache both boxes. They only change on resize, font swap or rotation, so this
     never runs inside a scroll frame. */
  const measure = () => {
    // The h1's inline glitch transform would skew its box: keep the last one.
    if (title.classList.contains('is-glitching')) return false

    ghost.style.transform = 'none' // a stale transform would corrupt its own box
    brandShortA.style.transform = 'none' // measure the compact "TA" position
    const rect = title.getBoundingClientRect()
    const ghostRect = ghost.getBoundingClientRect()
    const brandRect = brand.getBoundingClientRect()
    const shortARect = brandShortA.getBoundingClientRect()
    const layout = getComputedStyle(title)
    const brandStyle = getComputedStyle(brand)
    const lineHeight = parseFloat(layout.lineHeight) || rect.height

    // How far the mark's A has to travel to sit on the AHMAD column.
    let markShift = 0
    const fullText = brand.firstChild
    if (fullText && fullText.nodeType === 3) {
      const aIndex = brand.textContent.indexOf(' ') + 1
      if (aIndex > 0 && aIndex + 1 <= fullText.length) {
        const range = document.createRange()
        range.setStart(fullText, aIndex)
        range.setEnd(fullText, aIndex + 1)
        markShift = range.getBoundingClientRect().left - shortARect.left
      }
    }

    // A wrapped name (very narrow screens) has no single line to dock from.
    if (rect.height > lineHeight * 1.5 || ghostRect.width < 1 || brandRect.width < 1) {
      geometry = null
      return false
    }

    const headerBottom = header.getBoundingClientRect().bottom
    const docTop = rect.top + window.scrollY
    const startScroll = Math.max(0, docTop - (headerBottom + DETACH_GAP))
    const endScale = Math.min(
      1,
      Math.max(0.02, parseFloat(brandStyle.fontSize) / (parseFloat(layout.fontSize) || 1))
    )

    geometry = {
      startScroll,
      // The flight lasts exactly until the original slot has scrolled away.
      flight: Math.min(FLIGHT_MAX, Math.max(FLIGHT_MIN, docTop + rect.height - startScroll)),
      startX: rect.left,
      startY: docTop - startScroll,
      endX: brandRect.left,
      endY: brandRect.top + (brandRect.height - ghostRect.height * endScale) / 2,
      endScale,
      startTracking: parseFloat(layout.letterSpacing) || 0,
      // Local px that lands on the wordmark's rendered tracking at endScale.
      endTracking: (parseFloat(brandStyle.letterSpacing) || 0) / endScale,
      markShift
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
      setMarkShift(0)
      setMarkGlow(0)
      landed = false
    } else if (next === 'docked') {
      ghost.style.visibility = 'hidden'
      ghost.style.opacity = '0'
      title.style.opacity = '0'
      setFullOpacity(1)
      // The mark stays spaced underneath; its A shares the wordmark's column.
      setMarkShift(geometry ? geometry.markShift : 0)
      setMarkGlow(0)
      landed = true
    }
  }

  const apply = () => {
    if (!geometry) {
      setMode('rest') // the static mark: "TA" only
      return
    }

    const p = clamp01((window.scrollY - geometry.startScroll) / geometry.flight)

    if (p <= 0) {
      // The hero is in view: the navbar shows the initials.
      setMode('rest')
      return
    }
    if (p >= 1) {
      // Docked: the navbar shows the full name.
      setMode('docked')
      return
    }

    mode = 'flight'
    // The flight is finished at LAND_AT; after that the name is simply docked.
    const ease = easeOutQuad(clamp01(p / LAND_AT))
    const scale = 1 + (geometry.endScale - 1) * ease
    const launch = smoothstep(p, 0, LAUNCH_FADE)
    const handoff = smoothstep(p, HANDOFF_FROM, HANDOFF_TO)

    ghost.style.transform =
      `translate3d(${lerp(geometry.startX, geometry.endX, ease).toFixed(2)}px, ` +
      `${lerp(geometry.startY, geometry.endY, ease).toFixed(2)}px, 0) ` +
      `scale(${scale.toFixed(4)})`
    ghost.style.letterSpacing = `${lerp(geometry.startTracking, geometry.endTracking, ease).toFixed(2)}px`
    ghost.style.opacity = String(launch * (1 - handoff))
    ghost.style.visibility = 'visible'
    title.style.opacity = String(1 - launch)
    const markProgress = clamp01((p - MARK_FROM) / (MARK_TO - MARK_FROM))
    setMarkShift(geometry.markShift * easeOutQuad(markProgress))
    setMarkGlow(Math.sin(Math.PI * markProgress) * 0.55)
    setFullOpacity(handoff)

    // One pulse as the copy settles onto the wordmark.
    if (p >= LAND_AT && !landed) {
      landed = true
      flashLogo()
    } else if (p < LAND_AT - 0.02) {
      landed = false
    }
  }

  const remeasure = () => {
    const ok = measure()
    apply()
    // A glitch burst can hide the true box for ~330ms: try once more after it.
    if (!ok && retries < 2 && title.classList.contains('is-glitching')) {
      retries += 1
      setTimeout(remeasure, 420)
    }
  }

  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      apply()
    })
  }

  const scheduleRemeasure = () => {
    if (measureFrame) return
    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0
      remeasure()
    })
  }

  remeasure()

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', scheduleRemeasure)
  window.addEventListener('orientationchange', scheduleRemeasure)
  window.addEventListener('pageshow', scheduleRemeasure)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure)
}
