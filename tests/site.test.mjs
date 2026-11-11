/**
 * Content / integrity checks that tie the HTML, JSON-LD, sitemap and the chatbot
 * knowledge base together, plus the branding & privacy rules from CLAUDE.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { knowledgeBase as kb } from '../assets/js/knowledge-base.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const html = read('index.html');
const kbSource = read('assets/js/knowledge-base.js');
const assistantSources = ['ai-assistant.js', 'knowledge-base.js']
    .map(file => read(`assets/js/${file}`)).join('\n');

const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const itemList = jsonLd['@graph'].find(node => node['@type'] === 'ItemList');
const tileCount = (html.match(/class="project-tile"/g) || []).length;

test('JSON-LD project list matches the page and the knowledge base', () => {
    assert.equal(itemList.numberOfItems, itemList.itemListElement.length);
    assert.equal(itemList.numberOfItems, tileCount);
    assert.equal(kb.projects.length, tileCount);
    assert.equal(kb.stats.projects, tileCount);
});

test('knowledge-base stats agree with its arrays', () => {
    assert.equal(kb.stats.certifications, kb.certifications.length);
    assert.equal(kb.stats.experience, kb.experience.length);
    assert.equal(kb.stats.awards, kb.achievements.length);
});

test('ids in index.html are unique', () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual(duplicates, []);
});

test('every local href/src in index.html exists on disk', () => {
    const refs = [...html.matchAll(/\s(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)]
        .map(match => match[1])
        .filter(ref => !/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref));
    const missing = refs.filter(ref => !existsSync(resolve(root, ref)));
    assert.deepEqual(missing, []);
});

test('external target=_blank links are noopener noreferrer', () => {
    const anchors = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || [];
    assert.ok(anchors.length > 0);
    for (const anchor of anchors) assert.match(anchor, /rel="noopener noreferrer"/, anchor);
});

test('sitemap and robots.txt are consistent', () => {
    const robots = read('robots.txt');
    const sitemap = read('sitemap.xml');
    assert.match(robots, /Sitemap: https:\/\/tariqahmaad\.github\.io\/sitemap\.xml/);
    assert.ok(!robots.includes('images.xml'));
    for (const [, loc] of sitemap.matchAll(/<image:loc>https:\/\/tariqahmaad\.github\.io\/([^<]+)<\/image:loc>/g)) {
        assert.ok(existsSync(resolve(root, loc)), `sitemap image missing: ${loc}`);
    }
});

test('branding: public email is me@tariqahmad.dev and no phone is published', () => {
    assert.equal(kb.personal.email, 'me@tariqahmad.dev');
    assert.match(html, /mailto:me@tariqahmad\.dev/);
    assert.doesNotMatch(html, /href="tel:/);
    assert.doesNotMatch(assistantSources, /\+\d[\d\s().-]{8,}/); // no phone-like numbers in the bot
});

test('branding: only LinkedIn and GitHub profiles are linked', () => {
    const banned = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|facebook\.com|instagram\.com)/i;
    assert.doesNotMatch(html, banned);
    assert.doesNotMatch(kbSource, banned);
    assert.deepEqual(
        jsonLd['@graph'].find(node => node['@type'] === 'Person').sameAs.length, 2
    );
});

test('privacy: chatbot location is a placeholder and cities are not hardcoded in replies', () => {
    assert.equal(kb.personal.location, 'Details available on request');
    const assistant = read('assets/js/ai-assistant.js');
    assert.doesNotMatch(assistant, /Istanbul, Turkey/);
});

test('the dead CV-Builder repository is not linked', () => {
    assert.doesNotMatch(html, /github\.com\/tariqahmaad\/CV-Builder/);
    assert.ok(kb.projects.every(project => project.github !== 'https://github.com/tariqahmaad/CV-Builder'));
});

test('only the documented web fonts are referenced from the main stylesheet', () => {
    const css = read('assets/css/style.css');
    for (const [, family] of css.matchAll(/font-family:\s*"([^"]+)"/g)) {
        assert.ok(['Open Sans', 'Raleway', 'Anton'].includes(family), `unexpected font: ${family}`);
    }
});

/* ---------- Phone / layout regressions ---------- */
const cssSources = ['style.css', 'branding.css', 'glassmorphism.css', 'shell.css', 'hud.css', 'fx.css']
    .map(file => ({ file, css: read(`assets/css/${file}`) }));

