# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **static HTML/CSS/JavaScript single-page portfolio website** for Tariq Ahmad, a Computer Engineer and Full-Stack Developer. The site showcases projects, skills, and experience, and includes a rule-based AI assistant chat widget.

**Live URL**: https://tariqahmaad.github.io/

## Development

This is a **static website**: the shipped site is plain files with no runtime build step. A dev-only `package.json` provides tests, linting and a pinned esbuild for the build step (`npm install` once; none of it is needed to *serve* the site). **index.html loads built bundles (`*.min.css`, `*.min.js`), so after editing any source `.css`/`.js` run `npm run build` and bump the `?v=` version in index.html** (all `?v=` values must match; a test enforces it). View changes by serving via a local HTTP server (opening `index.html` via `file://` breaks ES modules).

### Dev commands

```bash
npm test            # node --test tests/ (assistant logic, KB/HTML/JSON-LD consistency, privacy rules, bundles in sync, headings, no third-party loads)
npm run lint        # ESLint over assets/js and tests
npm run build       # = bash scripts/minify.sh (CSS/JS bundles + Bootstrap and icon subsets)
```

CI (`.github/workflows/ci.yml`) runs lint, tests, and fails if any committed `*.min.css` / `*.min.js` is stale.

### Local Development

```bash
# Simple HTTP server (Python 3)
python -m http.server 8000

# Or using Node.js http-server
npx http-server -p 8000
```

Then visit http://localhost:8000

### Performance Characteristics

- **Two CSS bundles, sources stay editable**: `assets/css/critical.css` (`@import`s Bootstrap subset, fonts, style, branding, glassmorphism; render-blocking) and `assets/css/deferred.css` (testimonials, projects, assistant; loaded async via `rel=preload`) are built into `critical.min.css` / `deferred.min.css`. `@import` order is the cascade order. Add a new stylesheet by importing it in one of those two files. There is no inline critical `<style>`.
- **Two JS bundles**: `assets/js/site.js` imports `contact-form.js`, `particles-config.js`, `main.js` (in that order) into one classic script, `site.min.js`. `ai-assistant.js` plus `assistant/*` and `knowledge-base.js` bundle into the lazily imported ES module `ai-assistant.min.js`. Source files import each other with plain relative paths (no `?v=`); only the bundle URLs carry `?v=`.
- **Fonts are self-hosted**: `assets/fonts/*.woff2` are trimmed variable fonts (Open Sans and Raleway, weight 300-700, Latin + Latin-Extended-A for Turkish letters); the `@font-face` rules live in the generated `assets/css/fonts.css`. Regenerate with `python scripts/build-fonts.py` (needs network + `pip install fonttools brotli`) only when changing weights or glyph coverage. They are intentionally **not** preloaded (measured: preloading competes with the critical CSS and delays first paint; `font-display: swap` handles the swap). Never add Google Fonts links back (a test fails on third-party loads).
- **Bootstrap is SUBSETTED**: `bootstrap.subset.min.css` (~33KB of the original 233KB) contains only the Bootstrap classes used by index.html and the scripts. `npm run build` regenerates it (`scripts/bootstrap-subset.py`) after you add Bootstrap classes.
- **AI assistant is lazy-loaded**: an inline module imports `ai-assistant.min.js` on `requestIdleCallback` (4s cap). Its init uses `document.readyState` — safe for lazy loading. The knowledge base is bundled into it; do NOT add a separate script tag for it.
- **Icon fonts are SUBSETTED twice**: the three icon *fonts* contain only the glyphs actually used (~9KB total instead of ~400KB), and the three icon *stylesheets* are generated as `*.subset.min.css` (~3KB total instead of ~270KB) by `scripts/icon-subset.py` (part of `npm run build`). If you add a new `bi-*`, `bx-*`/`bxs-*`, or `ri-*` icon class, (1) add the glyph to the font with fontTools.subset (add its codepoint from the vendor CSS to the `--unicodes` list and re-run pyftsubset on the .woff2/.woff files in place) and (2) run `npm run build`, or the icon will render as tofu / be missing.
- **No CDN assets**: particles.js, PureCounter and the EmailJS SDK are self-hosted in `assets/vendor/`; fonts are in `assets/fonts/`. The References carousel is native CSS scroll-snap plus ~70 lines in `main.js` (no Swiper).
- **Particle Optimization**: Device-adaptive particle count (mobile: 30, tablet: 25, desktop: 85), skipped entirely under `prefers-reduced-motion`
- **Favicons**: root `favicon.ico` (multi-size) + 32px `favicon.png` + 180px `apple-touch-icon.png`; `og-image.jpg` is 1200×630

## Architecture

### Directory Structure

