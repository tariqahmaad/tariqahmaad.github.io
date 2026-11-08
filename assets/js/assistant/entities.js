/**
 * Extracts technologies, companies, roles and projects mentioned in a message.
 * Pure functions: the knowledge base is passed in, nothing touches the DOM.
 */
import { containsPhrase } from './text-match.js';

/**
 * Ordered most-specific first, so "javascript" never resolves to "java" and
 * "django" is reachable before "python". Matching is whole-word.
 */
const TECH_SYNONYMS = [
    ['neural', ['neural network', 'neural networks', 'deep learning', 'tensorflow']],
    ['django', ['django']],
    ['angular', ['angular', 'angularjs']],
    ['vue', ['vue', 'vuejs']],
    ['react', ['react', 'reactjs', 'react native', 'next.js', 'nextjs']],
    ['javascript', ['javascript', 'js', 'node', 'nodejs', 'node.js', 'express', 'typescript']],
    ['java', ['java', 'spring', 'spring boot', 'swing']],
    ['python', ['python', 'flask', 'fastapi']],
    ['csharp', ['c#', 'csharp', '.net', 'asp.net']],
    ['cpp', ['c++', 'cpp', 'qt']],
    ['php', ['php', 'laravel', 'symfony']],
    ['mysql', ['mysql', 'sql']],
    ['mongodb', ['mongodb', 'mongo']],
    ['docker', ['docker', 'container', 'containers']],
    ['git', ['git', 'github']],
    ['ai', ['ai', 'artificial intelligence', 'machine learning', 'ml']]
];

const TECH_LABELS = {
    neural: 'Neural Networks', django: 'Django', angular: 'Angular', vue: 'Vue', react: 'React',
    javascript: 'JavaScript', java: 'Java', python: 'Python', csharp: 'C#', cpp: 'C++', php: 'PHP',
    mysql: 'MySQL', mongodb: 'MongoDB', docker: 'Docker', git: 'Git', ai: 'AI'
};

/** Display name for a tech key ("javascript" -> "JavaScript"). */
export function techLabel(tech) {
    return TECH_LABELS[tech] || tech;
}

/** @returns {string} a tech key such as "python", or "technology" when none found */
export function extractTechnology(message) {
    for (const [tech, synonyms] of TECH_SYNONYMS) {
        if (synonyms.some(synonym => containsPhrase(message, synonym))) return tech;
    }
    return 'technology';
}

/**
 * Whole-word check of `text` against a tech key's synonyms, e.g.
 * mentionsTech("JavaScript", "java") is false but mentionsTech("Spring Boot", "java") is true.
 */
export function mentionsTech(text, tech) {
    const entry = TECH_SYNONYMS.find(([key]) => key === tech);
    const synonyms = entry ? entry[1] : [tech];
    return synonyms.some(synonym => containsPhrase(text, synonym));
}

/** Which KB skill names belong to a tech key (derived from the KB, never invented). */
const TECH_SKILL_ALIASES = {
    python: ['python', 'django'],
    java: ['java', 'spring boot'],
    javascript: ['javascript', 'react', 'bootstrap'],
    react: ['react'],
    django: ['django', 'python'],
    mysql: ['mysql'],
    mongodb: ['mongodb'],
    docker: ['docker'],
    git: ['git'],
    csharp: ['c#'],
    cpp: ['c++'],
    php: ['php']
};

export function getRelevantSkills(kb, tech) {
    const aliases = TECH_SKILL_ALIASES[tech] || [];
    const allSkills = [
        ...kb.skills.languages,
        ...kb.skills.frameworks,
        ...kb.skills.databases,
        ...kb.skills.tools
    ];
    return allSkills.filter(skill => aliases.some(alias => containsPhrase(skill, alias)));
}

export function extractCompany(message, kb) {
    const companies = [...new Set(kb.experience.map(exp => exp.company))];
    return companies.find(company => containsPhrase(message, company))?.toLowerCase();
}

/**
 * Matches the longest role title that appears in the message, so
 * "engineering researcher intern" is not swallowed by "researcher intern".
 */
export function extractRole(message, kb) {
    const titles = kb.experience.map(exp => exp.title.toLowerCase());
    const candidates = [...new Set([
        ...titles,
        ...titles.map(title => title.replace(/\s*\([^)]*\)/g, '').trim())
    ])].sort((a, b) => b.length - a.length);
    return candidates.find(title => containsPhrase(message, title));
}

const COMMON_TECH = new Set(['html', 'css', 'javascript', 'mysql', 'rest api']);

export function extractProject(message, kb) {
    const byName = kb.projects.find(project => containsPhrase(message, project.name));
    if (byName) return byName;

    // Require two distinctive technologies so HTML/CSS/JS alone never pick a project.
    return kb.projects.find(project =>
        project.technologies.filter(tech =>
            !COMMON_TECH.has(tech.toLowerCase()) && containsPhrase(message, tech)
        ).length >= 2
    );
}
