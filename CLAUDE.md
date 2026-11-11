# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **static HTML/CSS/JavaScript portfolio website** (one scrolling home page plus generated case-study pages) for Tariq Ahmad, a Computer Engineer and Full-Stack Developer. The site showcases projects, skills, and experience, and includes a rule-based AI assistant chat widget.

**Live URL**: https://tariqahmaad.github.io/

## Development

This is a **static website**: the shipped site is plain files with no runtime build step. A dev-only `package.json` provides tests, linting and a pinned esbuild for the build step (`npm install` once; none of it is needed to *serve* the site). **index.html loads built bundles (`*.min.css`, `*.min.js`), so after editing any source `.css`/`.js` run `npm run build` and bump the `?v=` version in index.html** (all `?v=` values must match; a test enforces it; bump it BEFORE building, because the generated project pages copy the version from index.html). View changes by serving via a local HTTP server (opening `index.html` via `file://` breaks ES modules).

### Dev commands

```bash
npm test            # node --test "tests/*.test.mjs" (assistant logic, palette matcher, KB/HTML/JSON-LD consistency, privacy rules, bundles and project pages in sync, headings, no third-party loads, resume PDF)
npm run lint        # ESLint over assets/js and tests
npm run build       # = bash scripts/minify.sh (CSS/JS bundles + Bootstrap and icon subsets + projects/<slug>/index.html pages)
npm run build:resume # regenerates assets/Tariq_Ahmad_Resume.pdf from knowledge-base.js with headless Chrome (manual; commit the PDF)
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

- **Two CSS bundles, sources stay editable**: `assets/css/critical.css` (`@import`s Bootstrap subset, fonts, style, branding, glassmorphism, **shell** (fixed header, nav, hero, page flow), **hud** (design language: bracketed cards, section titles, buttons, footer), **fx** (boot sequence, glitch, cursor, reveals); render-blocking) and `assets/css/deferred.css` (testimonials, projects, assistant, **assistant-hud**, **palette**, **case**; loaded async via `rel=preload`) are built into `critical.min.css` / `deferred.min.css`. `@import` order is the cascade order. Add a new stylesheet by importing it in one of those two files. There is no inline critical `<style>`.
- **Three JS bundles**: `assets/js/site.js` imports `contact-form.js`, `particles-config.js`, `main.js`, then `fx/preloader.js`, `fx/reveal.js`, `fx/hero-fx.js`, `fx/cursor.js` (in that order) into one classic script, `site.min.js`. `ai-assistant.js` plus `assistant/*` and `knowledge-base.js` bundle into the lazily imported ES module `ai-assistant.min.js`. `command-palette.js` plus `palette/match.js` bundle into the lazily imported `command-palette.min.js` (opened by Ctrl/Cmd+K or any `[data-open-palette]` button via an inline module in index.html). Source files import each other with plain relative paths (no `?v=`); only the bundle URLs carry `?v=`.
- **Fonts are self-hosted**: `assets/fonts/*.woff2` are trimmed variable fonts (Open Sans and Raleway, weight 300-700, plus **Anton** as a static single-weight display face for headings; Latin + Latin-Extended-A for Turkish letters); the `@font-face` rules live in the generated `assets/css/fonts.css`. Regenerate with `python scripts/build-fonts.py` (needs network + `pip install fonttools brotli`) only when changing weights or glyph coverage. They are intentionally **not** preloaded (measured: preloading competes with the critical CSS and delays first paint; `font-display: swap` handles the swap). Never add Google Fonts links back (a test fails on third-party loads).
- **Bootstrap is SUBSETTED**: `bootstrap.subset.min.css` (~33KB of the original 233KB) contains only the Bootstrap classes used by index.html and the scripts. `npm run build` regenerates it (`scripts/bootstrap-subset.py`) after you add Bootstrap classes.
- **AI assistant is lazy-loaded**: an inline module imports `ai-assistant.min.js` on `requestIdleCallback` (4s cap). Its init uses `document.readyState` — safe for lazy loading. The knowledge base is bundled into it; do NOT add a separate script tag for it.
- **Icon fonts are SUBSETTED twice**: the three icon *fonts* contain only the glyphs actually used (~9KB total instead of ~400KB), and the three icon *stylesheets* are generated as `*.subset.min.css` (~3KB total instead of ~270KB) by `scripts/icon-subset.py` (part of `npm run build`). If you add a new `bi-*`, `bx-*`/`bxs-*`, or `ri-*` icon class, (1) add the glyph to the font with fontTools.subset (add its codepoint from the vendor CSS to the `--unicodes` list and re-run pyftsubset on the .woff2/.woff files in place) and (2) run `npm run build`, or the icon will render as tofu / be missing.
- **No CDN assets**: particles.js, PureCounter, Lenis (smooth scroll, v1.3.4) and the EmailJS SDK are self-hosted in `assets/vendor/`; fonts are in `assets/fonts/`. The References carousel is native CSS scroll-snap plus ~70 lines in `main.js` (no Swiper).
- **Particle Optimization**: Device-adaptive particle count (mobile: 30, tablet: 25, desktop: 85), skipped entirely under `prefers-reduced-motion`; the canvas is dimmed (`#particles-js { opacity: .45 }` in hud.css) so it never competes with body text
- **Effects are progressive enhancement**: the boot sequence (`html.boot-pending`, once per session, 4.5s safety timeout in the inline head script), scroll reveals (`html.reveal-ready`), cursor ring and glitch all disable under `prefers-reduced-motion`, and the content never depends on them. GSAP was deliberately not used (vanilla JS + CSS is enough).
- **Favicons**: root `favicon.ico` (multi-size) + 32px `favicon.png` + 180px `apple-touch-icon.png`; `og-image.jpg` is 1200×630

## Architecture

### Directory Structure

```
/
├── index.html                    # Home page: hero + all sections + JSON-LD, one scrolling page
├── projects/<slug>/index.html    # GENERATED case-study pages (scripts/build-projects.mjs) - never edit by hand
├── assets/
│   ├── css/                      # Source stylesheets; index.html loads only the two built bundles
│   │   ├── critical.css          # Bundle entry (render-blocking): @imports bootstrap subset, fonts, style, branding, glassmorphism, shell, hud, fx
│   │   ├── deferred.css          # Bundle entry (async): @imports testimonials, projects, assistant, assistant-hud, palette, case
│   │   ├── shell.css / hud.css / fx.css          # Header+hero+page flow / HUD design language / effects
│   │   ├── palette.css / case.css / assistant-hud.css  # Command palette / case-study pages / assistant restyle
│   │   ├── *.min.css             # BUILT (critical.min.css, deferred.min.css) - never edit by hand
│   │   ├── fonts.css             # GENERATED @font-face rules (scripts/build-fonts.py)
│   │   ├── style.css             # Main styles
│   │   ├── ai-assistant.css      # AI chat widget styles
│   │   ├── glassmorphism.css     # Glass card system (glass-projects, glass-social, glass-btn)
│   │   ├── branding.css          # Design tokens and brand buttons
│   │   ├── projects-custom.css   # Project tile styles
│   │   └── testimonials-professional.css
│   ├── Tariq_Ahmad_Resume.pdf    # Generated by scripts/build-resume.mjs (npm run build:resume)
│   ├── fonts/                    # Self-hosted trimmed fonts (generated): Open Sans, Raleway, Anton
│   ├── js/                       # JavaScript sources; pages load only the built bundles
│   │   ├── site.js               # Bundle entry: imports contact-form, particles-config, main, fx/* (in order)
│   │   ├── *.min.js              # BUILT (site, ai-assistant, command-palette) - never edit by hand
│   │   ├── main.js               # Core functionality (smooth scroll, scroll-spy, nav, mobile menu, carousel, typing effect)
│   │   ├── fx/                   # Effects: preloader, reveal, hero-fx (glitch + count-up), cursor, env
│   │   ├── command-palette.js    # Ctrl/Cmd+K palette (lazy ES module)
│   │   ├── palette/match.js      # Pure fuzzy matcher used by the palette (unit tested)
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
│   ├── img/                      # Images (favicon, hero-portrait.jpg, me.jpg)
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

#### 1. One scrolling page (`assets/js/main.js`)
- Sections (`#home` hero, `#about`, `#resume`, `#projects`, `#contact`) are always in the normal flow, so the page works without JS, indexes well and `/#projects` deep links just work. `<html class="js">` is set by an inline head script; `body::before` carries the hero portrait (`hero-portrait.jpg`, bg.jpg with its quote painted out) and scrolls away with the hero.
- `main.js` adds: Lenis smooth scroll (skipped for reduced motion or if the vendor script fails), scroll-spy (IntersectionObserver), a header that gains a blurred background on scroll, the mobile full-screen menu (`main` is `inert` while open), in-page link handling (URL update via `pushState`, focus moves to the target section) and `popstate` restoring the position.
- Other scripts talk to it through events instead of globals: `nav:goto` (`detail.id`) scrolls to any element id, `ui:scroll-lock` (`detail.locked`) pauses Lenis while a modal is open.
- `fx/*` modules are the effects layer (boot sequence, scroll reveals, hero glitch + count-up, cursor ring); each guards on `prefers-reduced-motion`.
- Project tiles have ids `project-<slug>` and a "Case Study" link to `projects/<slug>/`.
- Case-study pages carry a "Back to projects" link (top and bottom, `<a href="/#projects" data-back>`, generated by `build-projects.mjs`). `assets/js/back-link.js` upgrades it to `history.back()` only when the visitor came from the home page (so they return to the same scroll position); `shouldGoBack` is unit tested in `tests/back-link.test.mjs`.
- Hero name effects (`fx/hero-fx.js` + `fx.css`): a decode intro (the name resolves from scrambled glyphs; `aria-label` keeps screen readers on the real name; `white-space: nowrap` while decoding) and glitch bursts whose `--g-*` numbers are re-randomised every ~55ms (two RGB-split slice layers via `::before/::after` + `data-text`, jitter, skew, flash). Triggered periodically, on hover and on touch tap; fully off for `prefers-reduced-motion`.
- References (testimonial) cards: `hud.css` ("References" block) is the single owner of their shape: 2px corners, `overflow: visible` (the corner brackets sit 1px outside the box), `border-box`, and NO fixed height. Slides are `display: flex` so every card is as tall as the longest quote; the photo is `flex: none`. Older rules in style.css / glassmorphism.css still exist, so keep the `main .testimonials .testimonial-item.glass-projects` selector specificity. `tests/site.test.mjs` guards this.
- **Never put `backdrop-filter`, `filter` or `transform` on the `.site-header` element itself** (put the glass on `.site-header::before`). The mobile menu (`.site-nav`, `position: fixed`) is a descendant of the header, and such a property makes the header its containing block, collapsing the "full-screen" menu into the 64px bar as soon as the page scrolls. `tests/site.test.mjs` guards this.
- Mobile menu: `setMobileNav` toggles `html.nav-open` (locks page scroll, hides the assistant via `display: none`, makes `main` and the footer `inert`); the list scrolls inside the padded overlay so rows never slide under the logo/close button.
- Resume markup: `.resume-columns` is a two-column grid. Left column: Summary (`.resume-summary` panel), then Experience as a `.resume-timeline` of `.resume-item` cards. Right column: Education, Achievements and Certifications (the latter two as `.resume-group` grids of compact cards: title on top, issuer left, date chip right). Sub-titles are `h3.resume-title` (Anton, with a CSS-counter index). Columns are flex columns whose last block absorbs any leftover height as extra space BETWEEN cards (`justify-content: space-between` / `align-content: space-between`), never as taller cards, so both columns always end on the same line; if you add or remove resume content, re-check the gap (about 200px of spread at most looks right). The old resume rules were removed from style.css; all resume styling lives in hud.css.
- Phone rules: form fields are 16px at <=767px (iOS zooms on focus below 16px), buttons are at least 44px tall, footer links and contact icons are 44px targets.

#### 1b. Command palette (`assets/js/command-palette.js`)
- Ctrl/Cmd+K or the header "Menu" button; `<dialog>.showModal()`, built from the live DOM (nav links, `.project-tile[id]`, social links, mailto, `[data-resume-pdf]`, `#chatFab`), all text via `textContent`. Fuzzy ranking lives in `palette/match.js` (unit tested in `tests/palette.test.mjs`).

#### 1c. Case-study pages (`scripts/build-projects.mjs`)
- One page per project, generated from `knowledge-base.js` (role/challenge/outcome come from each project's `details`). `SLUGS` in the script must stay in the same order as the tiles and the KB; `tests/projects.test.mjs` fails if pages are stale, missing from `sitemap.xml`, or break the heading/privacy/third-party rules.

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
- **Résumé PDF** (`assets/Tariq_Ahmad_Resume.pdf`, built by `npm run build:resume`): contact is email, LinkedIn and GitHub only; no phone, and it deliberately omits cities (the on-site resume entries still show them, owner's choice).
- **Contact privacy**: phone number is NOT published anywhere (site or chatbot) — the contact box shows "Prefer to Talk?" with an "Email Me Instead" mailto button. The public email is **me@tariqahmad.dev** (hero Hire Me, contact box, form to_email, chatbot knowledge base). Do not reintroduce the old address or phone.
- Structured data (JSON-LD) is **inline** in index.html; keep `numberOfItems` in sync with the ItemList

## Common Tasks

### Adding a New Project

1. Add a `.project-tile` block in the projects section of `index.html` (copy an existing tile; give it `id="project-<slug>"` and a "Case Study" action linking to `projects/<slug>/`)
2. Update the inline JSON-LD ItemList (and `numberOfItems`)
3. Update `assets/js/knowledge-base.js` project entries (keep the same order as the page — `tests/site.test.mjs` checks counts), add the slug to `SLUGS` in `scripts/build-projects.mjs`, then bump `?v=` and run `npm run build` to generate the page and add its URL to `sitemap.xml`
4. Every project action link needs `rel="noopener noreferrer"` when using `target="_blank"` — and verify the target URL actually exists

### Modifying AI Assistant Knowledge

Edit `assets/js/knowledge-base.js`, run `npm run build` (re-bundles `ai-assistant.min.js`) and `npm test` (it checks the KB against index.html and the privacy rules and that the bundle is current), then bump the single `?v=` version in index.html.

### Updating Styles

- Main styles: `assets/css/style.css`; component-specific styles in their own files (register a new file by `@import`ing it in `critical.css` or `deferred.css`, then `npm run build`)
- Use the CSS custom properties defined in `:root` (style.css, glassmorphism.css, ai-assistant.css, shell.css, hud.css). New card-like components should reuse the bracketed-card pattern in hud.css; selectors there are prefixed with `main` so they beat the async deferred.css
- Only "Open Sans", "Raleway" and "Anton" are loaded as web fonts (self-hosted) — don't reference others; monospace labels use the system `--font-mono` stack. To add a font, extend `FAMILIES` in `scripts/build-fonts.py` and the allow-list in `tests/site.test.mjs`
- Card titles under an `h2` section are `h3` (a test rejects skipped heading levels)

## Deployment

This site is deployed to **GitHub Pages** at https://tariqahmaad.github.io/

The repository should be pushed to a GitHub repository named `tariqahmaad.github.io` for automatic GitHub Pages deployment. Note: `.htaccess` has no effect there.

## Vendor Libraries

- **Bootstrap 5**: CSS only for layout (`bootstrap.min.css` is the source, `bootstrap.subset.min.css` ships inside `critical.min.css`) — the JS bundle is NOT used
- **Boxicons / Remixicon / Bootstrap Icons**: icon fonts (subsetted — see Performance)
- **Particles.js**: Background particle effects (self-hosted)
- **Lenis**: smooth scrolling (self-hosted, `assets/vendor/lenis/`)
- **PureCounter**: Number counting animations
- **EmailJS**: Contact form delivery (self-hosted)

## Important Files

- **index.html**: the home page (all sections + inline JSON-LD)
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
