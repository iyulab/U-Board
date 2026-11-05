// The check a board meets before it is stored: its language (`validateBoard`), and
// then that it draws — a part the renderer cannot draw yet is refused when it is written, not on the page that shows it.
// The server's save and an assistant's tools check with this, so both refuse the same boards in the same words.

import { PictureError, toViewDocument } from './picture.js';
import type { Board } from './types.js';
import { validateBoard } from './validate.js';
import type { ViewKind } from '../view-document.js';

/** A problem or a piece of advice, at a JSON Pointer into the board. */
export interface BoardFinding {
  path: string;
  message: string;
  /** How many findings this line stands for, when it folds the same finding made at many places (`foldRepeats`). */
  count?: number;
}

/** How many times the same finding is given in full before the rest are counted. */
const SAME_FINDING_KEPT = 3;

/**
 * Findings that say the same words at different places — the same unknown source named by hundreds of data reads, the same hint on
 * every part of a big board — are given in full a few times and then counted in one line: the fix is the same, and an answer that
 * grows with the board is a cost the reader pays for each of them. A finding made fewer times than that is left as it is.
 */
export function foldRepeats(findings: readonly BoardFinding[], kept = SAME_FINDING_KEPT): BoardFinding[] {
  const places = new Map<string, BoardFinding[]>();
  for (const finding of findings) places.set(finding.message, [...(places.get(finding.message) ?? []), finding]);
  const shown = new Map<string, number>();
  const out: BoardFinding[] = [];
  for (const finding of findings) {
    const all = places.get(finding.message)!;
    // one hidden would be a line to say it: fold only where it saves some
    if (all.length <= kept + 1) { out.push(finding); continue; }
    const n = shown.get(finding.message) ?? 0;
    shown.set(finding.message, n + 1);
    if (n < kept) out.push(finding);
    else if (n === kept) {
      const hidden = all.slice(kept);
      const where = hidden.slice(0, 3).map(h => h.path).join(', ');
      out.push({ path: hidden[0]!.path, message: `and ${hidden.length} more the same (${where}${hidden.length > 3 ? ', …' : ''}) — the fix is the same: ${finding.message}`, count: hidden.length });
    }
  }
  return out;
}

/** What a board is refused for (`issues`), and — when there is nothing to refuse — what could be written better
 *  (`advice`). */
export interface BoardCheck {
  issues: BoardFinding[];
  advice: BoardFinding[];
}

/** The items a part made per item stands for when a board is checked: none — a board draws before its data has any
 *  items, and the items it has later do not change what it is. */
const NO_ITEMS = { keysOf: () => [], rowsOf: () => [] };

/** A board with no parts yet, laying out `kind` — what a new board starts as. A canvas is 1280 × 720 until it is resized. */
export function emptyBoard(kind: ViewKind): Board {
  return {
    parts: {},
    layout: kind === 'grid' ? { kind: 'grid', items: [] } : { kind: 'canvas', size: [1280, 720], place: {} },
  };
}

export function checkBoard(board: unknown): BoardCheck {
  const found = validateBoard(board);
  const issues = found.filter(f => !f.hint).map(({ at, message }) => ({ path: at, message }));
  if (issues.length === 0) {
    try {
      toViewDocument(board as Board, NO_ITEMS);
    } catch (error) {
      if (!(error instanceof PictureError)) throw error;
      issues.push({ path: error.at, message: error.message.slice(error.at.length + 2) });
    }
  }
  return { issues, advice: issues.length > 0 ? [] : foldRepeats(found.filter(f => f.hint).map(({ at, message }) => ({ path: at, message }))) };
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
export function sourceAdvice(board: Board, sources: readonly KnownSource[]): BoardFinding[] {
  const ids = new Set(sources.map(s => s.id));
  return foldRepeats(Object.entries(board.data ?? {}).flatMap(([name, query]) => {
    if (query.path === undefined || typeof query.from !== 'string' || ids.has(query.from)) return [];
    const said = query.from.trim().toLowerCase();
    const named = sources.filter(s => s.name.trim().toLowerCase() === said);
    const message =
      named.length === 1
        ? `"${query.from}" is the name of a data source — "from" takes its id: "${named[0]!.id}". Nothing is read until it does`
        : `"${query.from}" is no data source of this workspace — "from" takes a source's id (list_sources). Nothing is read until it does`;
    return [{ path: `/data/${name.replace(/~/g, '~0').replace(/\//g, '~1')}/from`, message }];
  }));
}
