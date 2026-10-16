import type { Node } from './view-document.js';
import type { BoxSize } from './node-size.js';

/** A node caption's font size, and its distance under the node's box. */
export const CAPTION_SIZE = 12;
const CAPTION_GAP = 4;

/** Average glyph width as a share of the font size — what a reader without a canvas assumes. */
export const ESTIMATED_GLYPH_WIDTH = 0.6;

/** A text's width estimated without a canvas. */
export function estimateTextWidth(text: string, size: number): number {
  return [...text].length * size * ESTIMATED_GLYPH_WIDTH;
}

/**
 * Where a node's caption is drawn: one line centred under its box, a little below it. `measure` gives a text's width —
 * the canvas's own where there is one, an estimate where there is not — so the renderer and the layout advice agree.
 */
export function captionBox(node: Pick<Node, 'x' | 'y' | 'caption'> & BoxSize, measure: (text: string, size: number) => number = estimateTextWidth): { x: number; y: number; width: number; height: number } {
  const width = measure(node.caption ?? '', CAPTION_SIZE);
  return { x: node.x + node.width / 2 - width / 2, y: node.y + node.height + CAPTION_GAP, width, height: CAPTION_SIZE };
}
