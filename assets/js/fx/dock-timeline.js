/**
 * Pure timing helpers for the hero-name dock (unit tested in
 * tests/title-dock.test.mjs).
 *
 * The navbar shows exactly one version of the name at a time: the compact "TA"
 * in the hero, the flying copy during the handoff, and the full wordmark when it
 * is docked. The compact mark therefore yields (fades out) before the flying
 * copy reaches the logo columns and comes back once the copy has dropped clear
 * of the header. Without that hand-off the mark's parked/shifted letters and the
 * copy are drawn on top of each other and the navbar reads as a doubled name.
 *
 * Timings are fractions of the dock flight (0 = top of the page, 1 = docked).
 */

export const MARK_HIDE_FROM = 0.34
export const MARK_HIDE_TO = 0.5

export const clamp01 = (value) => Math.min(1, Math.max(0, value))

export const smoothstep = (t, from, to) => {
  const x = clamp01((t - from) / (to - from))
  return x * x * (3 - 2 * x)
}

/** Opacity of the compact "TA" for a flight progress in [0, 1]. */
export const markOpacityAt = (progress) =>
  1 - smoothstep(clamp01(progress), MARK_HIDE_FROM, MARK_HIDE_TO)
