import { placedAt, type ViewDocument } from '@iyulab/u-board/picture';

// Where each part of a board is drawn on the page — for `look`, wherever it draws the board (the MCP server's browser,
// or a page that draws it itself). Nothing here needs Node.

/** Each node or grid item the viewer draws, with where it is and the attribute its frame carries on the page — a grid's
 *  canvas cell's nodes as nodes. */
export function placedParts(doc: ViewDocument): Array<{ id: string; path: string; attr: string }> {
  return placedAt(doc).map(({ placed, at }) => ({ id: placed.id, path: at, attr: doc.kind === 'canvas' || at.includes('/canvas/') ? 'data-node-id' : 'data-item-id' }));
}
