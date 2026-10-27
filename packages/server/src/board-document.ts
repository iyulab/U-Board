import { type Board } from '@iyulab/u-board/domain';
import { checkBoard, sourceAdvice, type BoardFinding, type KnownSource } from '@iyulab/u-board-designer/check';
import type { ViewKind } from '@iyulab/u-board/picture';

/** Every problem in a board about to be stored, each at a JSON Pointer into it: its language checked, and that it
 *  draws (`checkBoard`). */
export function documentIssues(document: unknown): BoardFinding[] {
  return checkBoard(document).issues;
}

/** What a stored board could do better — advice for whoever writes it, never a reason to refuse it — and a read whose
 *  `from` is none of the workspace's data sources (`sources`). */
export function documentAdvice(board: Board, sources: readonly KnownSource[]): BoardFinding[] {
  return [...checkBoard(board).advice, ...sourceAdvice(board, sources)];
}

/** The kind of view a board lays out — what a board list shows beside its name. */
export function documentKind(board: Board): ViewKind {
  return board.layout.kind;
}
