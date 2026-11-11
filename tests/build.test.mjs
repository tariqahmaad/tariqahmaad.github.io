/**
 * Guards for the performance work: the committed bundles must match their
 * sources, the page must stay self-contained, and the structure must stay sound.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const html = read('index.html');

// Same options as scripts/minify.sh: keep the two in step.
const bundle = async (entry, extra) => {
    const { outputFiles } = await build({
        entryPoints: [entry],
        absWorkingDir: root,
        bundle: true,
        minify: true,
        legalComments: 'none',
        write: false,
        outfile: 'out',
        logLevel: 'silent',
        ...extra
    });
    return outputFiles[0].text;
};

const CSS_EXTERNALS = ['*.woff2', '*.jpg', '*.png', '*.svg', '*.webp'];
const BUILT = [
    ['assets/js/site.min.js', 'assets/js/site.js', { format: 'iife', target: 'es2020' }],
    ['assets/js/ai-assistant.min.js', 'assets/js/ai-assistant.js', { format: 'esm', target: 'es2020' }],
    ['assets/js/command-palette.min.js', 'assets/js/command-palette.js', { format: 'esm', target: 'es2020' }],
    ['assets/css/critical.min.css', 'assets/css/critical.css', { external: CSS_EXTERNALS }],
    ['assets/css/deferred.min.css', 'assets/css/deferred.css', { external: CSS_EXTERNALS }]
];

for (const [built, source, options] of BUILT) {
    test(`${built} is up to date with its sources (run npm run build)`, async () => {
        assert.equal(read(built), await bundle(source, options));
    });
}

test('every ?v= cache-buster in index.html is the same version', () => {
    const versions = new Set([...html.matchAll(/\?v=([\w-]+)/g)].map(match => match[1]));
    assert.equal(versions.size, 1, `mixed versions: ${[...versions].join(', ')}`);
});

test('the page has no third-party render dependencies', () => {
    const OWN_ORIGIN = 'https://tariqahmaad.github.io/'; // e.g. rel="canonical"
    const external = (html.match(/<(?:link|script)\b[^>]*\s(?:href|src)="https?:\/\/[^"]+"/g) || [])
        .filter(tag => !tag.includes(`"${OWN_ORIGIN}`));
    assert.deepEqual(external, []);
    assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
});

test('the lazily imported assistant bundle exists', () => {
    const target = html.match(/import\('\.\/([^'?]+)(?:\?[^']*)?'\)/);
    assert.ok(target, 'no dynamic import found');
    assert.ok(existsSync(resolve(root, target[1])), target[1]);
});

test('self-hosted fonts referenced by the CSS exist', () => {
    const css = read('assets/css/fonts.css');
    const files = [...css.matchAll(/url\("\.\.\/([^"]+)"\)/g)].map(match => match[1]);
    assert.ok(files.length >= 4);
    assert.deepEqual(files.filter(file => !existsSync(resolve(root, 'assets', file))), []);
});

test('heading levels never skip a level (accessible outline)', () => {
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
    assert.equal(levels[0], 1);
    levels.forEach((level, index) => {
        if (index) assert.ok(level <= levels[index - 1] + 1, `h${levels[index - 1]} -> h${level} at heading #${index + 1}`);
    });
});
