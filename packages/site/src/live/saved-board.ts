// What the playground keeps in the browser, and how it reads it back.

import { type Board } from '@iyulab/u-board/domain';
import { checkBoard } from '@iyulab/u-board-designer/check';

export const STORAGE_KEY = 'u-board-try';

/** The board this browser saved, if it is still a board the product accepts; otherwise none — a stored board from an
 *  older version of the page, or edited by hand, opens the sample instead. */
export function savedBoard(storage: Pick<Storage, 'getItem'> | undefined): Board | undefined {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const board: unknown = JSON.parse(raw);
    return checkBoard(board).issues.length === 0 ? (board as Board) : undefined;
  } catch {
    return undefined;
  }
}
