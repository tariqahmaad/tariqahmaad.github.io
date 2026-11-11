/**
 * Cursor ring for mouse users. The native cursor stays visible (nothing is
 * hidden), the ring just trails it and grows over interactive elements.
 * Not created for touch or reduced-motion users.
 */
import { finePointer, reducedMotion } from './env.js'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, .project-tile'
const EASE = 0.2

if (finePointer.matches && !reducedMotion.matches) {
  const ring = document.createElement('div')
  ring.className = 'cursor-ring'
  ring.setAttribute('aria-hidden', 'true')
  document.body.appendChild(ring)

  let targetX = -100
  let targetY = -100
  let x = targetX
  let y = targetY
  let frame = 0

  const render = () => {
    x += (targetX - x) * EASE
    y += (targetY - y) * EASE
    ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 ? requestAnimationFrame(render) : 0
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    targetX = e.clientX
    targetY = e.clientY
    ring.classList.add('is-visible')
    ring.classList.toggle('is-active', !!e.target.closest(INTERACTIVE))
    if (!frame) frame = requestAnimationFrame(render)
  }, { passive: true })

  document.addEventListener('pointerleave', () => ring.classList.remove('is-visible'))
  window.addEventListener('pointerdown', () => ring.classList.add('is-pressed'))
  window.addEventListener('pointerup', () => ring.classList.remove('is-pressed'))
}
