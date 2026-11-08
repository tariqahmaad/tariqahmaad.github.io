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

| What                    | Where                                                    |
| ----------------------- | -------------------------------------------------------- |
| Page content, JSON-LD   | `index.html`                                             |
| Styles                  | `assets/css/*.css` (sources) → `*.min.css` (shipped)     |
| Navigation, hero effect | `assets/js/main.js`                                      |
| Chat assistant data     | `assets/js/knowledge-base.js`                            |
| Chat assistant logic    | `assets/js/ai-assistant.js`                              |
| Contact form            | `assets/vendor/php-email-form/validate.js` (EmailJS)     |

### CSS build

`index.html` loads the minified CSS. After editing a source `.css` file:

```bash
bash scripts/minify.sh
```

then bump the `?v=` query string on the matching `<link>` in `index.html` so visitors don't get a stale cache.

If you add Bootstrap classes to `index.html`, regenerate the Bootstrap subset first
(`python scripts/bootstrap-subset.py`). New `bi-*`, `bx-*` or `ri-*` icons need their glyph added to the
subsetted icon fonts — see `CLAUDE.md`.

## Deployment

Pushed to the `tariqahmaad.github.io` repository and served by GitHub Pages. No build runs on the server,
so commit the generated `*.min.css` files.

See `CLAUDE.md` for architecture notes and branding/privacy rules.
