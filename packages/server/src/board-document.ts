import {
  lintViewDocument,
  validateViewDocument,
  type ViewDocument,
  type ViewDocumentAdvice,
  type ViewDocumentIssue,
  type ViewKind,
} from '@iyulab/u-board/domain';
import { PictureError, toViewDocument, validateBoardV2, type BoardV2 } from '@iyulab/u-board/board-v2';

/**
 * What a board stores: a document in the board language's second version, which says so (`"version": 2`), or a
 * first-version view document, which says no version. Both are accepted while stored boards move to the second
 * version; a first-version document is never written back from a second-version one.
 */
export type BoardDocument = ViewDocument | BoardV2;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a document is written in the second version — any document that names a version is read as one, so a
 *  wrong version is told what to say rather than read as a first-version document. */
export function isBoardV2(document: unknown): document is BoardV2 {
  return isRecord(document) && Object.hasOwn(document, 'version');
}

/** The items a part made per item stands for when a board is checked: none — a board is drawable before its data
 *  has any items, and the items it has later do not change what it is. */
const NO_ITEMS = { keysOf: () => [] };

/**
 * Every structural problem in a document about to be stored, each at a JSON Pointer into it. A second-version board
 * is checked by its language and must also draw — a part the renderer cannot draw yet is refused here, not on the
 * page that shows it.
 */
export function documentIssues(document: unknown): ViewDocumentIssue[] {
  if (!isBoardV2(document)) return validateViewDocument(document, { strict: true });
  const issues = validateBoardV2(document)
    .filter(issue => !issue.hint)
    .map(({ at, message }) => ({ path: at, message }));
  if (issues.length > 0) return issues;
  try {
    toViewDocument(document, NO_ITEMS);
  } catch (error) {
    if (!(error instanceof PictureError)) throw error;
    return [{ path: error.at, message: error.message.slice(error.at.length + 2) }];
  }
  return [];
}

/** What a stored document could do better — advice for whoever writes it, never a reason to refuse it. */
export function documentAdvice(document: BoardDocument): ViewDocumentAdvice[] {
  if (!isBoardV2(document)) return lintViewDocument(document);
  return validateBoardV2(document)
    .filter(issue => issue.hint)
    .map(({ at, message }) => ({ path: at, message }));
}

/** The kind of view a document lays out — what a board list shows beside its name. */
export function documentKind(document: BoardDocument): ViewKind {
  return isBoardV2(document) ? document.layout.kind : document.kind;
}

/**
 * The first-version view document the share routes still read, or `undefined` for a second-version board — which
 * they answer as not shown yet.
 * TODO(v2 switch ②): draw a second-version board through its picture (`toViewDocument`) on the share routes and the
 * viewer, and remove this.
 */
export function firstVersionOf(document: BoardDocument): ViewDocument | undefined {
  return isBoardV2(document) ? undefined : document;
}
