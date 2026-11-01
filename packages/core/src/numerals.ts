// The figures of a board — the big numbers a `metric` or `stat-group` leads with — are set once by its skin: a scale and a weight.
// The scale is a word, not a number of pixels, so a figure stays in proportion to the card it is in at every width (the widget
// multiplies the size it would have drawn); the weight is a CSS font weight.

/** The scales a skin's `numerals.scale` names, and the multiple of the figure's own size each stands for. */
export const NUMERAL_SCALES = { small: 0.75, regular: 1, large: 1.25, xlarge: 1.75 } as const;
export type NumeralScale = keyof typeof NUMERAL_SCALES;

/** Whether `value` is a weight a figure can take: a whole number from 100 (thin) to 900 (black). */
export function isNumeralWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 900;
}
