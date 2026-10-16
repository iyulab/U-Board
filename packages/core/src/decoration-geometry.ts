import type { Placement, RectShape, TextShape } from './view-document.js';

/** A text decoration's font size when it gives none — the canvas's default. */
export const DEFAULT_TEXT_SIZE = 16;
/** A frame's name's font size when it gives none. */
export const DEFAULT_LABEL_SIZE = 13;
/** How far a frame's name sits in from the frame's edges. */
export const LABEL_INSET = 8;
/** The room a text's background leaves around the text, on every side. */
export const TEXT_BACKGROUND_PAD = 4;

export type Row = 'top' | 'middle' | 'bottom';
export type Column = 'start' | 'center' | 'end';

/** A placement's row and column: `top-start` is the top row's start, `start` the middle row's, `top` the top row's middle. */
export function placementParts(placement: Placement): { row: Row; column: Column } {
  const [first, second] = placement.split('-') as [string, string | undefined];
  if (second) return { row: first as Row, column: second as Column };
  if (first === 'top' || first === 'bottom') return { row: first, column: 'center' };
  if (first === 'center') return { row: 'middle', column: 'center' };
  return { row: 'middle', column: first as Column };
}

/** Where a frame's name goes: the point it is anchored at — inside the frame, `LABEL_INSET` from the edges `labelAt`
 *  names — and which point of the name's box that is. */
export function frameLabelPoint(rect: RectShape): { x: number; y: number; row: Row; column: Column; size: number } {
  const { row, column } = placementParts(rect.labelAt ?? 'top-start');
  const x = column === 'start' ? rect.x + LABEL_INSET : column === 'end' ? rect.x + rect.width - LABEL_INSET : rect.x + rect.width / 2;
  const y = row === 'top' ? rect.y + LABEL_INSET : row === 'bottom' ? rect.y + rect.height - LABEL_INSET : rect.y + rect.height / 2;
  return { x, y, row, column, size: rect.labelSize ?? DEFAULT_LABEL_SIZE };
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A box of this size whose `row`/`column` point is at x/y. */
export function boxAt(x: number, y: number, width: number, height: number, row: Row, column: Column): Box {
  return {
    x: column === 'start' ? x : column === 'end' ? x - width : x - width / 2,
    y: row === 'top' ? y : row === 'bottom' ? y - height : y - height / 2,
    width,
    height,
  };
}

/** The box a text decoration takes, given its text's width: one line, placed by `anchor`, grown by its background's room. */
export function textDecorationBox(text: TextShape, width: number): Box {
  const size = text.fontSize ?? DEFAULT_TEXT_SIZE;
  const { row, column } = placementParts(text.anchor ?? 'top-start');
  const box = boxAt(text.x, text.y, width, size, row, column);
  if (text.background === undefined) return box;
  const pad = TEXT_BACKGROUND_PAD;
  return { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad };
}

/** The box a frame's name takes, given the name's width. Undefined when the frame has no name. */
export function frameLabelBox(rect: RectShape, width: (text: string, size: number) => number): Box | undefined {
  if (!rect.label?.trim()) return undefined;
  const at = frameLabelPoint(rect);
  return boxAt(at.x, at.y, width(rect.label, at.size), at.size, at.row, at.column);
}
