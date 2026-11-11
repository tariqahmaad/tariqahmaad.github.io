/**
 * Fuzzy matching for the command palette. Pure functions, unit tested.
 *
 * scoreMatch(query, text) returns 0 for "no match" and a positive number
 * otherwise; higher is better. Order of preference:
 *   1. the text starts with the query
 *   2. a word in the text starts with the query
 *   3. the query appears somewhere inside the text
 *   4. the query's letters appear in order (subsequence), tighter is better
 */
export function scoreMatch(query, text) {
  const q = String(query).trim().toLowerCase()
  const t = String(text).toLowerCase()
  if (!q) return 1
  if (!t) return 0

  if (t.startsWith(q)) return 1000 - t.length
  const wordStart = t.search(new RegExp('(?:^|[^a-z0-9])' + escapeRegExp(q)))
  if (wordStart !== -1) return 800 - wordStart - t.length * 0.1
  const index = t.indexOf(q)
  if (index !== -1) return 600 - index - t.length * 0.1

  let cursor = -1
  let gaps = 0
  for (const ch of q) {
    const next = t.indexOf(ch, cursor + 1)
    if (next === -1) return 0
    if (cursor !== -1) gaps += next - cursor - 1
    cursor = next
  }
  return Math.max(1, 300 - gaps * 5 - t.length * 0.1)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Filters and ranks commands. A command matches if its label or any keyword
 * matches; the label counts double. With an empty query the original order is
 * kept.
 */
export function rankCommands(commands, query) {
  if (!String(query).trim()) return commands.slice()
  return commands
    .map((command, order) => {
      const labelScore = scoreMatch(query, command.label) * 2
      const keywordScore = Math.max(0, ...(command.keywords || []).map((k) => scoreMatch(query, k)))
      return { command, order, score: Math.max(labelScore, keywordScore) }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.command)
}
