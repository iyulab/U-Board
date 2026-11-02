import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { applyJsonPatch, toViewDocument, type Board } from '@iyulab/u-board/domain';
import { checkBoard, emptyBoard } from '@iyulab/u-board/check';
import type { ViewKind } from '@iyulab/u-board/picture';
import { UBoardApiError, type Saved, type SavedBoard } from './client.js';
import type { BoardStore } from './store.js';

/** The id the one board of a document goes by — a tool that is given none means it. */
export const DOCUMENT_BOARD_ID = 'board';

/** The items a part made per item stands for when no data is read: none — a document alone has no data to read. */
const NO_ITEMS = { keysOf: () => [], rowsOf: () => [] };

/**
 * A board kept in a file, with no U-Board server: the store behind `u-board-mcp --board <file>`. It holds one board, which
 * is the file; every change is checked as a server would check it before it is written (a refused change leaves the file
 * as it was), and written whole to the file at once, so a person can open it beside the assistant and watch it grow.
 * There are no data sources and no data: an assistant lays a board out and checks it, and what the board reads is the
 * business of whoever draws it with real data.
 */
export class DocumentStore implements BoardStore {
  readonly soleBoard = DOCUMENT_BOARD_ID;
  private revision = 1;
  private updatedAt = new Date().toISOString();
  /** Changes go one after another: two arriving together never read the same revision. */
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(
    private readonly path: string,
    private document: Board
  ) {}

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
    if (text === undefined) {
      const store = new DocumentStore(path, emptyBoard(kind));
      await store.write();
      return store;
    }
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new Error(`${path} is not JSON`);
    }
    const { issues } = checkBoard(document);
    if (issues.length > 0) {
      throw new Error(`${path} is not a board:\n${issues.slice(0, 10).map(i => `  ${i.path} — ${i.message}`).join('\n')}${issues.length > 10 ? `\n  … and ${issues.length - 10} more` : ''}`);
    }
    return new DocumentStore(path, document as Board);
  }

  async getBoard(boardId: string): Promise<SavedBoard> {
    this.only(boardId);
    return {
      id: DOCUMENT_BOARD_ID,
      name: basename(this.path),
      document: this.document,
      // What its viewers draw, with no data to read.
      picture: toViewDocument(this.document, NO_ITEMS),
      revision: this.revision,
      updatedAt: this.updatedAt,
    };
  }

  putDocument(boardId: string, document: unknown, revision?: number): Promise<Saved> {
    return this.change(boardId, revision, () => document);
  }

  patchDocument(boardId: string, patch: unknown, revision?: number): Promise<Saved> {
    return this.change(boardId, revision, current => applyJsonPatch(current, patch as never));
  }

  /** One change: on the revision asked for, to a board that passes its check, written before it is answered. */
  private change(boardId: string, revision: number | undefined, next: (current: Board) => unknown): Promise<Saved> {
    const run = this.queue.then(async (): Promise<Saved> => {
      this.only(boardId);
      if (revision !== undefined && revision !== this.revision) throw new UBoardApiError(412, { code: 'BOARD_CHANGED', revision: this.revision });
      const candidate = next(this.document);
      const { issues, advice } = checkBoard(candidate);
      if (issues.length > 0) throw new UBoardApiError(400, { code: 'INVALID_DOCUMENT', issues: issues.slice(0, 50), message: 'the board is not valid — nothing was saved' });
      const before = { document: this.document, revision: this.revision, updatedAt: this.updatedAt };
      this.document = candidate as Board;
      this.revision += 1;
      this.updatedAt = new Date().toISOString();
      try {
        await this.write();
      } catch (error) {
        Object.assign(this, before);
        throw error;
      }
      return { id: DOCUMENT_BOARD_ID, revision: this.revision, advice };
    });
    this.queue = run.catch(() => {});
    return run;
  }

  /** The file, written whole beside itself and moved into place, so it is never seen half written. */
  private async write(): Promise<void> {
    const temporary = `${this.path}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(this.document, null, 2)}\n`, 'utf8');
    await rename(temporary, this.path);
  }

  private only(boardId: string): void {
    if (boardId !== DOCUMENT_BOARD_ID) throw new UBoardApiError(404, { code: 'NOT_FOUND', message: `this document holds one board, "${DOCUMENT_BOARD_ID}"` });
  }
}
