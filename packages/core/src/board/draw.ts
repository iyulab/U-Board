// Drawing a board wherever it is hosted: the reads a board needs before it can be drawn, made through whatever reads
// values for its host — an application's own adapters, or the server's data sources — and the view document the
// renderer draws it from.

import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import { keyReadsOf, keysIn, toViewDocument } from './picture.js';
import type { Board } from './types.js';
import { expandVariables, variableValues, variablesOf } from './variables.js';

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

/** What a draw is asked for beyond the board: the values its variables are asked to take — a value that is not among a
 *  variable's options (or none) takes its default. */
export interface DrawOptions {
  variables?: Readonly<Record<string, string>>;
}

/**
 * The items each data list a part is made per item of (`each`) has now, read with `read` — what a grid lays them out
 * by, and a canvas places them by when it says where from their fields. A list that cannot be read has none.
 * A variable whose options a list gives takes its default here, for the keys of that list are what it is checked against;
 * a list read that depends on such a variable is therefore read with the default's value.
 */
export async function readLists(board: Board, read: ValueReader, options: DrawOptions = {}): Promise<Record<string, unknown[]>> {
  return (await readListsNoted(board, read, options)).lists;
}

/** `readLists`, and the data whose answer is an object — keyed by names, as `{ "g1": {…}, "g6": {…} }` — and not a list:
 *  it has no items, and a part made per item of it makes none. */
async function readListsNoted(board: Board, read: ValueReader, options: DrawOptions): Promise<{ lists: Record<string, unknown[]>; notLists: string[] }> {
  const written = expandVariables(board, variableValues(variablesOf(board), options.variables));
  const entries = await Promise.all(
    keyReadsOf(written).map(async ({ data, adapter, ref }) => {
      const { value } = await read(adapter, ref);
      return { data, items: Array.isArray(value) ? value : [], keyed: typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0 } as const;
    })
  );
  return {
    lists: Object.fromEntries(entries.map(e => [e.data, e.items])),
    notLists: entries.filter(e => e.keyed).map(e => e.data),
  };
}

/** The keys of those items — what a grid lays them out by. */
export async function readKeys(board: Board, read: ValueReader, options: DrawOptions = {}): Promise<Record<string, string[]>> {
  const lists = await readLists(board, read, options);
  return Object.fromEntries(Object.entries(lists).map(([data, items]) => [data, keysIn(board, data, items)]));
}

/**
 * The view document the renderer draws a board from. A board is drawn through its picture, which a
 * grid laying out a part per item of a list makes with the keys of the items it has now — read with `read` — and a
 * canvas that places a part by its items' fields makes with the items.
 */
export async function pictureOf(board: Board, read: ValueReader, options: DrawOptions = {}): Promise<ViewDocument> {
  return (await drawBoard(board, read, options)).picture;
}

/** A board drawn — its picture, and for each part a canvas places by its items' fields, how many of its items it could
 *  not place (no number in a field, or outside the frame). `unplaced` has the parts that left some out and no other.
 *  `notLists` has the data a part is made per item of whose answer was an object keyed by names and not a list — they have no items.
 *  `variables` is what the board's variables took — each declared name's value, and the names asked for with a value
 *  that is not one of its options (they took their default instead). */
export async function drawBoard(
  board: Board,
  read: ValueReader,
  options: DrawOptions = {},
): Promise<{ picture: ViewDocument; unplaced: Record<string, number>; notLists: string[]; variables: { values: Record<string, string>; unknown: string[] } }> {
  const { lists, notLists } = await readListsNoted(board, read, options);
  const keysOf = (data: string) => keysIn(board, data, lists[data] ?? []);
  const declared = variablesOf(board);
  const values = variableValues(declared, options.variables, keysOf);
  const unknown = Object.entries(options.variables ?? {}).filter(([name, value]) => name in declared && values[name] !== value).map(([name]) => name);
  const unplaced: Record<string, number> = {};
  const picture = toViewDocument(board, {
    variables: options.variables,
    keysOf,
    rowsOf: data => lists[data] ?? [],
    onUnplaced: (part, count) => { unplaced[part] = (unplaced[part] ?? 0) + count; },
  });
  return { picture, unplaced, notLists, variables: { values, unknown } };
}
