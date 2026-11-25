/**
 * Cross-platform build script (Windows, macOS, Linux, CI).
 * Rebuilds Bootstrap & icon subsets, CSS/JS bundles via esbuild, and the
 * static case-study pages from assets/js/knowledge-base.js.
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CSS_EXTERNALS = ['*.woff2', '*.jpg', '*.png', '*.svg', '*.webp']

function findPython() {
  for (const bin of process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python']) {
    try {
      execFileSync(bin, ['--version'], { stdio: 'ignore' })
      return bin
    } catch {
      // Try next candidate
    }
  }
  throw new Error('Python 3 is required to run bootstrap-subset.py and icon-subset.py')
}

const py = findPython()
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' })

// 1. Bootstrap & icon subsets (critical.css imports the Bootstrap subset).
run(py, ['scripts/bootstrap-subset.py'])
await build({
  entryPoints: ['assets/vendor/bootstrap/css/bootstrap.subset.min.css'],
  absWorkingDir: root,
  minify: true,
  allowOverwrite: true,
  outfile: 'assets/vendor/bootstrap/css/bootstrap.subset.min.css',
  logLevel: 'warning'
})
run(py, ['scripts/icon-subset.py'])

// 2. CSS bundles (matches tests/build.test.mjs options exactly).
for (const name of ['critical', 'deferred']) {
  await build({
    entryPoints: [`assets/css/${name}.css`],
    absWorkingDir: root,
    bundle: true,
    minify: true,
    external: CSS_EXTERNALS,
    legalComments: 'none',
    outfile: `assets/css/${name}.min.css`,
    logLevel: 'warning'
  })
}

// 3. JavaScript bundles (matches tests/build.test.mjs options exactly).
const JS_BUNDLES = [
  ['assets/js/site.js', 'assets/js/site.min.js', 'iife'],
  ['assets/js/ai-assistant.js', 'assets/js/ai-assistant.min.js', 'esm'],
  ['assets/js/command-palette.js', 'assets/js/command-palette.min.js', 'esm']
]
for (const [entry, outfile, format] of JS_BUNDLES) {
  await build({
    entryPoints: [entry],
    absWorkingDir: root,
    bundle: true,
    minify: true,
    format,
    target: 'es2020',
    legalComments: 'none',
    outfile,
    logLevel: 'warning'
  })
}

// 4. Generated static case-study pages (projects/<slug>/index.html).
run(process.execPath, ['scripts/build-projects.mjs'])
console.log('Build complete.')
