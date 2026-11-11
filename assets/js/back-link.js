/**
 * "Back to projects" on the case-study pages.
 *
 * The link is a real `<a href="/#projects" data-back>`, so it works without JS.
 * With JS, if the visitor arrived from this site's home page we use the browser
 * history instead, so they land exactly where they were (same scroll position in
 * the projects list) rather than being thrown at the section's top.
 */

/**
 * Should the click go through history.back() instead of following the link?
 * Only when the previous page was this site's home page and there is somewhere to go back to.
 */
export function shouldGoBack({ referrer, origin, historyLength }) {
  if (!referrer || !origin || historyLength <= 1) return false
  let ref
  try {
    ref = new URL(referrer)
  } catch {
    return false
  }
  if (ref.origin !== origin) return false
  return ref.pathname === '/' || ref.pathname === '/index.html'
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[data-back]')
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    if (shouldGoBack({ referrer: document.referrer, origin: window.location.origin, historyLength: window.history.length })) {
      event.preventDefault()
      window.history.back()
    }
  })
}
