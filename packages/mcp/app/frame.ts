import type { Board } from '@iyulab/u-board/domain';

/** The height of the frame for a board a grid lays out: it scrolls inside it. */
export const GRID_HEIGHT = 520;
/** What the viewer adds around the board it draws — the strip of zoom controls above it and the line that names the data below. */
export const CHROME = 72;
/** A frame is never shorter than this (a board a few pixels tall would leave no room for the controls) nor taller than this (a host's
 *  window is not the board's screen: past it the board is zoomed and panned). */
export const MIN_HEIGHT = 240;
export const MAX_HEIGHT = 720;

/** How tall the frame is to be for `board` in a frame `width` pixels wide: a canvas board fits its width whole, with its controls; a grid
 *  board has no shape of its own and takes a fixed height. */
export function frameHeight(board: Board, width: number): number {
  const { layout } = board;
  if (layout.kind !== 'canvas') return GRID_HEIGHT;
  const [w, h] = layout.size;
  if (!(w > 0) || !(h > 0) || !(width > 0)) return GRID_HEIGHT;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round((width * h) / w) + CHROME));
}
