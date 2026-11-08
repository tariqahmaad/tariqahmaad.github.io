import { test } from 'node:test';
import assert from 'node:assert/strict';

import { containsPhrase, correctCommonTypos, calculateSimilarity, levenshteinDistance } from '../assets/js/assistant/text-match.js';
import {
    extractTechnology, extractRole, extractCompany, extractProject,
    getRelevantSkills, mentionsTech, techLabel
} from '../assets/js/assistant/entities.js';
import { renderMarkdown, escapeHtml } from '../assets/js/assistant/markdown.js';
import { knowledgeBase as kb } from '../assets/js/knowledge-base.js';

test('containsPhrase matches whole words only', () => {
    assert.equal(containsPhrase('hi there', 'hi'), true);
    assert.equal(containsPhrase('what is this', 'hi'), false);
    assert.equal(containsPhrase('what is your email', 'ai'), false);
    assert.equal(containsPhrase('experience with C# and .NET', 'c#'), true);
    assert.equal(containsPhrase('what\'s up', "what's up"), true);
});

test('containsPhrase tolerates plurals on phrases of 4+ characters', () => {
    assert.equal(containsPhrase('does he have certifications', 'certification'), true);
    assert.equal(containsPhrase('his skills', 'skill'), true);
    assert.equal(containsPhrase('this', 'hi'), false); // too short for plural handling
});

test('levenshtein / similarity', () => {
    assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
    assert.equal(levenshteinDistance('', 'abc'), 3);
    assert.equal(calculateSimilarity('same', 'same'), 1);
    assert.ok(calculateSimilarity('python', 'pyton') > 0.8);
});

test('typo correction is word-bounded', () => {
    assert.equal(correctCommonTypos('his skils in javascrpt'), 'his skills in javascript');
    // "jav" -> "java" must not corrupt "javascript"
    assert.equal(correctCommonTypos('javascript'), 'javascript');
});

test('extractTechnology picks the right technology', () => {
    assert.equal(extractTechnology('tell me about javascript'), 'javascript');
    assert.equal(extractTechnology('do you know java'), 'java');
    assert.equal(extractTechnology('django work'), 'django');
    assert.equal(extractTechnology('react native app'), 'react');
    assert.equal(extractTechnology('experience with C#'), 'csharp');
});

test('extractTechnology has no substring false positives', () => {
    assert.equal(extractTechnology('what is your email address'), 'technology'); // "ai" in email
    assert.equal(extractTechnology('show html projects'), 'technology'); // "ml" in html
    assert.equal(extractTechnology('are you available'), 'technology');
    assert.equal(extractTechnology('digital portfolio'), 'technology'); // "git" in digital
});

test('mentionsTech does not confuse Java and JavaScript', () => {
    assert.equal(mentionsTech('JavaScript', 'java'), false);
    assert.equal(mentionsTech('Spring Boot', 'java'), true);
    assert.equal(mentionsTech('Node.js', 'javascript'), true);
});

test('techLabel gives display names', () => {
    assert.equal(techLabel('javascript'), 'JavaScript');
    assert.equal(techLabel('unknown'), 'unknown');
});

test('extractRole prefers the longest matching title', () => {
    assert.equal(extractRole('tell me about the engineering researcher intern role', kb), 'engineering researcher intern');
    assert.equal(extractRole('what did the researcher intern do', kb), 'researcher intern');
    assert.equal(extractRole('frontend developer intern', kb), 'frontend developer intern');
});

test('extractCompany / extractProject', () => {
    assert.equal(extractCompany('what did he do at caretta software company', kb), 'caretta software company');
    assert.equal(extractProject('tell me about cv builder', kb)?.name, 'CV Builder');
    // common technologies alone must not select a project
    assert.equal(extractProject('anything with html and css and javascript', kb), undefined);
});

test('getRelevantSkills only returns skills that exist in the knowledge base', () => {
    const all = new Set([
        ...kb.skills.languages, ...kb.skills.frameworks, ...kb.skills.databases, ...kb.skills.tools
    ]);
    for (const tech of ['python', 'java', 'javascript', 'react', 'mysql', 'docker', 'git']) {
        for (const skill of getRelevantSkills(kb, tech)) assert.ok(all.has(skill), `${skill} is not in the KB`);
    }
    assert.deepEqual(getRelevantSkills(kb, 'python'), ['Python', 'Django (Python)']);
});

test('renderMarkdown formats lists, bold and safe links', () => {
    const html = renderMarkdown('**Skills:**\n• Python\n• Java\n\nSee [GitHub](https://github.com/x?a=1&b=2)');
    assert.match(html, /<strong>Skills:<\/strong>/);
    assert.match(html, /<ul><li>Python<\/li><li>Java<\/li><\/ul>/);
    assert.match(html, /<a href="https:\/\/github.com\/x\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">GitHub<\/a>/);
});

test('renderMarkdown neutralises HTML and unsafe URLs', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1)) [y](data:text/html,hi)');
    assert.doesNotMatch(html, /<img/);
    assert.doesNotMatch(html, /href="javascript/i);
    assert.doesNotMatch(html, /href="data/i);
    assert.match(html, /&lt;img/);
});

test('escapeHtml escapes the five special characters', () => {
    assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#039;&amp;&#039;&lt;/a&gt;');
});
