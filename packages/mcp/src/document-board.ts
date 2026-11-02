import { applyJsonPatch, toViewDocument, type Board } from '@iyulab/u-board/domain';
import { checkBoard, emptyBoard } from '@iyulab/u-board/check';
import type { ViewKind } from '@iyulab/u-board/picture';
import { UBoardApiError, type Saved, type SavedBoard } from './client.js';
import type { BoardStore } from './store.js';

/** The id the one board of a document goes by — a tool that is given none means it. */
export const DOCUMENT_BOARD_ID = 'board';

/** The items a part made per item stands for when no data is read: none — a document alone has no data to read. */
const NO_ITEMS = { keysOf: () => [], rowsOf: () => [] };

export interface DocumentBoardOptions {
  /** What the board is called in `get_board`; "board" when left out. */
  name?: string;
  /** The revision the board is at, when the host keeps its own count; 1 when left out. A change made on a revision the board
   *  has moved past is refused, as a server refuses it. */
  revision?: number;
  /** Writes the board a change produced — to a database, a file, wherever the host keeps it. A change is answered only once
   *  this has resolved, and is undone when it rejects, so the store never says "saved" for what the host did not keep. */
  save?: (document: Board) => Promise<void>;
}

/**
 * One board the host keeps, offered to the board tools as a store: what an app that has no U-Board server hands an
 * assistant to draw a board in. Every change is checked as a server would check it before it is kept — a refused change
 * leaves the board as it was, with the issues at their paths — and answered with the new revision and advice. It holds
 * one board, so a tool needs none named. There are no data sources and no data: the assistant lays a board out and checks
 * it, and what the board reads is the business of whoever draws it with real data. Nothing here needs Node.
 */
export class DocumentBoardStore implements BoardStore {
  readonly soleBoard = DOCUMENT_BOARD_ID;
  private revision: number;
  private updatedAt = new Date().toISOString();
  private readonly name: string;
  private readonly save: (document: Board) => Promise<void>;
  /** Changes go one after another: two arriving together never read the same revision. */
  private queue: Promise<unknown> = Promise.resolve();

  /** A board that passes the check a server applies before it stores one — throws with the issues otherwise. */
  constructor(private document: Board, options: DocumentBoardOptions = {}) {
    const { issues } = checkBoard(document);
    if (issues.length > 0) throw new Error(`the document is not a board:\n${describeIssues(issues)}`);
    this.name = options.name ?? DOCUMENT_BOARD_ID;
    this.revision = options.revision ?? 1;
    this.save = options.save ?? (async () => {});
  }

  /** An empty board of `kind` — what a new board starts as. */
  static empty(kind: ViewKind = 'grid', options: DocumentBoardOptions = {}): DocumentBoardStore {
    return new DocumentBoardStore(emptyBoard(kind), options);
  }

  async getBoard(boardId: string): Promise<SavedBoard> {
    this.only(boardId);
    return {
      id: DOCUMENT_BOARD_ID,
      name: this.name,
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

  /** One change: on the revision asked for, to a board that passes its check, kept by the host before it is answered. */
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
        await this.save(this.document);
      } catch (error) {
        Object.assign(this, before);
        throw error;
      }
      return { id: DOCUMENT_BOARD_ID, revision: this.revision, advice };
    });
    this.queue = run.catch(() => {});
    return run;
  }

  private only(boardId: string): void {
    if (boardId !== DOCUMENT_BOARD_ID) throw new UBoardApiError(404, { code: 'NOT_FOUND', message: `this document holds one board, "${DOCUMENT_BOARD_ID}"` });
  }
}

/** The first ten issues of a refused board, one to a line, at their paths. */
export function describeIssues(issues: { path: string; message: string }[]): string {
  return `${issues.slice(0, 10).map(i => `  ${i.path} — ${i.message}`).join('\n')}${issues.length > 10 ? `\n  … and ${issues.length - 10} more` : ''}`;
}