```
/
├── index.html                    # Entire single-page site (all sections + JSON-LD)
├── assets/
│   ├── css/                      # Source stylesheets; index.html loads only the two built bundles
│   │   ├── critical.css          # Bundle entry (render-blocking): @imports bootstrap subset, fonts, style, branding, glassmorphism
│   │   ├── deferred.css          # Bundle entry (async): @imports testimonials, projects, assistant
│   │   ├── *.min.css             # BUILT (critical.min.css, deferred.min.css) - never edit by hand
│   │   ├── fonts.css             # GENERATED @font-face rules (scripts/build-fonts.py)
│   │   ├── style.css             # Main styles
│   │   ├── ai-assistant.css      # AI chat widget styles
│   │   ├── glassmorphism.css     # Glass card system (glass-projects, glass-social, glass-btn)
│   │   ├── branding.css          # Design tokens and brand buttons
│   │   ├── projects-custom.css   # Project tile styles
│   │   └── testimonials-professional.css
│   ├── fonts/                    # Self-hosted trimmed variable fonts (generated)
│   ├── js/                       # JavaScript sources; index.html loads only the two built bundles
│   │   ├── site.js               # Bundle entry: imports contact-form, particles-config, main (in order)
│   │   ├── *.min.js              # BUILT (site.min.js, ai-assistant.min.js) - never edit by hand
│   │   ├── main.js               # Core functionality (nav, history/deep links, carousel, typing effect)
│   │   ├── ai-assistant.js       # AI chat widget: UI, state, intent handlers (ES module, exports AIAssistant)
│   │   ├── assistant/            # Pure, unit-tested modules used by ai-assistant.js
│   │   │   ├── text-match.js     #   whole-word matching, Levenshtein, typo correction
│   │   │   ├── entities.js       #   technology/role/company/project extraction
│   │   │   ├── markdown.js       #   escape-first markdown renderer (XSS-safe)
│   │   │   ├── state.js          #   conversation/personality/profile factories
│   │   │   └── config.js         #   thresholds, timings, breakpoint, stop words
│   │   ├── knowledge-base.js     # Portfolio data for AI assistant (ES module)
│   │   ├── contact-form.js       # EmailJS contact form handler
│   │   └── particles-config.js   # Particles.js initialization
│   ├── img/                      # Images (favicon, bg.jpg, me.jpg)
│   └── vendor/                   # Third-party libraries
│       ├── bootstrap/            # Bootstrap CSS framework
│       ├── boxicons/             # Icon font (+ generated boxicons.subset.min.css)
│       ├── remixicon/            # Icon font (+ generated remixicon.subset.min.css)
│       ├── bootstrap-icons/      # Icon font (+ generated bootstrap-icons.subset.min.css)
│       ├── purecounter/          # Counter animation
│       └── emailjs/              # EmailJS SDK (self-hosted)
├── tests/                        # node --test suites (no dependencies)
├── scripts/                      # minify.sh (the build), bootstrap-subset.py, icon-subset.py, build-fonts.py
├── 404.html                      # GitHub Pages not-found page
├── robots.txt / sitemap.xml      # SEO files (sitemap.xml includes the image entries)
└── .htaccess                     # Apache config — INERT on GitHub Pages
```

There is **no `projects/` directory** — all project info lives in the index.html projects section.

### Key Components

#### 1. Single-page SPA-style navigation
- `<html class="js">` is set by an inline head script; CSS hides `section`s (SPA-style) **only** under `html.js`, so the page renders fully without JavaScript
- `main.js` shows/hides sections via `showSection()`: it toggles `.section-show` and sets `inert` + `aria-hidden` on hidden sections (they must not be tabbable); `#header.header-top` is the compact-header state
- Section changes push a history entry (`updateUrl`) and `popstate` restores the view, so Back/Forward, bookmarks and `/#projects` deep links work; an empty hash is the home view
- `#main-content` (`<main>`) wraps the sections; the skip link targets it

#### 2. AI Assistant (`assets/js/ai-assistant.js`)
- Rule-based chat widget (whole-word intent matching, fuzzy matching with Levenshtein distance, typo correction with word-boundary regexes)
- Intent routing: topical intents beat generic `*_questions` intents, specific topics beat `about`; question/function words are ignored by word-level fuzzy matching
- Replies are rendered through `assistant/markdown.js` (escape first, `https:`/`mailto:` links only) — never assign unescaped text to `innerHTML`
- `sessionToken` drops in-flight replies after a restart; `isBusy` blocks concurrent sends
- ES module importing from `knowledge-base.js` and `assistant/*` with plain relative paths; the whole graph is bundled into `ai-assistant.min.js` by `npm run build`
- Modal dialog: `aria-modal`, Escape-to-close, Tab focus trap, focus restore to FAB on close
- Knowledge base contains personal info, skills, experience, projects, certifications

