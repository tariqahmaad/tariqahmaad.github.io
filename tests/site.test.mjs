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
        assert.ok(['Open Sans', 'Raleway'].includes(family), `unexpected font: ${family}`);
    }
});
