/**
 * The hero name glitch is decoration, but its randomised maths and its
 * integration points are worth guarding: the h1 must keep the real text, the
 * colour layers must never be selectable text, and reduced motion / print must
 * always fall back to the static name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { band, between, chance, corrupt, pick, CORRUPT_GLYPHS, DECODE_GLYPHS } from '../assets/js/fx/glitch.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');

/** Small deterministic rng so the randomised helpers are reproducible. */
const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

test('between() stays inside its bounds, including at the boundary values', () => {
    assert.equal(between(() => 0, 4, 9), 4);
    assert.equal(between(() => 1, 4, 9), 9);
    const rng = seeded(7);
    for (let i = 0; i < 200; i += 1) {
        const value = between(rng, -3, 5);
        assert.ok(value >= -3 && value <= 5, `out of range: ${value}`);
    }
});

test('pick() only ever returns a member of the list', () => {
    const rng = seeded(3);
    const values = ['green', 'cyan', 'magenta', 'white'];
    for (let i = 0; i < 200; i += 1) assert.ok(values.includes(pick(rng, values)));
});

test('chance() is a probability, not a coin that ignores its argument', () => {
    assert.equal(chance(() => 0, 0.4), true);
    assert.equal(chance(() => 0.9, 0.4), false);
});

test('band() always returns a non-empty slice inside the title box', () => {
    const rng = seeded(11);
    for (let i = 0; i < 500; i += 1) {
        const slice = band(rng, 2, 18);
        assert.ok(slice.top >= 0, `top: ${slice.top}`);
        assert.ok(slice.height >= 2 && slice.height <= 18, `height: ${slice.height}`);
        assert.ok(slice.top + slice.height <= 100, `overflows: ${slice.top} + ${slice.height}`);
        assert.ok(Math.abs(slice.top + slice.height + slice.bottom - 100) < 1e-9, 'bottom must close the box');
    }
});

test('corrupt() changes the decorative copy without changing the name shape', () => {
    const text = 'Tariq Ahmad';
    const first = corrupt(seeded(42), text, 2);
    assert.equal(first, corrupt(seeded(42), text, 2), 'same rng seed must give the same copy');
    assert.notEqual(first, text);

    const rng = seeded(99);
    for (let i = 0; i < 100; i += 1) {
        const result = corrupt(rng, text, 2);
        assert.equal(result.length, text.length);
        for (let index = 0; index < text.length; index += 1) {
            if (text[index] === ' ') assert.equal(result[index], ' ', 'spaces must survive');
            if (!/[a-z0-9]/i.test(text[index])) assert.equal(result[index], text[index]);
            if (result[index] !== text[index]) assert.ok(CORRUPT_GLYPHS.includes(result[index]));
        }
    }
});

test('the decode glyphs cover the name', () => {
    for (const letter of 'TARIQAHMD') assert.ok(DECODE_GLYPHS.includes(letter), letter);
});

test('the hero keeps the real name and the data-text the layers copy', () => {
    const html = read('index.html');
    assert.match(html, /<h1 id="hero-title" class="hero__title" data-text="Tariq Ahmad">Tariq Ahmad<\/h1>/);
    const match = html.match(/<h1 id="hero-title"[^>]*data-text="([^"]+)"[^>]*>([^<]+)<\/h1>/);
    assert.ok(match);
    assert.equal(match[1], match[2].trim());
});

test('hero-fx never rewrites title.textContent (it would delete the colour layers)', () => {
    const source = read('assets/js/fx/hero-fx.js');
    assert.doesNotMatch(source, /title\.textContent\s*=/);
    assert.match(source, /textNode\.nodeValue/);
});

test('the glitch layers are decorative and the engine is reduced-motion aware', () => {
    const source = read('assets/js/fx/hero-fx.js');
    assert.match(source, /document\.getElementById\('hero-title'\)/);
    assert.match(source, /setAttribute\('aria-hidden', 'true'\)/);
    assert.match(source, /reducedMotion/);
    assert.match(source, /\.className = 'hero__title-fx'/);
});

test('styles own the layer stack and hide it for reduced motion and print', () => {
    const fx = read('assets/css/fx.css');
    assert.match(fx, /\.hero__title-fx \{/);
    assert.match(fx, /\.hero__title-scan \{/);
    assert.match(fx, /\.hero__glitch--cyan/);
    assert.match(fx, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hero__title-fx[\s\S]*?display:\s*none/);

    const print = read('assets/css/print.css');
    assert.match(print, /\.hero__title-fx[\s\S]*?display:\s*none/);
    // The dock depends on this exact rule to print the real name.
    assert.match(print, /\.hero__title \{[^}]*opacity:\s*1\s*!important/);
});

test('the title dock can still detect a running glitch and skip measuring', () => {
    assert.match(read('assets/js/fx/title-dock.js'), /classList\.contains\('is-glitching'\)/);
});
