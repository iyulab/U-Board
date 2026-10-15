import type { BoardAppearance, Shape } from '../view-document.js';

/** Text drawn on a dark board with no colour of its own — light enough to read on its paper. */
const DARK_BOARD_TEXT = '#e5e7eb';

/**
 * A decoration as drawn on a board of `appearance`. A colour of `none` paints nothing — the same as leaving it
 * out — so it is left out here, where both the viewer and the editor read decorations (a canvas would otherwise
 * ignore the word and paint in whatever colour it last used). A text decoration the author gave no colour is
 * drawn in the canvas's default dark ink, which disappears on a dark board, so there it takes a light one. A
 * colour the author chose is theirs, on either board.
 */
export function onBoard(shape: Shape, appearance: BoardAppearance = 'light'): Shape {
  const drawn = withoutNone(shape);
  return appearance === 'dark' && drawn.type === 'text' && drawn.fill === undefined ? { ...drawn, fill: DARK_BOARD_TEXT } : drawn;
}

const isNone = (colour: string | undefined) => colour?.trim().toLowerCase() === 'none';

/** A rect's `none` fill or stroke left out; a text's `none` ink made transparent (left out, it would take the default ink). */
function withoutNone(shape: Shape): Shape {
  if (shape.type === 'text') return isNone(shape.fill) ? { ...shape, fill: 'transparent' } : shape;
  if (!isNone(shape.fill) && !isNone(shape.stroke)) return shape;
  const { fill, stroke, ...rest } = shape;
  return {
    ...rest,
    ...(fill !== undefined && !isNone(fill) && { fill }),
    ...(stroke !== undefined && !isNone(stroke) && { stroke }),
  };
}
