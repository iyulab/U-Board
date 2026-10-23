// The words a state is drawn in — the widget library's vocabulary, kept here so the domain layer (validation, the
// server, the board language) reads it without loading the widgets themselves. `tones.test.ts` holds the two equal.

/**
 * The eleven tones a state is drawn in: `ok` · `info` · `watch` · `warn` · `alarm` · `off` · `idle` · `accent`, and the
 * places in a sequence `past` · `now` · `next`.
 */
export const TONES = ['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent', 'past', 'now', 'next'] as const;
export type Tone = (typeof TONES)[number];

/** A second channel besides colour, for a state that must not be missed. */
export const EMPHASES = ['invert', 'hatch', 'stamp', 'blink'] as const;
export type Emphasis = (typeof EMPHASES)[number];
