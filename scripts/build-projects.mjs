/**
 * Generates one static case-study page per project: projects/<slug>/index.html.
 *
 * Source of truth is assets/js/knowledge-base.js (the same data the chat
 * assistant uses), so the pages, the tiles and the chatbot cannot drift apart.
 * Run by `npm run build`; tests/projects.test.mjs fails if the committed pages
 * are stale. The ?v= cache-buster is copied from index.html.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SITE = 'https://tariqahmaad.github.io'

/** Same order as the tiles in index.html and knowledge-base.js (tests check the counts). */
export const SLUGS = [
  'cv-builder',
  'quizlet',
  'budgetwise',
  'graduation-presentation',
  'note-taking-app',
  'hospital-management',
  'digit-classifier',
  'hotel-management',
  'banking-management'
]

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const pad = (n) => String(n).padStart(2, '0')

/** Real link (works without JS); back-link.js upgrades it to history.back() when that is better. */
const backLink = (extraClass = '') => `<a class="case__back${extraClass}" href="/#projects" data-back><span class="case__back-icon" aria-hidden="true"></span>Back to projects</a>`

/** "Role: X." -> { Role: 'X.' } */
function parseDetails(details = []) {
  const out = {}
  for (const line of details) {
    const match = line.match(/^(Role|Challenge|Outcome):\s*(.+)$/)
    if (match) out[match[1]] = match[2]
  }
  return out
}

const shorten = (text, max = 158) => (text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…')

function header() {
  return `  <header id="site-header" class="site-header">
    <div class="site-header__bar">
      <a href="/#home" class="site-logo" aria-label="Tariq Ahmad, home">
        <i class="ri-code-s-slash-fill" aria-hidden="true"></i>
        <span class="site-logo__name">Tariq Ahmad</span>
      </a>
      <button type="button" class="site-nav-toggle mobile-nav-toggle" aria-label="Open navigation menu"
        aria-expanded="false" aria-controls="site-nav">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        <ul>
          <li><a class="nav-link" href="/#home">Home</a></li>
          <li><a class="nav-link" href="/#about">About</a></li>
          <li><a class="nav-link" href="/#resume">Resume</a></li>
          <li><a class="nav-link active" href="/#projects" aria-current="page">Projects</a></li>
          <li><a class="nav-link" href="/#contact">Contact</a></li>
          <li class="nav-social">
            <a href="https://www.linkedin.com/in/tariq-ahmad-a43320264" class="linkedin" aria-label="LinkedIn"><i
                class="bi bi-linkedin" aria-hidden="true"></i></a>
            <a href="https://github.com/tariqahmaad" class="github" aria-label="GitHub"><i
                class="ri-github-fill" aria-hidden="true"></i></a>
          </li>
        </ul>
      </nav>
    </div>
  </header>`
}

export function footer() {
  return `  <footer class="site-footer">
    <div class="site-footer__inner">
      <p>&copy; 2026 Tariq Ahmad &middot; Computer Engineer &amp; Full-Stack Developer</p>
      <p class="site-footer__links">
        <a href="https://www.linkedin.com/in/tariq-ahmad-a43320264">LinkedIn</a>
        <a href="https://github.com/tariqahmaad">GitHub</a>
        <a href="mailto:me@tariqahmad.dev">Email</a>
        <a href="/assets/Tariq_Ahmad_Resume.pdf" download>R&eacute;sum&eacute; (PDF)</a>
        <a href="/#home">Back to top</a>
      </p>
    </div>
  </footer>`
}

export function renderProject(project, index, all, version) {
  const slug = SLUGS[index]
  const url = `${SITE}/projects/${slug}/`
  const facts = parseDetails(project.details)
  const description = shorten(project.description)
  const prev = index > 0 ? { slug: SLUGS[index - 1], name: all[index - 1].name } : null
  const next = index < all.length - 1 ? { slug: SLUGS[index + 1], name: all[index + 1].name } : null

  const actions = []
  if (project.liveDemo) {
    actions.push(`<a href="${esc(project.liveDemo)}" target="_blank" rel="noopener noreferrer" class="btn-brand"><i class="bi bi-eye" aria-hidden="true"></i> Live Demo<span class="sr-only"> (opens in new tab)</span></a>`)
  }
  if (project.github) {
    actions.push(`<a href="${esc(project.github)}" target="_blank" rel="noopener noreferrer" class="btn-ghost"><i class="ri-github-fill" aria-hidden="true"></i> View Code<span class="sr-only"> (opens in new tab)</span></a>`)
  }

  const block = (title, body) => body
    ? `
      <section class="case__block">
        <h2>${esc(title)}</h2>
        <p>${esc(body)}</p>
      </section>`
    : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareSourceCode',
        '@id': url + '#project',
        name: project.name,
        description: project.description,
        url,
        author: { '@id': SITE + '/#person' },
        ...(project.github ? { codeRepository: project.github } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tariq Ahmad', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: SITE + '/#projects' },
          { '@type': 'ListItem', position: 3, name: project.name, item: url }
        ]
      }
    ]
  }

  const pager = `
      <nav class="case__pager" aria-label="More projects">
        ${prev ? `<a class="case__pager-link" rel="prev" href="/projects/${prev.slug}/"><span>Previous</span>${esc(prev.name)}</a>` : '<span></span>'}
        ${next ? `<a class="case__pager-link case__pager-link--next" rel="next" href="/projects/${next.slug}/"><span>Next</span>${esc(next.name)}</a>` : '<span></span>'}
      </nav>`

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>${esc(project.name)} | Tariq Ahmad</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="Tariq Ahmad">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#18d26e">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(project.name)} | Tariq Ahmad">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="Tariq Ahmad">
  <meta property="og:image" content="${SITE}/assets/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(project.name)} | Tariq Ahmad">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/assets/img/og-image.jpg">

  <link href="/favicon.ico" rel="icon" sizes="any">
  <link href="/assets/img/favicon.png" rel="icon" type="image/png" sizes="32x32">
  <link href="/assets/img/apple-touch-icon.png" rel="apple-touch-icon">

  <link href="/assets/css/critical.min.css?v=${version}" rel="stylesheet">
  <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.subset.min.css?v=${version}" rel="stylesheet">
  <link href="/assets/vendor/boxicons/css/boxicons.subset.min.css?v=${version}" rel="stylesheet">
  <link href="/assets/vendor/remixicon/remixicon.subset.min.css?v=${version}" rel="stylesheet">
  <link href="/assets/css/deferred.min.css?v=${version}" rel="stylesheet">
  <script src="/assets/vendor/particles.js/particles.min.js" defer></script>
  <script>document.documentElement.classList.add('js');</script>

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body class="case-page">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div id="particles-js" aria-hidden="true"></div>

