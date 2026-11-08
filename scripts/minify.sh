#!/usr/bin/env bash
# Rebuild the minified CSS assets. Run after editing any source .css file:
#     bash scripts/minify.sh        (or: npm run build)
# Sources stay untouched; index.html references the .min.css files.
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

for f in style branding glassmorphism projects-custom testimonials-professional ai-assistant; do
  esbuild "assets/css/$f.css" --minify --outfile="assets/css/$f.min.css"
done

"$PY" scripts/bootstrap-subset.py
esbuild "assets/vendor/bootstrap/css/bootstrap.subset.min.css" --minify \
  --outfile="assets/vendor/bootstrap/css/bootstrap.subset.min.css" --allow-overwrite

echo "Done. Bump the ?v= version in index.html so visitors' caches pick up the new files."