#### 3. Contact form (`assets/js/contact-form.js`)
- EmailJS integration (service `portfolio-contact-form`, template `template_nivqe7n`); config lives in the `CONFIG` object at the top
- Honeypot field (`company_site`) and a minimum fill time — bots get a fake success
- Messages are shown by toggling Bootstrap's `d-block`; `scripts/bootstrap-subset.py` scans `assets/js` for such classes so the subset keeps them
- Mailto fallback error if the EmailJS CDN fails to load
- No visitor form data is logged to the console

#### 4. Hero typing effect (`assets/js/main.js`)
- Matrix-style decode/glitch typing for the role rotator (`roles` array)
- Static fallback role text is embedded in the HTML `<span id="role">` for no-JS visitors
- Reduced-motion users get a plain text cycle instead of the animation

### Branding Rules

- Career positioning: **Full-Stack Developer / Software Engineer / Computer Engineer** (hero rotator, title tag, About must agree — no security-focused titles)
- **Location privacy (2026-09-20)**: the contact page has no address — its first box is "Work Availability" (remote/on-site). The chatbot's `personal.location` is "Details available on request" and the JSON-LD has no PostalAddress. NOTE: the About section's Location card, resume entry cities, and `alumniOf` still mention Istanbul — those are credentials the owner chose to keep; ask before scrubbing them.
- Social presence: **LinkedIn + GitHub only** — X/Twitter, Facebook, and Instagram profiles are removed from the site, structured data, and chatbot (do not re-add). The twitter:card meta tags stay: they control link previews, not a profile link.
- References section shows quotes with photos + "Full references available upon request"
- **Contact privacy**: phone number is NOT published anywhere (site or chatbot) — the contact box shows "Prefer to Talk?" with an "Email Me Instead" mailto button. The public email is **me@tariqahmad.dev** (hero Hire Me, contact box, form to_email, chatbot knowledge base). Do not reintroduce the old address or phone.
- Structured data (JSON-LD) is **inline** in index.html; keep `numberOfItems` in sync with the ItemList

## Common Tasks

### Adding a New Project

1. Add a `.project-tile` block in the projects section of `index.html` (copy an existing tile)
2. Update the inline JSON-LD ItemList (and `numberOfItems`)
3. Update `assets/js/knowledge-base.js` project entries (keep the same order as the page — `tests/site.test.mjs` checks counts)
4. Every project action link needs `rel="noopener noreferrer"` when using `target="_blank"` — and verify the target URL actually exists

### Modifying AI Assistant Knowledge

Edit `assets/js/knowledge-base.js`, run `npm run build` (re-bundles `ai-assistant.min.js`) and `npm test` (it checks the KB against index.html and the privacy rules and that the bundle is current), then bump the single `?v=` version in index.html.

### Updating Styles

- Main styles: `assets/css/style.css`; component-specific styles in their own files (register a new file by `@import`ing it in `critical.css` or `deferred.css`, then `npm run build`)
- Use the CSS custom properties defined in `:root` (style.css, glassmorphism.css, ai-assistant.css)
- Only "Open Sans" and "Raleway" are loaded as web fonts (self-hosted, weight 300-700) — don't reference others
- Card titles under an `h2` section are `h3` (a test rejects skipped heading levels)

## Deployment

This site is deployed to **GitHub Pages** at https://tariqahmaad.github.io/

The repository should be pushed to a GitHub repository named `tariqahmaad.github.io` for automatic GitHub Pages deployment. Note: `.htaccess` has no effect there.

## Vendor Libraries

- **Bootstrap 5**: CSS only for layout (`bootstrap.min.css` is the source, `bootstrap.subset.min.css` ships inside `critical.min.css`) — the JS bundle is NOT used
- **Boxicons / Remixicon / Bootstrap Icons**: icon fonts (subsetted — see Performance)
- **Particles.js**: Background particle effects (self-hosted)
- **PureCounter**: Number counting animations
- **EmailJS**: Contact form delivery (self-hosted)

## Important Files

- **index.html**: ~55KB single-page portfolio (all sections + inline JSON-LD)
- **assets/js/ai-assistant.js**: chat assistant UI + intent handlers (~3.1k lines; pure logic is in `assets/js/assistant/`)
- **assets/js/knowledge-base.js**: portfolio data module
- **assets/css/style.css**: main stylesheet with CSS custom properties

## Color Scheme

```css
--primary-color: #18d26e;        /* Green accent */
--primary-color-hover: #35e888;   /* Lighter green for hover */
--bg-color: #040404;              /* Dark background */
--text-color: #fff;               /* White text */
```
