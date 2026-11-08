/**
 * Pure text-matching helpers for the chat assistant (no DOM, unit-testable).
 */

const ALNUM = 'a-z0-9';

export function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const phraseRegexCache = new Map();

/**
 * True when `phrase` appears in `text` as a whole word / whole phrase.
 * Uses alphanumeric look-arounds instead of \b so phrases that start or end
 * with punctuation ("c#", ".net", "what's up") still match correctly, and
 * short words never match inside longer ones ("hi" vs "this", "ai" vs "email").
 * (Case-insensitive; a trailing plural "s"/"es" is tolerated on phrases of 4+ characters.)
 */
export function containsPhrase(text, phrase) {
    let regex = phraseRegexCache.get(phrase);
    if (!regex) {
        // Phrases of 4+ characters also match their plural ("certification" ~ "certifications")
        const plural = phrase.length >= 4 ? '(?:s|es)?' : '';
        regex = new RegExp(`(?<![${ALNUM}])${escapeRegExp(phrase.toLowerCase())}${plural}(?![${ALNUM}])`);
        phraseRegexCache.set(phrase, regex);
    }
    return regex.test(text.toLowerCase());
}

/** Levenshtein edit distance between two strings. */
export function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previous = Array.from({ length: a.length + 1 }, (_, i) => i);
    for (let i = 1; i <= b.length; i++) {
        const current = [i];
        for (let j = 1; j <= a.length; j++) {
            current[j] = b.charAt(i - 1) === a.charAt(j - 1)
                ? previous[j - 1]
                : Math.min(previous[j - 1] + 1, current[j - 1] + 1, previous[j] + 1);
        }
        previous = current;
    }
    return previous[a.length];
}

/** Similarity in [0, 1] derived from the Levenshtein distance. */
export function calculateSimilarity(a, b) {
    const longer = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    if (longer.length === 0) return 1;
    return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

const TYPO_CORRECTIONS = {
    skil: 'skill',
    skils: 'skills',
    tehnology: 'technology',
    tehnologies: 'technologies',
    porject: 'project',
    porjects: 'projects',
    experiance: 'experience',
    educaton: 'education',
    universiy: 'university',
    contct: 'contact',
    contat: 'contact',
    avaliable: 'available',
    freelncer: 'freelancer',
    programing: 'programming',
    developement: 'development',
    framwork: 'framework',
    'data base': 'database',
    'data bases': 'databases',
    javascrpt: 'javascript',
    pyton: 'python',
    jav: 'java',
    reactjs: 'react',
    'react js': 'react',
    springboot: 'spring boot',
    'git hub': 'github',
    linkdin: 'linkedin',
    twiter: 'twitter',
    facebok: 'facebook',
    instgram: 'instagram'
};

const TYPO_REGEXES = Object.entries(TYPO_CORRECTIONS).map(([typo, fix]) => [
    new RegExp(`(?<![${ALNUM}])${escapeRegExp(typo)}(?![${ALNUM}])`, 'gi'),
    fix
]);

/** Fix common typos using whole-word matches so valid words are never corrupted. */
export function correctCommonTypos(message) {
    return TYPO_REGEXES.reduce((text, [regex, fix]) => text.replace(regex, fix), message);
}
