// The figures of a board — the big numbers a `metric` or `stat-group` leads with — are set once by its skin: a scale and a weight.
// The scale is a word, not a number of pixels, so a figure stays in proportion to the card it is in at every width (the widget
// multiplies the size it would have drawn); the weight is a CSS font weight.

import { has } from './portable.js';
/** The scales a skin's `numerals.scale` names, and the multiple of the figure's own size each stands for. */
export const NUMERAL_SCALES = { small: 0.75, regular: 1, large: 1.25, xlarge: 1.75, xxlarge: 2.5 } as const;
export type NumeralScale = keyof typeof NUMERAL_SCALES;

/** The faces a `numerals.face` names, and the font each draws the figures in: the body's own (`plain`, the default) or the skin's `mono`
 *  stack (`skin.mono`) — digits of one width in a table column, a bar's value, a meter. The board names no font here: it says which of
 *  the two it already has. */
export const NUMERAL_FACES = { plain: 'var(--u-widget-font-family)', mono: 'var(--u-widget-font-mono)' } as const;
export type NumeralFace = keyof typeof NUMERAL_FACES;

/** Whether `value` is a weight a figure can take: a whole number from 100 (thin) to 900 (black). */
export function isNumeralWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 900;
}

/**
 * The tokens a numerals setting is handed to the widget library as. `figure` is the headline figure of a `metric` or
 * `stat-group` (a skin's `numerals` sets it for the whole board, a `stat` part's for itself); `value` is the figures inside a
 * card or a row — a `status-card` reading, a `list` row's trailing value and time — which a skin does not reach. Nothing for a
 * word or a weight that is not one.
 */
export function numeralTokens(numerals: { scale?: unknown; weight?: unknown; face?: unknown } | undefined, family: 'figure' | 'value'): Record<string, string> {
  const out: Record<string, string> = {};
  const scale = numerals?.scale;
  if (typeof scale === 'string' && has(NUMERAL_SCALES, scale)) out[`--u-widget-${family}-scale`] = String(NUMERAL_SCALES[scale as NumeralScale]);
  if (isNumeralWeight(numerals?.weight)) out[`--u-widget-${family}-weight`] = String(numerals!.weight);
  const face = numerals?.face;
  // The one font token every figure reads (a table's right-aligned column, a bar's value, a gauge's reading), not one per family.
  if (typeof face === 'string' && has(NUMERAL_FACES, face)) out['--u-widget-font-numeric'] = NUMERAL_FACES[face as NumeralFace];
  return out;
}
