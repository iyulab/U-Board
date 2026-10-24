import {
  lintViewDocument,
  validateViewDocument,
  type ViewDocument,
  type ViewDocumentAdvice,
  type ViewDocumentIssue,
} from '@iyulab/u-board/domain';
import { checkBoardV2, isBoardV2, keyReadsOf, keysIn, sourceAdvice, toViewDocument, type BoardDocument, type KnownSource } from '@iyulab/u-board/board-v2';

// A first-version document is never written back from a second-version one.
export { documentKind, type BoardDocument } from '@iyulab/u-board/board-v2';

/**
 * Every structural problem in a document about to be stored, each at a JSON Pointer into it. A second-version board
 * is checked by its language and must also draw (`checkBoardV2`).
 */
export function documentIssues(document: unknown): ViewDocumentIssue[] {
  return isBoardV2(document) ? checkBoardV2(document).issues : validateViewDocument(document, { strict: true });
}

/** What a stored document could do better — advice for whoever writes it, never a reason to refuse it. A
 *  second-version board is also told of a read whose `from` is none of the workspace's data sources (`sources`). */
export function documentAdvice(document: BoardDocument, sources: readonly KnownSource[]): ViewDocumentAdvice[] {
  return isBoardV2(document) ? [...checkBoardV2(document).advice, ...sourceAdvice(document, sources)] : lintViewDocument(document);
}

/** Reads one value for a board — a binding's adapter and reference. */
export type ValueReader = (adapter: string, ref: unknown) => Promise<{ value?: unknown }>;

/**
 * The view document the renderer draws a board from. A second-version board is drawn through its picture, which a
 * grid laying out a part per item of a list makes with the keys of the items it has now — read here, with `read`.
 */
export async function pictureOf(document: BoardDocument, read: ValueReader): Promise<ViewDocument> {
  if (!isBoardV2(document)) return document;
  const keys = new Map<string, string[]>();
  await Promise.all(
    keyReadsOf(document).map(async ({ data, adapter, ref }) => keys.set(data, keysIn(document, data, (await read(adapter, ref)).value)))
  );
  return toViewDocument(document, { keysOf: data => keys.get(data) ?? [] });
}
