/**
 * Pure helpers for the hero title glitch.
 *
 * This module deliberately has no DOM access: the randomised maths is the part
 * worth testing, and tests/hero-glitch.test.mjs runs it in plain Node. hero-fx.js
 * owns all of the painting and the stepping.
 */

/** Glyphs the decode intro scrambles the name with. */
export const DECODE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$<>/'

/** Glyphs written into the decorative copies during a burst (never into the real name). */
export const CORRUPT_GLYPHS = '#%&@$<>/\\|_0123456789'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** Random number in [min, max]. */
export const between = (rng, min, max) => clamp(min + rng() * (max - min), min, max)

/** Random element of a non-empty list; safe even for an rng that returns 1. */
export const pick = (rng, values) =>
  values[Math.min(values.length - 1, Math.max(0, Math.floor(rng() * values.length)))]

/** True with probability `probability`. */
export const chance = (rng, probability) => rng() < probability

/**
 * A horizontal slice of the title box, in percentages:
 * 0 <= top, height > 0, top + height <= 96.
 */
export const band = (rng, minHeight = 2, maxHeight = 18) => {
  const max = Math.max(0.5, Math.min(maxHeight, 100))
  const min = Math.min(Math.max(0.5, minHeight), max)
  const height = between(rng, min, max)
  const top = between(rng, 0, Math.max(0, 96 - height))
  return { top, height, bottom: 100 - top - height }
}

/**
 * Replace up to `edits` letters/digits with glitch glyphs. Spaces and
 * punctuation are left alone, the length never changes, and every edit hits a
 * different character (so a corrupted copy still lines up with the real name).
 */
export const corrupt = (rng, text, edits = 2) => {
  const chars = text.split('')
  const candidates = []
  chars.forEach((char, index) => {
    if (/[a-z0-9]/i.test(char)) candidates.push(index)
  })

  const count = Math.max(0, Math.min(edits, candidates.length))
  for (let edit = 0; edit < count; edit += 1) {
    const position = Math.min(candidates.length - 1, Math.max(0, Math.floor(rng() * candidates.length)))
    const [index] = candidates.splice(position, 1)
    const glyphIndex = Math.min(CORRUPT_GLYPHS.length - 1, Math.max(0, Math.floor(rng() * CORRUPT_GLYPHS.length)))
    let glyph = CORRUPT_GLYPHS[glyphIndex]
    // A digit can be replaced by itself; step once so every edit is visible.
    if (glyph === chars[index]) glyph = CORRUPT_GLYPHS[(glyphIndex + 1) % CORRUPT_GLYPHS.length]
    chars[index] = glyph
  }

  return chars.join('')
}
