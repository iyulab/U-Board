// Drawing a board wherever it is hosted: the reads a board needs before it can be drawn, made through whatever reads
// values for its host — an application's own adapters, or the server's data sources — and the view document the
// renderer draws it from.

import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import { keyReadsOf, keysIn, toViewDocument } from './picture.js';
import type { Board } from './types.js';

/** Reads one value for a board — a binding's adapter and reference. */
export type ValueReader = (adapter: string, ref: unknown) => Promise<{ value?: unknown }>;

/** A reader over a host's adapters: each reference read by the adapter its binding names, nothing for one it has none of. */
export function readerOf(adapters: readonly Adapter[]): ValueReader {
  const byId = new Map(adapters.map(a => [a.id, a]));
  return async (adapter, ref) => {
    const found = byId.get(adapter);
    if (found === undefined) return {};
    try {
      return await found.resolve(ref);
    } catch {
      return {};
    }
  };
}

/** The items each data list a part is made per item of (`each`) has now, read with `read` — what a grid lays them out
 *  by, and a canvas places them by when it says where from their fields. A list that cannot be read has none. */
export async function readLists(board: Board, read: ValueReader): Promise<Record<string, unknown[]>> {
  const entries = await Promise.all(
    keyReadsOf(board).map(async ({ data, adapter, ref }) => {
      const { value } = await read(adapter, ref);
      return [data, Array.isArray(value) ? value : []] as const;
    })
  );
  return Object.fromEntries(entries);
}

/** The keys of those items — what a grid lays them out by. */
export async function readKeys(board: Board, read: ValueReader): Promise<Record<string, string[]>> {
  const lists = await readLists(board, read);
  return Object.fromEntries(Object.entries(lists).map(([data, items]) => [data, keysIn(board, data, items)]));
}

/**
 * The view document the renderer draws a board from. A board is drawn through its picture, which a
 * grid laying out a part per item of a list makes with the keys of the items it has now — read with `read` — and a
 * canvas that places a part by its items' fields makes with the items.
 */
export async function pictureOf(board: Board, read: ValueReader): Promise<ViewDocument> {
  const lists = await readLists(board, read);
  return toViewDocument(board, { keysOf: data => keysIn(board, data, lists[data] ?? []), rowsOf: data => lists[data] ?? [] });
}