test('the fixed header element never gets a filter, backdrop-filter or transform (it would trap the fixed mobile menu)', () => {
    const trapping = /(?:^|[;\s{])(?:-webkit-)?(?:backdrop-filter|filter|transform|perspective)\s*:/;
    for (const { file, css } of cssSources) {
        for (const [, selectors, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
            const targetsHeader = selectors.split(',')
                .map(selector => selector.trim())
                .some(selector => /(^|\s)(\.site-header|#site-header)(\.[\w-]+)*$/.test(selector));
            if (targetsHeader) {
                assert.doesNotMatch(body, trapping, `${file}: "${selectors.trim()}" must not use ${body.match(trapping)?.[0].trim()}`);
            }
        }
    }
});

test('the mobile menu overlay is sized against the viewport and the page locks while it is open', () => {
    const shell = read('assets/css/shell.css');
    assert.match(shell, /\.site-nav\s*\{[^}]*position:\s*fixed[^}]*100dvh/s);
    assert.match(shell, /html\.nav-open\s*\{[^}]*overflow:\s*hidden/s);
    assert.match(shell, /html\.nav-open \.ai-assistant\s*\{[^}]*display:\s*none/s);
    assert.match(read('assets/js/main.js'), /classList\.toggle\('nav-open'/);
});

test('contact form fields are 16px on phones so iOS does not zoom on focus', () => {
    const hud = read('assets/css/hud.css');
    assert.match(hud, /@media \(max-width: 767\.98px\)\s*\{[^@]*?php-email-form input[^}]*font-size:\s*16px/s);
});

test('the scroll progress line is gone', () => {
    for (const { file, css } of cssSources) assert.doesNotMatch(css, /scroll-progress/, file);
    assert.doesNotMatch(read('assets/js/site.js'), /progress/);
    assert.ok(!existsSync(resolve(root, 'assets/js/fx/progress.js')));
});

test('the resume keeps a valid heading order and every card', () => {
    const resume = html.match(/<section id="resume"[\s\S]*?<\/section>/)[0];
    const levels = [...resume.matchAll(/<h([2-5])[\s>]/g)].map(m => Number(m[1]));
    levels.reduce((previous, level) => {
        assert.ok(level <= previous + 1, `resume heading jumps from h${previous} to h${level}`);
        return level;
    });
    assert.equal((resume.match(/class="resume-title"/g) || []).length, 5);
    assert.equal((resume.match(/class="resume-item"/g) || []).length, 16);
});

test('testimonial cards are never given a fixed height (a long quote would overflow the border and squeeze the photo)', () => {
    for (const file of ['testimonials-professional.css', 'glassmorphism.css', 'style.css', 'hud.css']) {
        const css = read(`assets/css/${file}`);
        for (const [, selectors, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
            const targetsCard = selectors.split(',').some(selector => /(^|\s)\.testimonial-item(\.[\w-]+)*(:(?!:)[\w-]+)*$/.test(selector.trim().replace(/\/\*[\s\S]*?\*\//g, '').trim()));
            if (!targetsCard) continue;
            assert.doesNotMatch(body, /(?<![-\w])height:\s*\d/, `${file}: "${selectors.trim()}" sets a fixed height`);
        }
    }
});

test('testimonial cards keep square corners and visible overflow so the corner brackets are not clipped', () => {
    const hud = read('assets/css/hud.css');
    const rule = hud.match(/main \.testimonials \.testimonial-item\.glass-projects \{([^}]*)\}/)?.[1] ?? '';
    assert.match(rule, /border-radius:\s*2px/);
    assert.match(rule, /overflow:\s*visible/);
    assert.match(hud, /main \.testimonials \.testimonials-slider \{[^}]*overflow:\s*visible/s);
});

test('the hero title is ready for the glitch (data-text for the colour layers)', () => {
    assert.match(html, /<h1 id="hero-title" class="hero__title" data-text="Tariq Ahmad">Tariq Ahmad<\/h1>/);
});

test('a11y: the References carousel builds a pause/play toggle with aria-pressed, and autoplay honours it', () => {
    const main = read('assets/js/main.js');
    assert.match(main, /testimonials-toggle/);
    assert.match(main, /setAttribute\('aria-pressed'/);
    assert.match(main, /userPaused \|\| !onScreen/);
});

test('a11y: the pause toggle is at least 44px and keeps a visible focus ring', () => {
    const css = read('assets/css/testimonials-professional.css');
    const rule = css.match(/\.testimonials-toggle \{([^}]*)\}/)?.[1] ?? '';
    assert.match(rule, /width:\s*44px/);
    assert.match(rule, /height:\s*44px/);
    assert.match(css, /\.testimonials-toggle:focus-visible \{[^}]*outline:\s*2px solid/);
});

test('a11y: every source rule that removes the outline on :focus-visible supplies a replacement', () => {
    const files = ['style', 'branding', 'shell', 'hud', 'fx', 'case', 'palette', 'ai-assistant', 'assistant-hud',
        'testimonials-professional', 'projects-custom', 'glassmorphism'];
    for (const name of files) {
        const css = read(`assets/css/${name}.css`).replace(/\/\*[\s\S]*?\*\//g, '');
        for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
            if (!/:focus-visible/.test(selector) || !/outline:\s*(none|0)\b/.test(body)) continue;
            assert.match(body, /box-shadow|background|border|text-decoration/,
                `${name}.css: "${selector.trim()}" removes the outline without a replacement`);
        }
    }
});

test('404 page links to every home section and keeps noindex', () => {
    const page = read('404.html');
    for (const id of ['about', 'resume', 'projects', 'contact']) {
        assert.ok(page.includes(`href="/#${id}"`), `missing link to /#${id}`);
    }
    assert.match(page, /<meta name="robots" content="noindex">/);
});

test('print stylesheet is bundled last and hides effects and widgets', () => {
    const deferred = read('assets/css/deferred.css');
    const imports = [...deferred.matchAll(/@import "([^"]+)"/g)].map(m => m[1]);
    assert.equal(imports.at(-1), 'print.css');
    const print = read('assets/css/print.css');
    assert.match(print, /@media print/);
    for (const hidden of ['.boot', '#particles-js', '.chat-fab', '.chat-widget', '.testimonials-controls']) {
        assert.ok(print.includes(hidden), `print.css should hide ${hidden}`);
    }
});

test('privacy: the page and knowledge base never state the city or country as a location', () => {
    for (const [name, text] of [['index.html', html], ['knowledge-base.js', kbSource]]) {
        assert.doesNotMatch(text, /Istanbul,\s*Turkey/i, `${name} states a location`);
        assert.doesNotMatch(text, /location:\s*"Istanbul/i, `${name} has an Istanbul location field`);
    }
    // The university name is a credential and stays.
    assert.match(html, /Istanbul Aydin University/);
});