${header()}

  <main id="main-content" tabindex="-1">
    <article class="case container">
      ${backLink()}

      <nav class="case__crumbs" aria-label="Breadcrumb">
        <a href="/#projects">Projects</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(project.name)}</span>
      </nav>

      <p class="case__eyebrow">Case study ${pad(index + 1)} / ${pad(all.length)}</p>
      <h1 class="case__title">${esc(project.name)}</h1>
      <p class="case__lead">${esc(project.description)}</p>

      <ul class="case__tags" aria-label="Technologies">
        ${project.technologies.map((t) => `<li class="tech-tag">${esc(t)}</li>`).join('\n        ')}
      </ul>
${actions.length ? `
      <div class="case__actions">
        ${actions.join('\n        ')}
      </div>
` : ''}
      <dl class="case__facts">
        ${facts.Role ? `<div><dt>Role</dt><dd>${esc(facts.Role.replace(/\.$/, ''))}</dd></div>` : ''}
        <div><dt>Stack</dt><dd>${esc(project.technologies.join(', '))}</dd></div>
      </dl>
${block('Challenge', facts.Challenge)}${block('Outcome', facts.Outcome)}
${pager}

      ${backLink(' case__back--bottom')}
    </article>
  </main>

${footer()}

  <script src="/assets/vendor/lenis/lenis.min.js" defer></script>
  <script src="/assets/vendor/emailjs/email.min.js" defer></script>
  <script src="/assets/js/site.min.js?v=${version}" defer></script>
</body>
</html>
`
}

export function currentVersion() {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8')
  const match = html.match(/\?v=([\w-]+)/)
  if (!match) throw new Error('no ?v= version found in index.html')
  return match[1]
}

export async function loadProjects() {
  const { knowledgeBase } = await import(pathToFileURL(resolve(root, 'assets/js/knowledge-base.js')).href)
  if (knowledgeBase.projects.length !== SLUGS.length) {
    throw new Error(`knowledge base has ${knowledgeBase.projects.length} projects but SLUGS has ${SLUGS.length}`)
  }
  return knowledgeBase.projects
}

export async function projectPages() {
  const projects = await loadProjects()
  const version = currentVersion()
  return projects.map((project, index) => ({
    path: `projects/${SLUGS[index]}/index.html`,
    html: renderProject(project, index, projects, version)
  }))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const { path, html } of await projectPages()) {
    const file = resolve(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  }
  console.log(`Wrote ${SLUGS.length} project pages.`)
}
