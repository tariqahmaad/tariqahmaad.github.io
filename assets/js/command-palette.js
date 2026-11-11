/**
 * Command palette (Ctrl/Cmd+K). Lazy-loaded ES module, bundled to
 * command-palette.min.js and imported by an inline script in index.html.
 *
 * - Built on <dialog>.showModal(): native focus trap, Escape, inert background.
 * - Commands are read from the live page (nav links, project tiles, social and
 *   mailto links, resume link) so they can never drift from the content.
 * - Everything user-visible is set with textContent, never innerHTML.
 * - Talks to the rest of the page through events: `nav:goto` and
 *   `ui:scroll-lock` (handled in main.js), and the assistant's own #chatFab.
 */
import { rankCommands } from './palette/match.js'

const GROUP_ORDER = ['Navigate', 'Projects', 'Links', 'Actions']

let dialog = null
let input = null
let list = null
let status = null
let commands = []
let visible = []
let activeIndex = 0
let lastFocus = null

/** Visible text of an element, without screen-reader-only helpers like "(opens in new tab)". */
const text = (el) => {
  if (!el) return ''
  const copy = el.cloneNode(true)
  copy.querySelectorAll('.sr-only').forEach((node) => node.remove())
  return copy.textContent.replace(/\s+/g, ' ').trim()
}

function goto(id) {
  document.dispatchEvent(new CustomEvent('nav:goto', { detail: { id } }))
}

function externalLink(href) {
  return () => window.open(href, '_blank', 'noopener,noreferrer')
}

function buildCommands() {
  const items = []

  document.querySelectorAll('#site-nav a.nav-link[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1)
    items.push({ group: 'Navigate', label: text(a), hint: 'Go to section', keywords: [id], run: () => goto(id) })
  })

  document.querySelectorAll('.project-tile[id]').forEach((tile) => {
    const title = text(tile.querySelector('h3'))
    const tags = [...tile.querySelectorAll('.tech-tag')].map(text)
    if (title) items.push({ group: 'Projects', label: title, hint: tags.slice(0, 3).join(' · '), keywords: tags, run: () => goto(tile.id) })
  })

  const social = [['linkedin', 'LinkedIn'], ['github', 'GitHub']]
  social.forEach(([cls, label]) => {
    const a = document.querySelector(`#site-nav .nav-social a.${cls}`)
    if (a) items.push({ group: 'Links', label, hint: 'Opens in a new tab', keywords: ['profile', 'social'], run: externalLink(a.href) })
  })

  const pdf = document.querySelector('[data-resume-pdf]')
  if (pdf) items.push({ group: 'Links', label: 'Download résumé (PDF)', hint: 'PDF', keywords: ['cv', 'resume', 'download'], run: () => window.open(pdf.href, '_blank', 'noopener,noreferrer') })

  const cv = document.querySelector('.resume .btn-cv')
  if (cv) items.push({ group: 'Links', label: 'Open online CV', hint: 'Opens in a new tab', keywords: ['cv', 'resume', 'builder'], run: externalLink(cv.href) })

  const mail = document.querySelector('a[href^="mailto:"]')
  if (mail) {
    const address = mail.getAttribute('href').replace(/^mailto:/, '').split('?')[0]
    items.push({ group: 'Actions', label: 'Send an email', hint: address, keywords: ['contact', 'hire', 'mail'], run: () => { window.location.href = 'mailto:' + address } })
    if (navigator.clipboard) {
      items.push({
        group: 'Actions',
        label: 'Copy email address',
        hint: address,
        keywords: ['clipboard'],
        run: () => navigator.clipboard.writeText(address).catch(() => {})
      })
    }
  }

  if (document.getElementById('chatFab')) {
    items.push({
      group: 'Actions',
      label: 'Ask the assistant',
      hint: 'Chat about my work',
      keywords: ['chat', 'bot', 'help', 'ai'],
      run: () => document.getElementById('chatFab').click()
    })
  }

  return items.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
}

