/**
 * Shared constants for the chat assistant.
 */

/** Below this viewport width the widget uses its mobile layout (matches CSS). */
export const MOBILE_BREAKPOINT = 768;

export const TIMING = {
    /** Pause before an answer starts, so the typing indicator is perceptible. */
    thinkMinMs: 250,
    thinkMaxMs: 650,
    /** Per-word delay while an answer streams in. */
    streamMinMs: 15,
    streamMaxMs: 45,
    /** How long before the FAB's notification badge appears. */
    notificationDelayMs: 5000
};

export const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** An intent must score above this to be chosen at all. */
export const INTENT_MIN_SCORE = 0.3;

/** A topical (non wh-question) intent at or above this beats the generic wh-question intents. */
export const TOPICAL_MIN_SCORE = 0.2;

/** Function words ignored by word-level fuzzy matching so they can't drive an intent. */
export const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'do', 'does', 'did', 'you', 'your', 'he', 'his',
    'him', 'she', 'her', 'it', 'i', 'me', 'my', 'we', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'for',
    'with', 'can', 'could', 'have', 'has',
    // question words appear in dozens of patterns and say nothing about the topic
    'what', 'who', 'where', 'when', 'why', 'how', 'which'
]);
