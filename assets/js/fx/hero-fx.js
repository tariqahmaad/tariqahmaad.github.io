/**
 * Hero effects:
 *  - decode intro: the name resolves from scrambled glyphs, left to right
 *  - glitch bursts: several clipped colour copies of the name, a scan sweep,
 *    decorative glyph corruption and a short jolt/flash
 *  - pointer chroma: a subtle RGB fringe that follows the cursor over the name
 *  - count-up of the highlight numbers
 *
 * Everything waits for the boot sequence and is skipped for reduced motion (the
 * static HTML already shows the final text and values).
 *
 * The colour copies are empty <span>s: their text comes from attr(data-text) in
 * CSS, so they add nothing to the document's text. The real name is only ever
 * changed through its text node - assigning title.textContent would delete the
 * copies, and tests/hero-glitch.test.mjs guards that.
 */
import { finePointer, reducedMotion } from './env.js'
import { band, between, chance, corrupt, pick, DECODE_GLYPHS } from './glitch.js'

const BURST_MS = [260, 380]
const REVEAL_MS = [360, 460]
const BURST_STEP_MS = [45, 65]
const TICK_MS = [80, 140]
const TICK_STEP_MS = [55, 75]
const BURST_GAP_MS = [7000, 12000]
const TICK_GAP_MS = [5000, 8500]
const TICK_PROBABILITY = 0.4
const EVENT_COOLDOWN_MS = 2200
const HOVER_COOLDOWN_MS = 900
const DOUBLE_HIT_PROBABILITY = 0.28
const SETTLE_AT = 0.72
const SETTLE_SCALE = 0.4
const REVEAL_BOOST = 1.2
const REVEAL_DELAY_MS = [500, 800]
const DECODE_MS = 950
const DECODE_FRAME_MS = 30
const FONT_WAIT_MS = 900
const AMPLITUDE_WIDTH = 820
const TITLE_VARS = [
  '--g-y1', '--g-h1', '--g-dx1', '--g-a1',
  '--g-y2', '--g-h2', '--g-dx2', '--g-a2',
  '--g-shift', '--g-lift', '--g-skew', '--g-bright', '--g-glow',
  '--g-hx', '--g-hy'
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const rand = (min, max) => between(Math.random, min, max)

const title = document.getElementById('hero-title')
const hero = document.getElementById('home')

const init = () => {
  const finalText = title.dataset.text || title.textContent.trim()
  const textNode = [...title.childNodes].find((node) => node.nodeType === 3 && node.nodeValue.trim())
  if (!textNode) return

  // Screen readers get the final name even while the glyphs are scrambled and
  // while the decorative copies are visible.
  title.setAttribute('aria-label', finalText)

  const layers = []
  const fx = document.createElement('span')
  fx.className = 'hero__title-fx'
  fx.setAttribute('aria-hidden', 'true')

  const makeLayer = (modifier) => {
    const node = document.createElement('span')
    node.className = `hero__glitch hero__glitch--${modifier}`
    node.dataset.text = finalText
    fx.appendChild(node)
    layers.push(node)
    return node
  }

  makeLayer('green')
  makeLayer('cyan')
  makeLayer('magenta')
  makeLayer('white')

  // The scan layer is optional: without background-clip: text it would paint a
  // rectangle instead of a band, so it is not created at all.
  const supportsTextClip = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' &&
    (CSS.supports('-webkit-background-clip', 'text') || CSS.supports('background-clip', 'text'))
  const scan = supportsTextClip ? makeScanLayer(fx, finalText) : null

  title.appendChild(fx)

  /* ---------- State ---------- */
  const heroRect = hero.getBoundingClientRect()
  let heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting }).observe(hero)
  }

  let amplitude = 1
  let decoding = false
  let bursting = false
  let stopped = false
  let lastEvent = 0
  let lastManual = 0
  let burstFrame = 0
  let decodeFrame = 0
  let hoverFrame = 0

  const timers = new Set()
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id)
      if (!stopped) fn()
    }, ms)
    timers.add(id)
    return id
  }
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers.clear()
  }

  /* ---------- Shared helpers ---------- */
  const setVar = (name, value) => title.style.setProperty(name, String(value))
  const clearVars = () => TITLE_VARS.forEach((name) => title.style.removeProperty(name))

  const titleIsDocked = () => title.style.opacity !== ''

  const canGlitch = () => {
    if (stopped || bursting || decoding || reducedMotion.matches) return false
    if (!heroVisible || document.hidden) return false
    if (document.documentElement.classList.contains('nav-open')) return false
    if (title.style.opacity !== '') return false
    const rect = title.getBoundingClientRect()
    return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight
  }

  const measureAmplitude = () => {
    amplitude = clamp(title.getBoundingClientRect().width / AMPLITUDE_WIDTH, 0.55, 1.1)
  }

  const sliceStyles = (node, slice, dx, dy, opacity) => {
    node.style.clipPath = `inset(${slice.top.toFixed(2)}% 0 ${slice.bottom.toFixed(2)}% 0)`
    node.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`
    node.style.opacity = clamp(opacity, 0, 1).toFixed(2)
  }

  const resetVisuals = () => {
    title.classList.remove('is-glitching', 'is-hovering')
    clearVars()
    layers.forEach((node) => {
      node.style.opacity = '0'
      node.style.removeProperty('clip-path')
      node.style.removeProperty('transform')
      node.dataset.text = finalText
    })
    if (scan) {
      scan.style.opacity = '0'
      scan.style.removeProperty('--g-scan')
    }
  }

  const clearHover = () => {
    if (hoverFrame) cancelAnimationFrame(hoverFrame)
    hoverFrame = 0
    title.classList.remove('is-hovering')
    title.style.removeProperty('--g-hx')
    title.style.removeProperty('--g-hy')
  }

  /* ---------- One glitch frame ---------- */
  const renderFrame = (progress, mode, boost) => {
    const full = mode !== 'tick'
    const settle = progress > SETTLE_AT ? SETTLE_SCALE : 1
    const scale = (full ? 1 : 0.3) * settle * boost
    const amp = amplitude * scale

    if (full) {
      setVar('--g-shift', (rand(-6, 6) * scale).toFixed(2))
      setVar('--g-lift', (rand(-2, 2) * scale).toFixed(2))
      setVar('--g-skew', chance(Math.random, 0.4) ? (rand(-2.5, 2.5) * scale).toFixed(2) : '0')
      setVar('--g-bright', Math.min(1.4, 1 + rand(0.1, 0.35) * settle * boost).toFixed(2))
      setVar('--g-glow', (rand(10, 26) * settle).toFixed(1))
    } else {
      setVar('--g-shift', rand(-1.2, 1.2).toFixed(2))
      setVar('--g-lift', rand(-0.6, 0.6).toFixed(2))
      setVar('--g-skew', '0')
      setVar('--g-bright', (1 + rand(0.01, 0.06)).toFixed(2))
      setVar('--g-glow', '0')
    }

    setVar('--g-dx1', (rand(-1, 1) * 30 * amp).toFixed(1))
    setVar('--g-dx2', (rand(-1, 1) * 30 * amp).toFixed(1))

    // The two original pseudo-element slices.
    const first = band(Math.random, full ? 2 : 1.5, full ? 18 : 5)
    setVar('--g-y1', first.top.toFixed(2))
    setVar('--g-h1', first.height.toFixed(2))
    setVar('--g-a1', full
      ? (chance(Math.random, 0.85) ? rand(0.55, 0.95) : 0).toFixed(2)
      : rand(0.3, 0.6).toFixed(2))

    const second = band(Math.random, 1.5, full ? 14 : 4)
    setVar('--g-y2', second.top.toFixed(2))
    setVar('--g-h2', second.height.toFixed(2))
    setVar('--g-a2', full
      ? (chance(Math.random, 0.6) ? rand(0.45, 0.9) : 0).toFixed(2)
      : '0')

    // The JS-built copies. A tick lights up one or two of them; a full burst
    // always shows the cyan one, so every burst has a visible tear.
    let tickLayers = null
    if (!full) {
      tickLayers = new Set([pick(Math.random, layers)])
      if (chance(Math.random, 0.35)) tickLayers.add(pick(Math.random, layers))
    }

    layers.forEach((node, index) => {
      const white = index === 3
      const active = full
        ? (index === 1 || chance(Math.random, index === 2 ? 0.85 : index === 0 ? 0.6 : 0.5))
        : tickLayers.has(node)

      node.dataset.text = finalText
      if (!active) {
        node.style.opacity = '0'
        return
      }

      const heavy = full && index === 1 && progress < 0.2
      const slice = band(
        Math.random,
        white ? 1 : full ? 3 : 1.5,
        white ? 5 : heavy ? 20 : full ? 18 : 6
      )
      let opacity = full ? rand(0.45, 0.95) * settle : rand(0.3, 0.6)
      if (index === 0) opacity *= 0.65 // green is depth, not a highlight

      sliceStyles(
        node,
        slice,
        rand(-1, 1) * (white ? 34 : 26) * amp,
        full ? rand(-2, 2) * settle : rand(-0.4, 0.4),
        opacity
      )

      if (chance(Math.random, full ? 0.25 : 0.12)) {
        node.dataset.text = corrupt(Math.random, finalText, chance(Math.random, 0.4) ? 2 : 1)
      }
    })

    if (scan) {
      if (full) {
        scan.style.opacity = (rand(0.55, 0.9) * settle).toFixed(2)
        scan.style.setProperty('--g-scan', (-25 + progress * 150).toFixed(1))
      } else {
        scan.style.opacity = '0'
      }
    }
  }

  /* ---------- Burst lifecycle ---------- */
  const startBurst = (mode = 'full', boost = 1) => {
    if (!canGlitch()) return
    const full = mode !== 'tick'
    bursting = true
    lastEvent = performance.now()
    title.classList.remove('is-hovering')
    title.classList.add('is-glitching')
    measureAmplitude()

    const duration = full
      ? (boost > 1 ? rand(REVEAL_MS[0], REVEAL_MS[1]) : rand(BURST_MS[0], BURST_MS[1]))
      : rand(TICK_MS[0], TICK_MS[1])
    const stepMs = full ? rand(BURST_STEP_MS[0], BURST_STEP_MS[1]) : rand(TICK_STEP_MS[0], TICK_STEP_MS[1])
    const startedAt = performance.now()
    let lastStep = -Infinity

    const frame = (now) => {
      if (stopped || !bursting) return
      if (
        document.hidden ||
        !heroVisible ||
        titleIsDocked() ||
        document.documentElement.classList.contains('nav-open')
      ) {
        endBurst(true, mode)
        return
      }
      const elapsed = now - startedAt
      if (elapsed >= duration) {
        endBurst(false, mode)
        return
      }
      if (elapsed - lastStep >= stepMs) {
        lastStep = elapsed
        renderFrame(Math.min(1, elapsed / duration), mode, boost)
      }
      burstFrame = requestAnimationFrame(frame)
    }
    burstFrame = requestAnimationFrame(frame)
  }

  const endBurst = (aborted, mode) => {
    if (!bursting) return
    bursting = false
    if (burstFrame) cancelAnimationFrame(burstFrame)
    burstFrame = 0
    resetVisuals()
    if (!aborted && mode !== 'tick' && chance(Math.random, DOUBLE_HIT_PROBABILITY)) {
      later(() => startBurst('tick'), rand(120, 220))
    }
  }

  const cancelActiveGlitch = () => {
    if (burstFrame) cancelAnimationFrame(burstFrame)
    burstFrame = 0
    bursting = false
    resetVisuals()
  }

  /* ---------- Scheduling ---------- */
  const scheduleBurst = () => {
    if (stopped) return
    later(() => {
      if (stopped) return
      if (canGlitch()) startBurst('full')
      scheduleBurst()
    }, rand(BURST_GAP_MS[0], BURST_GAP_MS[1]))
  }

  const scheduleTick = () => {
    if (stopped) return
    later(() => {
      if (stopped) return
      if (
        finePointer.matches &&
        canGlitch() &&
        performance.now() - lastEvent > EVENT_COOLDOWN_MS &&
        chance(Math.random, TICK_PROBABILITY)
      ) {
        startBurst('tick')
      }
      scheduleTick()
    }, rand(TICK_GAP_MS[0], TICK_GAP_MS[1]))
  }

  /* ---------- Decode intro ---------- */
  const decode = (done) => {
    if (stopped) return
    const letters = [...finalText]
    const rect = title.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(title).lineHeight) || rect.height
    // Only clamp to one line when the final name is a single line: on a very
    // narrow screen that wraps, nowrap would cause a layout jump at the end.
    if (rect.height <= lineHeight * 1.5) title.classList.add('is-decoding')
    decoding = true

    const lockAt = letters.map((char, index) => {
      if (char === ' ') return 0
      const base = 0.08 + (index / Math.max(1, letters.length - 1)) * 0.8
      return clamp(base + rand(-0.04, 0.04), 0.04, 0.92)
    })

    const startedAt = performance.now()
    let last = 0

    const finish = () => {
      decoding = false
      title.classList.remove('is-decoding')
      textNode.nodeValue = finalText
      done()
    }

    const frame = (now) => {
      if (stopped) return
      // The dock owns the name once the page scrolls: stop scrambling it.
      if (titleIsDocked()) {
        finish()
        return
      }
      const progress = Math.min(1, (now - startedAt) / DECODE_MS)
      if (now - last >= DECODE_FRAME_MS || progress === 1) {
        last = now
        textNode.nodeValue = letters.map((char, index) => {
          if (char === ' ' || progress >= lockAt[index]) return char
          return DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)]
        }).join('')
      }
      if (progress < 1) decodeFrame = requestAnimationFrame(frame)
      else finish()
    }
    decodeFrame = requestAnimationFrame(frame)
  }

  /* ---------- Count-up ---------- */
  const countUp = () => {
    const DURATION_MS = 1100
    document.querySelectorAll('.hero__stats [data-count]').forEach((el) => {
      const end = Number(el.dataset.count)
      if (!Number.isFinite(end)) return
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION_MS)
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))))
        if (t < 1) requestAnimationFrame(tick)
      }
      el.textContent = '0'
      requestAnimationFrame(tick)
    })
  }

  /* ---------- Pointer interaction ---------- */
  if (finePointer.matches) {
    title.addEventListener('pointerenter', () => {
      const now = performance.now()
      if (now - lastManual < HOVER_COOLDOWN_MS) return
      lastManual = now
      startBurst('full')
    })

    let hoverX = 0
    let hoverY = 0
    title.addEventListener('pointermove', (event) => {
      if (stopped || bursting || decoding) return
      hoverX = event.clientX
      hoverY = event.clientY
      if (hoverFrame) return
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0
        if (stopped || bursting || decoding) return
        const rect = title.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return
        const x = clamp(((hoverX - rect.left) / rect.width - 0.5) * 2, -1, 1)
        const y = clamp(((hoverY - rect.top) / rect.height - 0.5) * 2, -1, 1)
        title.classList.add('is-hovering')
        title.style.setProperty('--g-hx', `${(x * 2.5).toFixed(2)}px`)
        title.style.setProperty('--g-hy', `${(y * 1.5).toFixed(2)}px`)
      })
    }, { passive: true })

    title.addEventListener('pointerleave', clearHover)
    title.addEventListener('pointercancel', clearHover)
  }

  title.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return
    const now = performance.now()
    if (now - lastManual < HOVER_COOLDOWN_MS) return
    lastManual = now
    startBurst('full')
  })

  /* ---------- Page lifecycle ---------- */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return
    clearHover()
    cancelActiveGlitch()
  })

  window.addEventListener('pageshow', () => {
    clearHover()
    cancelActiveGlitch()
  })

  const stop = () => {
    if (stopped) return
    stopped = true
    if (burstFrame) cancelAnimationFrame(burstFrame)
    if (decodeFrame) cancelAnimationFrame(decodeFrame)
    if (hoverFrame) cancelAnimationFrame(hoverFrame)
    burstFrame = decodeFrame = hoverFrame = 0
    bursting = false
    decoding = false
    clearTimers()
    title.classList.remove('is-decoding')
    resetVisuals()
    textNode.nodeValue = finalText
    title.setAttribute('aria-label', finalText)
    fx.remove()
  }

  const onMotionChange = (event) => {
    if (event.matches) stop()
  }
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', onMotionChange)
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(onMotionChange)

  /* ---------- Start ---------- */
  const waitForFonts = (ms) => new Promise((resolve) => {
    let settled = false
    let timer = 0
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve()
    }
    timer = setTimeout(finish, ms)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(finish, finish)
    else finish()
  })

  const begin = () => {
    scheduleBurst()
    scheduleTick()
  }

  document.addEventListener('boot:done', () => {
    countUp()
    waitForFonts(FONT_WAIT_MS).then(() => {
      if (stopped) return
      // A deep link or a restored scroll position can start with the hero (or
      // the name) off screen: leave the static name alone until it is back.
      if (!heroVisible || document.hidden || titleIsDocked()) {
        begin()
        return
      }
      decode(() => {
        if (stopped) return
        later(() => startBurst('full', REVEAL_BOOST), rand(REVEAL_DELAY_MS[0], REVEAL_DELAY_MS[1]))
        begin()
      })
    })
  }, { once: true })
}

const makeScanLayer = (parent, text) => {
  const node = document.createElement('span')
  node.className = 'hero__title-scan'
  node.dataset.text = text
  parent.appendChild(node)
  return node
}

if (title && hero && !reducedMotion.matches) init()
