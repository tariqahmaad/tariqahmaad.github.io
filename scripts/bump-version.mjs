/**
 * Release helper: bumps every ?v= cache-buster in index.html, refreshes
 * <lastmod> dates in sitemap.xml, and runs the full build (`scripts/build.mjs`).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function formatDate(today = new Date()) {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return { compact: `${y}${m}${d}`, iso: `${y}-${m}-${d}` }
}

/**
 * Compute the next cache-buster version token (`YYYYMMDD[a-z]`).
 */
export function nextVersion(current, today = new Date()) {
  const { compact } = formatDate(today)
  const match = typeof current === 'string' && current.match(/^(\d{8})([a-z])(\d*)$/)
  if (match && match[1] === compact) {
    const [, , letter, num] = match
    if (letter < 'z' && !num) {
      return `${compact}${String.fromCharCode(letter.charCodeAt(0) + 1)}`
    }
    const nextNum = num ? Number(num) + 1 : 1
    return `${compact}z${nextNum}`
  }
  return `${compact}a`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const indexPath = resolve(root, 'index.html')
  const sitemapPath = resolve(root, 'sitemap.xml')
  const html = readFileSync(indexPath, 'utf8')
  const currentMatch = html.match(/\?v=([\w-]+)/)
  if (!currentMatch) throw new Error('No ?v= cache-buster found in index.html')

  const current = currentMatch[1]
  const today = new Date()
  const next = nextVersion(current, today)
  const { iso } = formatDate(today)

  const updatedHtml = html.replaceAll(`?v=${current}`, `?v=${next}`)
  writeFileSync(indexPath, updatedHtml)

  const sitemap = readFileSync(sitemapPath, 'utf8')
  const updatedSitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${iso}</lastmod>`)
  writeFileSync(sitemapPath, updatedSitemap)

  console.log(`Bumped version: ${current} -> ${next} (lastmod ${iso})`)
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' })
}
