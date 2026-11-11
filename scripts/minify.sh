#!/usr/bin/env bash
# Rebuild every generated asset. Run after editing any source .css or .js file:
#     bash scripts/minify.sh        (or: npm run build)
# Sources stay untouched and editable; index.html loads the built bundles:
#   assets/css/critical.min.css    render-blocking CSS   (from critical.css)
#   assets/css/deferred.min.css    below-the-fold CSS    (from deferred.css)
#   assets/js/site.min.js          classic script bundle (from site.js)
#   assets/js/ai-assistant.min.js  lazy ES module bundle (from ai-assistant.js)
#   assets/js/command-palette.min.js lazy ES module bundle (from command-palette.js)
#   *.subset.min.css               Bootstrap + icon-font subsets
# Uses the pinned esbuild from devDependencies when `npm install` has been run,
# otherwise falls back to the same version through npx.
set -euo pipefail
cd "$(dirname "$0")/.."

ESBUILD_VERSION="0.28.2"
if [ -x node_modules/.bin/esbuild ]; then
  esbuild() { node_modules/.bin/esbuild "$@"; }
else
  esbuild() { npx --yes "esbuild@${ESBUILD_VERSION}" "$@"; }
fi

# `python` on Windows, `python3` on macOS/Linux
if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PY=python3
else
  PY=python
fi

# 1. Subsets first: the critical CSS bundle imports the Bootstrap subset.
"$PY" scripts/bootstrap-subset.py
esbuild "assets/vendor/bootstrap/css/bootstrap.subset.min.css" --minify \
  --outfile="assets/vendor/bootstrap/css/bootstrap.subset.min.css" --allow-overwrite
"$PY" scripts/icon-subset.py

# 2. CSS bundles. @import order in critical.css / deferred.css is the cascade
#    order. Fonts and images are referenced by url() and are left as files.
for bundle in critical deferred; do
  esbuild "assets/css/$bundle.css" --bundle --minify     --external:*.woff2 --external:*.jpg --external:*.png --external:*.svg --external:*.webp \
    --legal-comments=none --outfile="assets/css/$bundle.min.css"
done

# 3. JavaScript bundles.
esbuild assets/js/site.js --bundle --minify --format=iife --target=es2020 \
  --legal-comments=none --outfile=assets/js/site.min.js
esbuild assets/js/ai-assistant.js --bundle --minify --format=esm --target=es2020 \
  --legal-comments=none --outfile=assets/js/ai-assistant.min.js
esbuild assets/js/command-palette.js --bundle --minify --format=esm --target=es2020 \
  --legal-comments=none --outfile=assets/js/command-palette.min.js

# 4. Static case-study pages (projects/<slug>/index.html) from knowledge-base.js.
#    They copy the ?v= version from index.html, so bump it BEFORE running this.
node scripts/build-projects.mjs

echo "Done. Bump the ?v= version in index.html so visitors' caches pick up the new files."
