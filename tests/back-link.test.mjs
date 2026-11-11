import { test } from 'node:test';
import assert from 'node:assert/strict';

import { shouldGoBack } from '../assets/js/back-link.js';

const origin = 'https://tariqahmaad.github.io';

test('coming from this site\'s home page with history: use the browser back', () => {
    assert.equal(shouldGoBack({ referrer: `${origin}/`, origin, historyLength: 3 }), true);
    assert.equal(shouldGoBack({ referrer: `${origin}/#projects`, origin, historyLength: 2 }), true);
    assert.equal(shouldGoBack({ referrer: `${origin}/index.html`, origin, historyLength: 2 }), true);
});

test('a direct visit (no referrer) follows the link to /#projects', () => {
    assert.equal(shouldGoBack({ referrer: '', origin, historyLength: 5 }), false);
});

test('coming from another site follows the link', () => {
    assert.equal(shouldGoBack({ referrer: 'https://www.linkedin.com/feed/', origin, historyLength: 4 }), false);
    assert.equal(shouldGoBack({ referrer: 'https://tariqahmaad.github.io.evil.example/', origin, historyLength: 4 }), false);
});

test('coming from another case study (pager) follows the link, so Back is always the projects list', () => {
    assert.equal(shouldGoBack({ referrer: `${origin}/projects/quizlet/`, origin, historyLength: 6 }), false);
});

test('no history to go back to follows the link', () => {
    assert.equal(shouldGoBack({ referrer: `${origin}/`, origin, historyLength: 1 }), false);
});

test('garbage input never throws', () => {
    assert.equal(shouldGoBack({ referrer: 'not a url', origin, historyLength: 3 }), false);
    assert.equal(shouldGoBack({ referrer: `${origin}/`, origin: '', historyLength: 3 }), false);
});