function create() {
  dialog = document.createElement('dialog')
  dialog.className = 'palette'
  dialog.setAttribute('aria-label', 'Command menu')

  const head = document.createElement('div')
  head.className = 'palette__head'
  const prompt = document.createElement('span')
  prompt.className = 'palette__prompt'
  prompt.setAttribute('aria-hidden', 'true')
  prompt.textContent = '>'
  input = document.createElement('input')
  input.className = 'palette__input'
  input.type = 'text'
  input.placeholder = 'Type a command or search…'
  input.autocomplete = 'off'
  input.spellcheck = false
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-expanded', 'true')
  input.setAttribute('aria-controls', 'palette-list')
  input.setAttribute('aria-label', 'Search commands')
  const esc = document.createElement('kbd')
  esc.className = 'palette__esc'
  esc.textContent = 'Esc'
  head.append(prompt, input, esc)

  list = document.createElement('ul')
  list.className = 'palette__list'
  list.id = 'palette-list'
  list.setAttribute('role', 'listbox')
  list.setAttribute('data-lenis-prevent', '')

  status = document.createElement('p')
  status.className = 'sr-only'
  status.setAttribute('role', 'status')

  const foot = document.createElement('p')
  foot.className = 'palette__foot'
  foot.textContent = '↑↓ navigate · Enter run · Esc close'

  dialog.append(head, list, status, foot)
  document.body.appendChild(dialog)

  input.addEventListener('input', () => render(input.value))
  input.addEventListener('keydown', onKeydown)
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('li[data-index]')
    if (li && Number(li.dataset.index) !== activeIndex) setActive(Number(li.dataset.index), false)
  })
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-index]')
    if (li) run(Number(li.dataset.index))
  })
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close() }) // backdrop click
  dialog.addEventListener('close', onClose)
}

function render(query) {
  visible = rankCommands(commands, query)
  list.replaceChildren()
  let lastGroup = null
  const searching = query.trim().length > 0

  visible.forEach((command, index) => {
    if (!searching && command.group !== lastGroup) {
      const heading = document.createElement('li')
      heading.className = 'palette__group'
      heading.setAttribute('role', 'presentation')
      heading.textContent = command.group
      list.appendChild(heading)
      lastGroup = command.group
    }
    const li = document.createElement('li')
    li.className = 'palette__item'
    li.id = 'palette-opt-' + index
    li.dataset.index = String(index)
    li.setAttribute('role', 'option')
    const label = document.createElement('span')
    label.className = 'palette__label'
    label.textContent = command.label
    const hint = document.createElement('span')
    hint.className = 'palette__hint'
    hint.textContent = command.hint || ''
    li.append(label, hint)
    list.appendChild(li)
  })

  if (!visible.length) {
    const empty = document.createElement('li')
    empty.className = 'palette__empty'
    empty.setAttribute('role', 'presentation')
    empty.textContent = 'No matching commands'
    list.appendChild(empty)
  }

  status.textContent = visible.length ? `${visible.length} result${visible.length === 1 ? '' : 's'}` : 'No results'
  setActive(0, true)
}

function setActive(index, scroll) {
  if (!visible.length) {
    activeIndex = 0
    input.removeAttribute('aria-activedescendant')
    return
  }
  activeIndex = (index + visible.length) % visible.length
  list.querySelectorAll('[aria-selected="true"]').forEach((el) => el.removeAttribute('aria-selected'))
  const current = document.getElementById('palette-opt-' + activeIndex)
  if (current) {
    current.setAttribute('aria-selected', 'true')
    input.setAttribute('aria-activedescendant', current.id)
    if (scroll) current.scrollIntoView({ block: 'nearest' })
  }
}

function run(index) {
  const command = visible[index]
  if (!command) return
  dialog.close()
  // Let the dialog release scroll lock and focus before the action runs.
  setTimeout(command.run, 30)
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1, true) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1, true) }
  else if (e.key === 'Home') { e.preventDefault(); setActive(0, true) }
  else if (e.key === 'End') { e.preventDefault(); setActive(visible.length - 1, true) }
  else if (e.key === 'Enter') { e.preventDefault(); run(activeIndex) }
}

function onClose() {
  document.dispatchEvent(new CustomEvent('ui:scroll-lock', { detail: { locked: false } }))
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true })
}

export function openPalette() {
  if (!dialog) create()
  if (dialog.open) return
  lastFocus = document.activeElement
  commands = buildCommands()
  input.value = ''
  render('')
  document.dispatchEvent(new CustomEvent('ui:scroll-lock', { detail: { locked: true } }))
  dialog.showModal()
  input.focus()
}
