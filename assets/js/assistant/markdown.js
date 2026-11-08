/**
 * Minimal, safe markdown renderer for assistant replies.
 * Everything is HTML-escaped FIRST, then a small whitelist of formatting is
 * re-applied, so neither user text nor knowledge-base text can inject markup.
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

export function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

function renderInline(escaped) {
    return escaped
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
            // `url` is already escaped; decode only what the scheme check needs.
            const raw = url.replace(/&amp;/g, '&');
            return SAFE_URL.test(raw)
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
                : label;
        });
}

const BULLET = /^\s*[•\-]\s+(.*)$/;
const NUMBERED = /^\s*\d+\.\s+(.*)$/;

/** Renders assistant markdown (bold, italic, code, links, lists) to safe HTML. */
export function renderMarkdown(content) {
    const lines = escapeHtml(content).split('\n');
    const out = [];
    let paragraph = [];
    let list = null; // { tag, items }

    const flushParagraph = () => {
        if (paragraph.length) out.push(`<p>${paragraph.join('<br>')}</p>`);
        paragraph = [];
    };
    const flushList = () => {
        if (list) out.push(`<${list.tag}>${list.items.map(item => `<li>${item}</li>`).join('')}</${list.tag}>`);
        list = null;
    };

    for (const line of lines) {
        const bullet = line.match(BULLET);
        const numbered = bullet ? null : line.match(NUMBERED);
        const listMatch = bullet || numbered;

        if (listMatch) {
            flushParagraph();
            const tag = bullet ? 'ul' : 'ol';
            if (!list || list.tag !== tag) {
                flushList();
                list = { tag, items: [] };
            }
            list.items.push(renderInline(listMatch[1]));
        } else if (line.trim() === '') {
            flushParagraph();
            flushList();
        } else {
            flushList();
            paragraph.push(renderInline(line));
        }
    }
    flushParagraph();
    flushList();
    return out.join('');
}
