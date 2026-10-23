import { TONES, type Tone } from '@iyulab/u-widgets';
import type { BoardAppearance } from './view-document.js';

/**
 * The theme's colours a board names instead of writing one: the tones a state is drawn in (`ok` · `info` · `watch` ·
 * `warn` · `alarm` · `off` · `idle` · `accent` · `past` · `now` · `next`), `positive`, `warning`, `negative` — what a
 * state means — and `accent`, the board's own accent (the theme's primary colour when it has none). Wherever a board
 * takes a drawing colour (a state's ring, a line, a frame, a text), a name is drawn in the board's tone: the widgets'
 * palette (u-widgets' `--u-widget-*` tokens), so a ring and a gauge mean the same green, and a dark board gets the
 * colours that read on it without a second set of hex values.
 */
export const THEME_COLORS = ['positive', 'warning', 'negative', ...TONES] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

type Palette = { primary: string; positive: string; negative: string; warning: string; text: string; muted: string } & Record<Exclude<Tone, 'accent'>, string>;

/** The palette's colours by name — the widgets' values (`--u-widget-*` and `--u-widget-tone-*`). */
export const THEME_PALETTE: Record<BoardAppearance, Palette> = {
  light: tones({ primary: '#4f46e5', positive: '#15803d', negative: '#dc2626', warning: '#d97706', text: '#1a1a2e', muted: '#5b6777' }, {
    info: '#2563eb', watch: '#a16207', off: '#78716c', idle: '#64748b',
  }),
  dark: tones({ primary: '#818cf8', positive: '#4ade80', negative: '#f87171', warning: '#fbbf24', text: '#e2e8f0', muted: '#94a3b8' }, {
    info: '#60a5fa', watch: '#facc15', off: '#a8a29e', idle: '#94a3b8',
  }),
};

/** A palette's tones: the four with colours of their own, and the rest as the widgets take them from the others. */
function tones(base: Omit<Palette, Exclude<Tone, 'accent'>>, own: Pick<Palette, 'info' | 'watch' | 'off' | 'idle'>): Palette {
  return { ...base, ...own, ok: base.positive, warn: base.warning, alarm: base.negative, past: base.muted, now: own.info, next: base.text };
}

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
