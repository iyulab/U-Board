// The check a board in the language's second version meets before it is stored: its language (`validateBoardV2`), and
// then that it draws — a part the renderer cannot draw yet is refused when it is written, not on the page that shows it.
// The server's save and an assistant's tools check with this, so both refuse the same boards in the same words.

import { PictureError, toViewDocument } from './picture.js';
import type { BoardV2 } from './types.js';
import { validateBoardV2 } from './validate.js';

/** A problem or a piece of advice, at a JSON Pointer into the board. */
export interface BoardFinding {
  path: string;
  message: string;
}

/** What a board is refused for (`issues`), and — when there is nothing to refuse — what could be written better
 *  (`advice`). */
export interface BoardCheck {
  issues: BoardFinding[];
  advice: BoardFinding[];
}

/** The items a part made per item stands for when a board is checked: none — a board draws before its data has any
 *  items, and the items it has later do not change what it is. */
const NO_ITEMS = { keysOf: () => [] };

export function checkBoardV2(board: unknown): BoardCheck {
  const found = validateBoardV2(board);
  const issues = found.filter(f => !f.hint).map(({ at, message }) => ({ path: at, message }));
  if (issues.length === 0) {
    try {
      toViewDocument(board as BoardV2, NO_ITEMS);
    } catch (error) {
      if (!(error instanceof PictureError)) throw error;
      issues.push({ path: error.at, message: error.message.slice(error.at.length + 2) });
    }
  }
  return { issues, advice: issues.length > 0 ? [] : found.filter(f => f.hint).map(({ at, message }) => ({ path: at, message })) };
}
