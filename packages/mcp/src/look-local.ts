import { readFile } from 'node:fs/promises';
import { pictureOf, readerOf, type Board } from '@iyulab/u-board/domain';
import type { ViewDocument } from '@iyulab/u-board/picture';
import type { Looker, LookRequest, LookResult } from './look.js';
import { drawBoard } from './render.js';
import { snapshotAdapters } from './render-cli.js';
import type { BoardStore } from './store.js';

/** What the sources of a board answer, kept in a file: `{ "<source id>": { "<path>": <the body that source answered> } }` — the
 *  same shape `u-board-render --data` takes. */
export type Answers = Record<string, Record<string, unknown>>;

/** The answers in `path`; refuses a file that is not that shape, naming what is wrong. */
export async function readAnswers(path: string): Promise<Answers> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error instanceof SyntaxError ? 'not JSON' : error instanceof Error ? error.message : String(error)}`);
  }
  const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
  if (!isObject(parsed) || !Object.values(parsed).every(isObject)) {
    throw new Error(`${path}: expected { "<source id>": { "<path>": <the body that source answered> } }`);
  }
  return parsed as Answers;
}

/** A board's picture with its sources read from `answers` — what a board kept in a file is drawn from when it has data to show, so a
 *  part made per item of a list has its items. */
export function pictureWith(answers: Answers): (board: Board) => Promise<ViewDocument> {
  return board => pictureOf(board, readerOf(snapshotAdapters(answers, Date.now())));
}

/**
 * Draws the board of a store that is a file, as its viewers see it, in a browser on this computer — no server: the same drawing and
 * report `renderBoard` makes, with the sources read from `answers`. What `look` is when `u-board-mcp` is given `--board`.
 */
export class LocalLooker implements Looker {
  constructor(
    private readonly store: Pick<BoardStore, 'getBoard'>,
    private readonly answers: Answers = {},
    private readonly browser?: string
  ) {}

  async look(request: LookRequest, _picture: ViewDocument): Promise<LookResult> {
    const { document } = await this.store.getBoard(request.board);
    return drawBoard({
      board: document,
      adapters: snapshotAdapters(this.answers, Date.now()),
      width: request.width,
      height: request.height,
      ...(request.appearance && { appearance: request.appearance }),
      ...(request.focus && { focus: request.focus }),
      ...(this.browser && { browser: this.browser }),
    });
  }
}
