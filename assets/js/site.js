/**
 * Bundle entry for the site's classic scripts. `npm run build` bundles these
 * (in this order) into assets/js/site.min.js, which index.html loads with a
 * single deferred <script>. Order matters: the form and particles set up before
 * main.js wires navigation; the boot sequence goes first of the effects so the
 * others can wait for its `boot:done` event.
 *
 * The AI assistant is a separate, lazily imported bundle (see ai-assistant.js).
 */
import './contact-form.js';
import './particles-config.js';
import './main.js';
import './back-link.js';
import './fx/preloader.js';
import './fx/reveal.js';
import './fx/hero-fx.js';
import './fx/cursor.js';
