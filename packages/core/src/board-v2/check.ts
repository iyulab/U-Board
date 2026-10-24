// The check a board in the language's second version meets before it is stored: its language (`validateBoardV2`), and
// then that it draws — a part the renderer cannot draw yet is refused when it is written, not on the page that shows it.
// The server's save and an assistant's tools check with this, so both refuse the same boards in the same words.

import { PictureError, toViewDocument } from './picture.js';
import type { ViewDocument, ViewKind } from '../view-document.js';
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

/** Whether a document is a board in this language — any object that names a version is read as one, so a wrong version
 *  is told what to say rather than read as a first-version view document, which names none. */
export function isBoardV2(document: unknown): document is BoardV2 {
  return typeof document === 'object' && document !== null && !Array.isArray(document) && Object.hasOwn(document, 'version');
}

/**
 * What a board stores: a document in this language, which says so (`"version": 2`), or a first-version view document,
 * which says no version. Both are read while stored boards move to this language.
 */
export type BoardDocument = ViewDocument | BoardV2;

/** The kind of view a stored document lays out — what a board list shows beside its name. */
export function documentKind(document: BoardDocument): ViewKind {
  return isBoardV2(document) ? document.layout.kind : document.kind;
}

/** A board with no parts yet, laying out `kind` — what a new board starts as. A canvas is 1280 × 720 until it is resized. */
export function emptyBoard(kind: ViewKind): BoardV2 {
  return {
    version: 2,
    parts: {},
    layout: kind === 'grid' ? { kind: 'grid', items: [] } : { kind: 'canvas', size: [1280, 720], place: {} },
  };
}

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

/** A data source of the workspace a board is saved in, as a board names it: by its id. */
export interface KnownSource {
  id: string;
  name: string;
}

/**
 * The data reads whose `from` names no data source of the workspace — read by a connector's request (`path`), so it is
 * one of the workspace's sources or nothing reads it — each at its `from`, saying which id to write when it names a
 * source by its name. Advice, not a refusal: a source may be removed after a board reads it, and the board still saves.
 */
export function sourceAdvice(board: BoardV2, sources: readonly KnownSource[]): BoardFinding[] {
  const ids = new Set(sources.map(s => s.id));
  return Object.entries(board.data ?? {}).flatMap(([name, query]) => {
    if (query.path === undefined || typeof query.from !== 'string' || ids.has(query.from)) return [];
    const said = query.from.trim().toLowerCase();
    const named = sources.filter(s => s.name.trim().toLowerCase() === said);
    const message =
      named.length === 1
        ? `"${query.from}" is the name of a data source — "from" takes its id: "${named[0]!.id}". Nothing is read until it does`
        : `"${query.from}" is no data source of this workspace — "from" takes a source's id (list_sources). Nothing is read until it does`;
    return [{ path: `/data/${name.replace(/~/g, '~0').replace(/\//g, '~1')}/from`, message }];
  });
}
