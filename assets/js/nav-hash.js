/**
 * Pure URL hash and scroll-spy helpers (unit tested in tests/nav-hash.test.mjs).
 */

/**
 * Determine which top-level section is currently active for the viewport.
 *
 * @param {object} params
 * @param {number} params.scrollY Current vertical scroll offset in px.
 * @param {number} params.innerHeight Viewport height in px.
 * @param {number} params.scrollHeight Total document scroll height in px.
 * @param {number} params.headerHeight Fixed header height in px.
 * @param {Array<{id: string, top: number}>} params.sections Sections in document order, with `top` relative to viewport.
 * @returns {string|null} Active section id, or null when no sections are provided.
 */
export function activeSectionId({ scrollY, innerHeight, scrollHeight, headerHeight, sections }) {
  if (!sections || !sections.length) return null
  if (scrollY <= 40) return sections[0].id
  if (scrollY + innerHeight >= scrollHeight - 40) return sections[sections.length - 1].id

  const threshold = headerHeight + Math.min(180, innerHeight * 0.3)
  let active = sections[0].id
  for (const section of sections) {
    if (section.top <= threshold) active = section.id
    else break
  }
  return active
}

/**
 * Compute the URL hash that should appear in the address bar as the user scrolls.
 *
 * Keeps deep-link sub-targets (like `#project-cv-builder`) intact while the
 * visitor remains inside that parent section, and clears the hash at `#home`.
 *
 * @param {object} params
 * @param {string|null} params.activeId Currently active top-level section id.
 * @param {string} params.currentHash Current `window.location.hash`.
 * @param {string|null} params.currentTargetSectionId Parent section id of `currentHash`, if any.
 * @returns {string} Hash string (`''` for top/home, otherwise `'#<id>'`).
 */
export function nextHashForScroll({ activeId, currentHash, currentTargetSectionId }) {
  if (!activeId) return currentHash
  if (currentHash && currentHash !== '#' + activeId && currentTargetSectionId === activeId) {
    return currentHash
  }
  return activeId === 'home' ? '' : '#' + activeId
}
