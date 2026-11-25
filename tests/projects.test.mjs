/**
 * Case-study pages: they are generated from knowledge-base.js by
 * scripts/build-projects.mjs, so the committed files must match a fresh build,
 * and each page must be a well-formed, discoverable, self-contained document.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SLUGS, SITE, projectPages, shorten } from '../scripts/build-projects.mjs';
import { knowledgeBase as kb } from '../assets/js/knowledge-base.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const pages = await projectPages();
const index = read('index.html');
const sitemap = read('sitemap.xml');

test('there is one page per project, in tile order', () => {
    assert.equal(pages.length, SLUGS.length);
    const tileSlugs = [...index.matchAll(/class="project-tile" id="project-([a-z-]+)"/g)].map(m => m[1]);
    assert.deepEqual(tileSlugs, SLUGS);
});

for (const { path, html } of pages) {
    test(`${path} is up to date with the knowledge base (run npm run build)`, () => {
        assert.equal(read(path), html);
    });
}

test('every page has a unique title, description and canonical that is in the sitemap', () => {
    const titles = new Set();
    const descriptions = new Set();
    for (const { path, html } of pages) {
        const title = html.match(/<title>([^<]+)<\/title>/)[1];
        const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
        const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
        assert.ok(!titles.has(title), `duplicate title in ${path}`);
        assert.ok(!descriptions.has(description), `duplicate description in ${path}`);
        titles.add(title);
        descriptions.add(description);
        assert.ok(canonical.startsWith(SITE + '/projects/'), `${path}: unexpected canonical ${canonical}`);
        assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${path}: missing from sitemap.xml`);
    }
});

test('each tile on the home page links to its case study, and the page exists', () => {
    for (const slug of SLUGS) {
        assert.ok(index.includes(`href="projects/${slug}/"`), `tile for ${slug} has no Case Study link`);
        assert.ok(existsSync(resolve(root, `projects/${slug}/index.html`)), `projects/${slug}/index.html missing`);
    }
});

test('pages have one h1, no skipped heading levels, and no third-party loads', () => {
    for (const { path, html } of pages) {
        const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map(m => Number(m[1]));
        assert.equal(levels.filter(l => l === 1).length, 1, `${path}: needs exactly one h1`);
        assert.equal(levels[0], 1, `${path}: first heading must be the h1`);
        levels.reduce((previous, level) => {
            assert.ok(level <= previous + 1, `${path}: heading level jumps from h${previous} to h${level}`);
            return level;
        });
        for (const [, url] of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)) {
            assert.ok(url.startsWith(SITE), `${path}: third-party load ${url}`);
        }
    }
});

test('local assets and links referenced by the pages exist; new-tab links are noopener', () => {
    for (const { path, html } of pages) {
        for (const [, ref] of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
            const target = ref.endsWith('/') ? ref + 'index.html' : ref;
            assert.ok(existsSync(resolve(root, '.' + target)), `${path}: missing ${ref}`);
        }
        for (const [tag] of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) {
            assert.match(tag, /rel="noopener noreferrer"/, `${path}: ${tag}`);
        }
    }
});

test('pages carry no phone number, banned social profile or the dead CV-Builder repo', () => {
    for (const { path, html } of pages) {
        assert.doesNotMatch(html, /href="tel:/, path);
        assert.doesNotMatch(html, /twitter\.com\/|x\.com\/|facebook\.com|instagram\.com/i, path);
        assert.doesNotMatch(html, /github\.com\/tariqahmaad\/CV-Builder/, path);
    }
});

test('every case study has one Back to projects link at the top, pointing at /#projects', () => {
    for (const { path, html } of pages) {
        const links = html.match(/<a class="case__back[^"]*" href="\/#projects" data-back>/g) || [];
        assert.equal(links.length, 1, `${path}: expected a single back link at the top`);
        assert.doesNotMatch(html, /case__back--bottom/, `${path}: the bottom back link should be gone`);
        assert.ok(html.indexOf('case__back') < html.indexOf('case__crumbs'), `${path}: back link should come before the breadcrumb`);
    }
});

test('each case study ends with a prominent Next project button that names the next project', () => {
    const decode = (text) => text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
    for (const [index, { path, html }] of pages.entries()) {
        const next = kb.projects[index + 1];
        if (!next) {
            assert.doesNotMatch(html, /class="case__next"/, `${path}: the last case study must not show a Next project button`);
            continue;
        }
        const cta = html.match(/<a class="case__next" rel="next" href="([^"]+)">([\s\S]*?)<\/a>/);
        assert.ok(cta, `${path}: missing the Next project button`);
        assert.equal(cta[1], `/projects/${SLUGS[index + 1]}/`, `${path}: Next project points at ${cta[1]}`);
        assert.match(cta[2], /<span class="case__next-label">Next project<\/span>/, `${path}: missing the button label`);
        const shown = cta[2].match(/<span class="case__next-name">([^<]*)<\/span>/)?.[1];
        assert.equal(decode(shown ?? ''), next.name, `${path}: the button should name ${next.name}`);
        assert.ok(html.lastIndexOf('class="case__next"') > html.lastIndexOf('class="case__block"'), `${path}: the button belongs after the case-study blocks`);
        assert.ok(html.lastIndexOf('class="case__next"') < html.indexOf('</article>'), `${path}: the button finishes the case description`);
    }
});

test('the previous case study keeps a real rel=prev link, and the first page has none', () => {
    for (const [index, { path, html }] of pages.entries()) {
        const prev = html.match(/<a class="case__pager-link" rel="prev" href="([^"]+)">/);
        if (index === 0) {
            assert.equal(prev, null, `${path}: the first case study must not link to a previous project`);
            continue;
        }
        assert.ok(prev, `${path}: missing the Previous project link`);
        assert.equal(prev[1], `/projects/${SLUGS[index - 1]}/`, `${path}: Previous points at ${prev[1]}`);
    }
});

test('shorten trims long descriptions on a word boundary instead of mid-word', () => {
    const sample = 'A modern, privacy-first resume builder with real-time preview, multiple ATS-friendly templates, PDF export, version control, and Firebase authentication. Full-stack application deployed on Vercel.';
    const out = shorten(sample, 158);
    assert.ok(out.length <= 158);
    assert.ok(out.endsWith('…'));
    assert.doesNotMatch(out, /Ful…$/);
    assert.equal(shorten('Short text', 158), 'Short text');
});

test('every case study renders a Key Highlights section matching the knowledge base', () => {
    for (const [index, { path, html }] of pages.entries()) {
        const highlights = kb.projects[index].highlights || [];
        assert.ok(highlights.length >= 3, `${path}: expected at least 3 highlights in knowledge-base.js`);
        assert.match(html, /<h2>Key Highlights<\/h2>/, `${path}: missing Key Highlights section`);
        const count = (html.match(/<ul class="case__list">[\s\S]*?<\/ul>/)?.[0].match(/<li>/g) || []).length;
        assert.equal(count, highlights.length, `${path}: highlight item count mismatch`);
    }
});
