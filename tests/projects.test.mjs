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

import { SLUGS, SITE, projectPages } from '../scripts/build-projects.mjs';

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

test('every case study has a Back to projects link at the top and bottom, pointing at /#projects', () => {
    for (const { path, html } of pages) {
        const links = html.match(/<a class="case__back[^"]*" href="\/#projects" data-back>/g) || [];
        assert.equal(links.length, 2, `${path}: expected a back link at the top and the bottom`);
        assert.ok(html.indexOf('case__back') < html.indexOf('case__crumbs'), `${path}: back link should come before the breadcrumb`);
    }
});
