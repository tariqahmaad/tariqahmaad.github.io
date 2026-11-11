/**
 * Builds assets/Tariq_Ahmad_Resume.pdf from the structured data in
 * assets/js/knowledge-base.js (the same source as the chat assistant), by
 * rendering a print-styled A4 page and printing it with headless Chrome.
 *
 * Not part of `npm run build` (needs Chrome); run `npm run build:resume` when
 * the résumé content changes and commit the PDF. Set CHROME_PATH to override
 * the browser location.
 *
 * Privacy: like the site, the PDF has no phone number and no street address or
 * city: contact is email, LinkedIn and GitHub only.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'assets/Tariq_Ahmad_Resume.pdf')

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean)
  const found = candidates.find((path) => existsSync(path))
  if (!found) throw new Error('Chrome/Edge not found. Set CHROME_PATH to its executable.')
  return found
}

export function renderResume(kb) {
  const p = kb.personal
  const fontUrl = pathToFileURL(resolve(root, 'assets/fonts/open-sans-latin.woff2')).href
  const skillGroups = [
    ['Languages', kb.skills.languages],
    ['Frameworks', kb.skills.frameworks],
    ['Databases', kb.skills.databases],
    ['Tools', kb.skills.tools],
    ['Networking', kb.skills.networking],
    ['Web', kb.skills.markup]
  ]

  const experience = kb.experience.map((job) => `
    <div class="item">
      <div class="row"><h3>${esc(job.title)}</h3><span>${esc(job.duration)}</span></div>
      <p class="org">${esc(job.company)}</p>
      <ul>${job.responsibilities.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    </div>`).join('')

  const projects = kb.projects.map((project) => `
    <li><strong>${esc(project.name)}</strong> <span class="stack">${esc(project.technologies.join(', '))}</span></li>`).join('')

  const certifications = kb.certifications.map((c) => `
    <li><strong>${esc(c.name)}</strong> &middot; ${esc(c.issuer)} &middot; ${esc(c.date)}</li>`).join('')

  const achievements = kb.achievements.map((a) => `
    <li><strong>${esc(a.name)}</strong> &middot; ${esc(a.issuer)} &middot; ${esc(a.date)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(p.name)} - Resume</title>
<style>
@font-face { font-family: "Open Sans"; font-weight: 300 700; src: url("${fontUrl}") format("woff2"); }
@page { size: A4; margin: 14mm 15mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; font: 400 9.6pt/1.42 "Open Sans", Arial, sans-serif; }
h1 { margin: 0; font-size: 22pt; letter-spacing: 0.01em; line-height: 1.1; }
.title { margin: 2px 0 6px; color: #0a7f45; font-weight: 700; font-size: 11pt; }
.contact { margin: 0 0 10px; color: #333; font-size: 9pt; }
.contact span + span::before { content: " | "; color: #999; }
h2 { break-after: avoid; margin: 12px 0 5px; padding-bottom: 2px; border-bottom: 1.2px solid #0a7f45; color: #0a7f45; font-size: 10pt; letter-spacing: 0.12em; text-transform: uppercase; }
p { margin: 0 0 4px; }
.item { margin-bottom: 7px; break-inside: avoid; }
.row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
h3 { margin: 0; font-size: 10pt; }
.row span { color: #444; font-size: 8.8pt; white-space: nowrap; }
.org { color: #333; font-style: italic; margin: 0 0 2px; }
ul { margin: 2px 0 0; padding-left: 15px; }
li { margin: 0 0 1px; }
.plain { list-style: none; padding: 0; break-inside: avoid; }
.plain li { margin-bottom: 2px; }
.stack { color: #555; font-size: 8.6pt; }
.skills { display: grid; grid-template-columns: 24mm 1fr; gap: 1px 8px; }
.skills b { font-weight: 700; }
</style></head>
<body>
  <h1>${esc(p.name)}</h1>
  <p class="title">Computer Engineer &amp; Full-Stack Developer</p>
  <p class="contact"><span>${esc(p.email)}</span><span>${esc(p.linkedin.replace(/^https:\/\//, ''))}</span><span>${esc(p.github.replace(/^https:\/\//, ''))}</span></p>

  <h2>Summary</h2>
  <p>${esc(p.bio)} ${esc(p.availabilityDetails)}</p>

  <h2>Education</h2>
  <div class="item">
    <div class="row"><h3>${esc(p.degree)}</h3><span>${esc(p.graduationYear.replace('-', ' - '))}</span></div>
    <p class="org">${esc(p.university)} &middot; CGPA ${esc(p.cgpa)}</p>
  </div>

  <h2>Experience</h2>${experience}

  <h2>Projects</h2>
  <ul class="plain">${projects}</ul>

  <h2>Skills</h2>
  <div class="skills">${skillGroups.map(([label, items]) => `<b>${esc(label)}</b><span>${esc(items.join(', '))}</span>`).join('')}</div>

  <h2>Certifications</h2>
  <ul class="plain">${certifications}</ul>

  <h2>Achievements</h2>
  <ul class="plain">${achievements}</ul>

  <h2>Languages</h2>
  <p>${esc(p.spokenLanguages.join(', '))}</p>
</body></html>
`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { knowledgeBase } = await import(pathToFileURL(resolve(root, 'assets/js/knowledge-base.js')).href)
  const dir = mkdtempSync(join(tmpdir(), 'resume-'))
  const htmlFile = join(dir, 'resume.html')
  writeFileSync(htmlFile, renderResume(knowledgeBase))

  const chrome = findChrome()
  const result = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=3000',
    `--user-data-dir=${join(dir, 'profile')}`,
    `--print-to-pdf=${OUT}`,
    pathToFileURL(htmlFile).href
  ], { encoding: 'utf8' })
  if (result.status !== 0 || !existsSync(OUT)) {
    console.error(result.stderr || result.stdout)
    throw new Error('Chrome failed to print the PDF')
  }
  console.log(`Wrote ${OUT} (${Math.round(statSync(OUT).size / 1024)} KB)`)
}
