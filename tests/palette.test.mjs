import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch, rankCommands } from '../assets/js/palette/match.js';

test('an empty query matches everything and keeps the order', () => {
    const commands = [{ label: 'Projects' }, { label: 'About' }];
    assert.deepEqual(rankCommands(commands, '').map(c => c.label), ['Projects', 'About']);
    assert.ok(scoreMatch('', 'anything') > 0);
});

test('prefix beats word start beats substring beats subsequence', () => {
    const prefix = scoreMatch('pro', 'Projects');
    const wordStart = scoreMatch('pro', 'My Projects');
    const inside = scoreMatch('ect', 'Projects');
    const subsequence = scoreMatch('pjt', 'Projects');
    assert.ok(prefix > wordStart, 'prefix > word start');
    assert.ok(wordStart > inside, 'word start > substring');
    assert.ok(inside > subsequence, 'substring > subsequence');
    assert.ok(subsequence > 0);
});

test('letters that are not present never match', () => {
    assert.equal(scoreMatch('xyz', 'Projects'), 0);
    assert.equal(scoreMatch('sjp', 'Projects'), 0, 'out-of-order letters do not match');
});

test('regex characters in the query are treated literally', () => {
    assert.doesNotThrow(() => scoreMatch('c++', 'C++ and C#'));
    assert.doesNotThrow(() => scoreMatch('(', 'a (b)'));
    assert.ok(scoreMatch('c++', 'C++ and C#') > 0);
});

test('commands rank by best label or keyword match, label weighted double', () => {
    const commands = [
        { label: 'Email me', keywords: ['contact', 'mail'] },
        { label: 'Contact', keywords: [] },
        { label: 'GitHub', keywords: ['code', 'source'] }
    ];
    assert.deepEqual(rankCommands(commands, 'contact').map(c => c.label), ['Contact', 'Email me']);
    assert.deepEqual(rankCommands(commands, 'source').map(c => c.label), ['GitHub']);
    assert.deepEqual(rankCommands(commands, 'zzz'), []);
});
