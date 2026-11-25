/**
 * Unit and integration tests for URL hash navigation & scroll-spy helpers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { activeSectionId, nextHashForScroll } from '../assets/js/nav-hash.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');

const sampleSections = [
  { id: 'home', top: 0 },
  { id: 'about', top: 900 },
  { id: 'resume', top: 1800 },
  { id: 'projects', top: 2700 },
  { id: 'contact', top: 3600 }
];

test('activeSectionId picks home at top of page', () => {
  assert.equal(
    activeSectionId({ scrollY: 0, innerHeight: 800, scrollHeight: 4500, headerHeight: 64, sections: sampleSections }),
    'home'
  );
  assert.equal(
    activeSectionId({ scrollY: 35, innerHeight: 800, scrollHeight: 4500, headerHeight: 64, sections: sampleSections }),
    'home'
  );
});

test('activeSectionId picks last section near bottom of page', () => {
  assert.equal(
    activeSectionId({ scrollY: 3680, innerHeight: 800, scrollHeight: 4500, headerHeight: 64, sections: sampleSections }),
    'contact'
  );
});

test('activeSectionId picks last section whose top crossed threshold', () => {
  const scrolledToProjects = [
    { id: 'home', top: -2700 },
    { id: 'about', top: -1800 },
    { id: 'resume', top: -900 },
    { id: 'projects', top: 64 },
    { id: 'contact', top: 964 }
  ];
  assert.equal(
    activeSectionId({ scrollY: 2700, innerHeight: 800, scrollHeight: 4500, headerHeight: 64, sections: scrolledToProjects }),
    'projects'
  );
});

test('activeSectionId returns null when sections are empty', () => {
  assert.equal(
    activeSectionId({ scrollY: 0, innerHeight: 800, scrollHeight: 800, headerHeight: 64, sections: [] }),
    null
  );
});

test('nextHashForScroll clears hash at home and sets section hash elsewhere', () => {
  assert.equal(
    nextHashForScroll({ activeId: 'home', currentHash: '#projects', currentTargetSectionId: 'projects' }),
    ''
  );
  assert.equal(
    nextHashForScroll({ activeId: 'projects', currentHash: '', currentTargetSectionId: null }),
    '#projects'
  );
  assert.equal(
    nextHashForScroll({ activeId: 'about', currentHash: '#projects', currentTargetSectionId: 'projects' }),
    '#about'
  );
});

test('nextHashForScroll preserves sub-section hashes inside the active section, then clears on leave', () => {
  assert.equal(
    nextHashForScroll({ activeId: 'projects', currentHash: '#project-cv-builder', currentTargetSectionId: 'projects' }),
    '#project-cv-builder'
  );
  assert.equal(
    nextHashForScroll({ activeId: 'home', currentHash: '#project-cv-builder', currentTargetSectionId: 'projects' }),
    ''
  );
  assert.equal(
    nextHashForScroll({ activeId: 'about', currentHash: '#project-cv-builder', currentTargetSectionId: 'projects' }),
    '#about'
  );
});

test('main.js handles hashchange, popstate, replaceState, and index.html skips boot splash on deep links', () => {
  const main = read('assets/js/main.js');
  const html = read('index.html');
  assert.match(main, /window\.addEventListener\('hashchange',\s*handleHistoryHash\)/);
  assert.match(main, /window\.addEventListener\('popstate',\s*handleHistoryHash\)/);
  assert.match(main, /window\.history\.replaceState\(/);
  assert.match(html, /hasDeepHash\s*=\s*location\.hash\s*&&\s*location\.hash\s*!==\s*'#home'/);
});
