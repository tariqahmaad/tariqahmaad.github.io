/**
 * Boot sequence, shown once per session. The inline script in <head> decides
 * whether it runs (`html.boot-pending`: not reduced motion, not seen yet) and
 * clears the flag after 4.5s as a safety net. Any click or key skips it.
 */
import { root } from './env.js'

const LINES = [
  '$ boot tariq.dev',
  '> mounting portfolio ............ ok',
  '> loading modules (7) ........... ok',
  '> linking assistant ............. ok',
  '> ready.'
]
const CHAR_MS = 14
const LINE_PAUSE_MS = 90
const SHUTTER_MS = 800

const boot = document.getElementById('boot')
const log = document.getElementById('boot-log')
const bar = document.getElementById('boot-bar')

if (boot && log && bar && root.classList.contains('boot-pending')) {
  let finished = false
  const timers = []
  const later = (fn, ms) => timers.push(setTimeout(fn, ms))

  const finish = () => {
    if (finished) return
    finished = true
    timers.forEach(clearTimeout)
    window.removeEventListener('keydown', finish)
    window.removeEventListener('pointerdown', finish)
    boot.classList.add('is-done')
    try { sessionStorage.setItem('booted', '1') } catch { /* storage blocked */ }
    setTimeout(() => {
      root.classList.remove('boot-pending')
      document.dispatchEvent(new CustomEvent('boot:done'))
    }, SHUTTER_MS)
  }

  window.addEventListener('keydown', finish)
  window.addEventListener('pointerdown', finish)

  let lineIndex = 0
  const typeLine = () => {
    if (finished) return
    if (lineIndex >= LINES.length) {
      bar.style.width = '100%'
      later(finish, 280)
      return
    }
    const text = LINES[lineIndex]
    let i = 0
    const step = () => {
      if (finished) return
      log.textContent += text[i++]
      if (i < text.length) {
        later(step, CHAR_MS)
      } else {
        log.textContent += '\n'
        lineIndex++
        bar.style.width = Math.round((lineIndex / LINES.length) * 100) + '%'
        later(typeLine, LINE_PAUSE_MS)
      }
    }
    step()
  }
  typeLine()
} else {
  // Nothing to show: let effects that wait for the boot start right away.
  queueMicrotask(() => document.dispatchEvent(new CustomEvent('boot:done')))
}
