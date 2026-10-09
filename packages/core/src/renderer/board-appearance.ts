import type { BoardAppearance, Shape } from '../view-document.js';

/** Text drawn on a dark board with no colour of its own — light enough to read on its paper. */
const DARK_BOARD_TEXT = '#e5e7eb';

/**
 * A decoration as drawn on a board of `appearance`. A text decoration the author gave no colour is
 * drawn in the canvas's default dark ink, which disappears on a dark board, so there it takes a light
 * one. A colour the author chose is theirs, on either board.
 */
export function onBoard(shape: Shape, appearance: BoardAppearance = 'light'): Shape {
  return appearance === 'dark' && shape.type === 'text' && shape.fill === undefined ? { ...shape, fill: DARK_BOARD_TEXT } : shape;
}
