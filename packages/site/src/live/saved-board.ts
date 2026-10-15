// What the playground keeps in the browser, and how it reads it back.

import { validateViewDocument, type CanvasView } from '@iyulab/u-board/domain';

export const STORAGE_KEY = 'u-board-try';

/** The board this browser saved, if it is still a canvas view the product accepts; otherwise none —
 *  a stored board from an older version of the page, or edited by hand, opens the sample instead. */
export function savedBoard(storage: Pick<Storage, 'getItem'> | undefined): CanvasView | undefined {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const doc: unknown = JSON.parse(raw);
    return validateViewDocument(doc).length === 0 && (doc as CanvasView).kind === 'canvas' ? (doc as CanvasView) : undefined;
  } catch {
    return undefined;
  }
}
