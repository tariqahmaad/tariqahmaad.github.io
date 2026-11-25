/**
 * The hero-name dock has one job in the navbar: exactly one version of the name
 * may be visible there at a time. The compact "TA" is the hero state, the flying
 * copy owns the handoff, and the full wordmark is the docked state. If the
 * compact mark stays visible while the copy is crossing the header (as it did
 * before this test), its shifted "A" and the copy's letters overlap and the
 * navbar reads as a doubled, garbled name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MARK_HIDE_FROM, MARK_HIDE_TO, markOpacityAt } from '../assets/js/fx/dock-timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');

test('the compact TA is visible in the hero and gone once the copy reaches the wordmark', () => {
    assert.equal(markOpacityAt(0), 1);
    assert.equal(markOpacityAt(0.2), 1);
    assert.equal(markOpacityAt(MARK_HIDE_FROM), 1);
    assert.equal(markOpacityAt(MARK_HIDE_TO), 0);
    assert.equal(markOpacityAt(0.9), 0);
    assert.equal(markOpacityAt(1), 0);
    assert.equal(markOpacityAt(-1), 1, 'overscroll at the top must keep the hero mark');
});

test('the compact TA crossfades instead of popping', () => {
    const mid = markOpacityAt((MARK_HIDE_FROM + MARK_HIDE_TO) / 2);
    assert.ok(mid > 0 && mid < 1, `mid-fade opacity: ${mid}`);
});

test('the compact TA only ever fades out as the page scrolls down', () => {
    let previous = markOpacityAt(0);
    for (let p = 0.01; p <= 1.0001; p += 0.01) {
        const value = markOpacityAt(p);
        assert.ok(value <= previous + 1e-9, `mark opacity rose at p=${p.toFixed(2)}`);
        previous = value;
    }
});

test('the compact TA is gone before the copy spreads across the wordmark', () => {
    // The leading letter crosses the 64px header around p=0.43, but the copied
    // name only spreads across the logo columns from p~0.6. The mark must be
    // fully hidden before that, or its parked/shifted letters double the copy.
    assert.equal(markOpacityAt(0.5), 0);
    assert.ok(MARK_HIDE_TO <= 0.5, `hide completes late: ${MARK_HIDE_TO}`);
});

test('the flying name never loses its initial letters (no merge fade)', () => {
    const dock = read('assets/js/fx/title-dock.js');
    assert.doesNotMatch(dock, /mergeFade/);
    assert.match(dock, /markOpacityAt/);
    assert.match(dock, /from '\.\/dock-timeline\.js'/);
});
