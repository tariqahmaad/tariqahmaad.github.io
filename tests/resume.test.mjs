/**
 * Résumé: the committed PDF exists, is linked from the site, and the page it is
 * printed from respects the privacy rules (no phone number, no city).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { knowledgeBase as kb } from '../assets/js/knowledge-base.js';
import { renderResume } from '../scripts/build-resume.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pdfPath = resolve(root, 'assets/Tariq_Ahmad_Resume.pdf');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

test('the résumé PDF exists, is a real PDF and is a sensible size', () => {
    assert.ok(existsSync(pdfPath), 'run npm run build:resume and commit the PDF');
    assert.equal(readFileSync(pdfPath).subarray(0, 5).toString(), '%PDF-');
    assert.ok(statSync(pdfPath).size < 1024 * 1024, 'PDF should stay under 1 MB');
});

test('the site links to the PDF from the hero, the resume section and the footer', () => {
    const links = html.match(/href="assets\/Tariq_Ahmad_Resume\.pdf"/g) || [];
    assert.ok(links.length >= 3, `expected at least 3 links to the PDF, found ${links.length}`);
    assert.match(html, /data-resume-pdf/);
});

test('the source page for the PDF has every job and no phone number or city', () => {
    const page = renderResume(kb);
    for (const job of kb.experience) assert.ok(page.includes(job.company.replace(/&/g, '&amp;')), job.company);
    assert.equal((page.match(/<h3>/g) || []).length, kb.experience.length + 1, 'one h3 per job plus the degree');
    assert.doesNotMatch(page, /tel:|\+\d|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/);
    assert.doesNotMatch(page, /Istanbul,|Turkey/);
    assert.ok(page.includes(kb.personal.email));
});
