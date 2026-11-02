import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Board } from '@iyulab/u-board/domain';
import { checkBoard, emptyBoard } from '@iyulab/u-board/check';
import type { ViewKind } from '@iyulab/u-board/picture';
import { DocumentBoardStore, describeIssues } from './document-board.js';

export { DOCUMENT_BOARD_ID } from './document-board.js';

/**
 * A board kept in a file, with no U-Board server: the store behind `u-board-mcp --board <file>`. It holds one board, which
 * is the file; every change is checked as a server would check it before it is written (a refused change leaves the file
 * as it was), and written whole to the file at once, so a person can open it beside the assistant and watch it grow.
 * There are no data sources and no data: an assistant lays a board out and checks it, and what the board reads is the
 * business of whoever draws it with real data. The checks and the changes are a `DocumentBoardStore`'s; this one keeps them in a file.
 */
export class DocumentStore extends DocumentBoardStore {
  /**
   * Opens the board in `path`, or — when there is no such file — starts one there: an empty board of `kind`. A file that is
   * not a board a server would store is refused with the reasons, rather than opened to be worked on and never saved.
   */
  static async open(path: string, kind: ViewKind = 'grid'): Promise<DocumentStore> {
    let text: string | undefined;
    try {
      text = await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const options = { name: basename(path), save: (document: Board) => write(path, document) };
    if (text === undefined) {
      const document = emptyBoard(kind);
      await write(path, document);
      return new DocumentStore(document, options);
    }
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new Error(`${path} is not JSON`);
    }
    const { issues } = checkBoard(document);
    if (issues.length > 0) throw new Error(`${path} is not a board:\n${describeIssues(issues)}`);
    return new DocumentStore(document as Board, options);
  }
}

/** The file, written whole beside itself and moved into place, so it is never seen half written. */
async function write(path: string, document: Board): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}
