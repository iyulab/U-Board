import type { BoardAppearance } from './view-document.js';

/**
 * The theme's colours a board names instead of writing one: `positive`, `warning`, `negative` — what a state means —
 * and `accent`, the board's own accent (the theme's primary colour when it has none). Wherever a board takes a drawing
 * colour (a state's ring, a line, a frame, a text), a name is drawn in the board's tone: the widgets' palette
 * (u-widgets' `--u-widget-*` tokens), so a ring and a gauge mean the same green, and a dark board gets the colours
 * that read on it without a second set of hex values.
 */
export const THEME_COLORS = ['positive', 'warning', 'negative', 'accent'] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

/** The palette's colours by tone — the widgets' values. */
export const THEME_PALETTE: Record<BoardAppearance, { primary: string; positive: string; negative: string; warning: string }> = {
  light: { primary: '#4f46e5', positive: '#15803d', negative: '#dc2626', warning: '#d97706' },
  dark: { primary: '#818cf8', positive: '#4ade80', negative: '#f87171', warning: '#fbbf24' },
};

/** Whether a colour is one of the theme's names (in any case). */
export function isThemeColor(colour: unknown): boolean {
  return typeof colour === 'string' && (THEME_COLORS as readonly string[]).includes(colour.trim().toLowerCase());
}

/** A colour as drawn on a board of `appearance` with `accent`: a theme name as its value there, any other colour as
 *  it is. */
export function drawingColor(colour: string, appearance: BoardAppearance = 'light', accent?: string): string {
  const name = colour.trim().toLowerCase();
  if (!isThemeColor(name)) return colour;
  const palette = THEME_PALETTE[appearance];
  if (name !== 'accent') return palette[name as Exclude<ThemeColor, 'accent'>];
  const own = accent?.trim();
  return own && own.toLowerCase() !== 'none' && !isThemeColor(own) ? own : palette.primary;
}
