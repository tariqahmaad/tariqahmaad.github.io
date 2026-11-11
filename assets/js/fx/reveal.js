/**
 * Scroll reveals. Elements fade/slide in once as they enter the viewport, with a
 * small stagger between siblings. Hidden state only exists under
 * `html.reveal-ready` (set here), so content never depends on JS succeeding, and
 * the classes are removed afterwards so normal hover transitions take over.
 */
import { reducedMotion, root } from './env.js'

const TARGETS = [
  '.section-title',
  '.about-me .row > *',
  '.count-card',
  '.skill-card',
  '.resume-item',
  '.project-tile',
  '.testimonials-slider',
  '.info-box',
  '.php-email-form'
].join(',')

const STAGGER_MS = 70
const MAX_DELAY_MS = 350
const CLEANUP_MS = 900

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const elements = [...document.querySelectorAll(TARGETS)].filter((el) => !el.closest('.hero'))

  elements.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((n) => elements.includes(n))
    const index = Math.max(0, siblings.indexOf(el))
    el.style.setProperty('--reveal-delay', Math.min(index * STAGGER_MS, MAX_DELAY_MS) + 'ms')
    el.classList.add('reveal')
  })
  root.classList.add('reveal-ready')

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const el = entry.target
      observer.unobserve(el)
      el.classList.add('is-visible')
      const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0
      setTimeout(() => {
        el.classList.remove('reveal', 'is-visible')
        el.style.removeProperty('--reveal-delay')
      }, CLEANUP_MS + delay)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })

  elements.forEach((el) => observer.observe(el))
}
