# Tariq Ahmad — Portfolio

Static single-page portfolio (HTML, CSS, vanilla JS) with a rule-based chat assistant.
Live: <https://tariqahmaad.github.io/>

## Run locally

The site uses ES modules, so serve it over HTTP (opening `index.html` via `file://` will not work):

```bash
python -m http.server 8000   # or: npx http-server -p 8000
```

Then open <http://localhost:8000>.

## Editing

| What                    | Where                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| Page content, JSON-LD   | `index.html`                                                                  |
| Styles                  | `assets/css/*.css` (sources, registered in `critical.css` / `deferred.css`)   |
| Navigation, carousel, hero effect | `assets/js/main.js`                                                 |
| Chat assistant data     | `assets/js/knowledge-base.js`                                                 |
| Chat assistant logic    | `assets/js/ai-assistant.js` and `assets/js/assistant/`                        |
| Contact form            | `assets/js/contact-form.js` (EmailJS)                                         |

### Build

`index.html` loads **built** bundles (`critical.min.css`, `deferred.min.css`, `site.min.js`,
`ai-assistant.min.js`) generated from the editable sources. After editing any source `.css` or `.js`:

```bash
npm install        # once
npm run build      # = bash scripts/minify.sh
npm test           # also checks that the committed bundles match the sources
```

then bump the single `?v=` version in `index.html` (every `?v=` must match) so visitors don't get a stale cache.

The build also regenerates the Bootstrap and icon-font stylesheet subsets. New `bi-*`, `bx-*` or `ri-*` icons
additionally need their glyph added to the subsetted icon fonts, and fonts are self-hosted (trimmed variable
woff2, regenerated with `python scripts/build-fonts.py`) — see `CLAUDE.md`.

## Deployment

Pushed to the `tariqahmaad.github.io` repository and served by GitHub Pages. No build runs on the server,
so commit the generated `*.min.css` / `*.min.js` files (CI fails if they are stale).

See `CLAUDE.md` for architecture notes and branding/privacy rules.
