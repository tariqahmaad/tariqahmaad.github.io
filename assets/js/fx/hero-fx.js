/**
 * Hero effects:
 *  - decode intro: the name resolves from scrambled glyphs, left to right
 *  - glitch bursts on the name: two RGB-split slices, a jitter/skew and a flash,
 *    re-randomised every ~55ms so no two bursts look alike
 *  - count-up of the highlight numbers
 *
 * Everything waits for the boot sequence and is skipped for reduced motion (the
 * static HTML already shows the final text and values).
 */
import { finePointer, reducedMotion } from './env.js'

const title = document.querySelector('.hero__title')
const hero = document.getElementById('home')

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$<>/'
const rand = (min, max) => min + Math.random() * (max - min)

if (title && hero && !reducedMotion.matches) {
  const finalText = title.textContent.trim()
  let heroVisible = true
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting }).observe(hero)
  }

  /* ---------- Glitch burst ---------- */
  const STEP_MS = 55
  const BURST_MS = 330
  let bursting = false
  let decoding = false

  const setBurstVars = (intensity) => {
    const s = title.style
    s.setProperty('--g-y1', rand(0, 70).toFixed(1))
    s.setProperty('--g-h1', rand(8, 28).toFixed(1))
    s.setProperty('--g-dx1', (rand(-16, 16) * intensity).toFixed(1))
    s.setProperty('--g-y2', rand(0, 70).toFixed(1))
    s.setProperty('--g-h2', rand(6, 24).toFixed(1))
    s.setProperty('--g-dx2', (rand(-16, 16) * intensity).toFixed(1))
    s.setProperty('--g-shift', (rand(-5, 5) * intensity).toFixed(1))
    s.setProperty('--g-skew', (Math.random() < 0.4 ? rand(-4, 4) * intensity : 0).toFixed(1))
    s.setProperty('--g-bright', (1 + rand(0, 0.4) * intensity).toFixed(2))
  }

  const clearBurstVars = () => {
    ;['y1', 'h1', 'dx1', 'y2', 'h2', 'dx2', 'shift', 'skew', 'bright'].forEach((name) => title.style.removeProperty('--g-' + name))
  }

  const burst = (duration = BURST_MS) => {
    if (bursting || decoding || document.hidden) return
    bursting = true
    title.classList.add('is-glitching')
    const start = performance.now()
    const step = () => {
      const elapsed = performance.now() - start
      if (elapsed >= duration) {
        title.classList.remove('is-glitching')
        clearBurstVars()
        bursting = false
        // now and then the glitch hits twice
        if (duration === BURST_MS && Math.random() < 0.33) setTimeout(() => burst(190), 110)
        return
      }
      // settle down over the last quarter of the burst
      const intensity = elapsed > duration * 0.75 ? 0.45 : 1
      setBurstVars(intensity)
      setTimeout(step, STEP_MS)
    }
    step()
  }

  const scheduleNext = () => {
    setTimeout(() => {
      if (heroVisible) burst()
      scheduleNext()
    }, 5000 + Math.random() * 4000)
  }

  // Hover (mouse) and tap (touch) also trigger it, rate-limited
  let lastManual = 0
  const manual = () => {
    const now = performance.now()
    if (now - lastManual < 1200) return
    lastManual = now
    burst()
  }
  if (finePointer.matches) title.addEventListener('pointerenter', manual)
  title.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') manual() })

  /* ---------- Decode intro ---------- */
  const decode = (done) => {
    const DURATION_MS = 950
    const FRAME_MS = 32
    const letters = [...finalText]
    // Screen readers must never hear the scramble
    title.setAttribute('aria-label', finalText)
    title.classList.add('is-decoding')
    decoding = true
    const start = performance.now()
    let last = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      if (now - last >= FRAME_MS || t === 1) {
        last = now
        const locked = Math.floor(t * letters.length * 1.1)
        title.textContent = letters
          .map((ch, i) => (ch === ' ' || i < locked ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join('')
      }
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        title.textContent = finalText
        title.classList.remove('is-decoding')
        decoding = false
        done()
      }
    }
    requestAnimationFrame(tick)
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

  document.addEventListener('boot:done', () => {
    countUp()
    decode(() => {
      setTimeout(burst, 700) // a first hit right after the name lands
      scheduleNext()
    })
  }, { once: true })
}
