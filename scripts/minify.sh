#!/usr/bin/env bash
# Rebuild the minified CSS assets. Run after editing any source .css file:
#     bash scripts/minify.sh
# Requires npx (Node.js). Sources stay untouched; index.html references the .min.css files.
set -e
cd "$(dirname "$0")/.."

for f in style branding glassmorphism projects-custom testimonials-professional ai-assistant; do
  npx --yes esbuild "assets/css/$f.css" --minify --outfile="assets/css/$f.min.css"
done

python scripts/bootstrap-subset.py
npx --yes esbuild "assets/vendor/bootstrap/css/bootstrap.subset.min.css" --minify \
  --outfile="assets/vendor/bootstrap/css/bootstrap.subset.min.css" --allow-overwrite

echo "Done. Bump the ?v= version in index.html so visitors' caches pick up the new files."
