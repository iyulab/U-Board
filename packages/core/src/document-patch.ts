import type { JsonPatchOperation } from './json-patch.js';

/**
 * The JSON Patch (RFC 6902) that turns `before` into `after` — so an edit made on a whole document (renaming an
 * element and every use of it, removing a node and the lines to it) is sent as the few changes it made, against the
 * revision it was made on. Applied to `before`, the patch gives a document equal to `after` as JSON — whose object
 * members have no order: one the patch adds comes last.
 *
 * It goes down to what changed: an object member by member; a list whose items carry an `id`, item by item matched
 * by id — removed items from the last, then each kept item where it now is, then new ones at the end — and a list
 * without ids, index by index while its length stays. A list whose items changed order (or, without ids, length) is
 * replaced whole: a list's order is part of what it says.
 */
export function documentPatch(before: unknown, after: unknown): JsonPatchOperation[] {
  const patch: JsonPatchOperation[] = [];
  diff(before, after, '', patch);
  return patch;
}

function diff(before: unknown, after: unknown, path: string, patch: JsonPatchOperation[]): void {
  if (same(before, after)) return;
  if (Array.isArray(before) && Array.isArray(after)) {
    if (!diffList(before, after, path, patch)) patch.push({ op: 'replace', path, value: after });
    return;
  }
  if (isObject(before) && isObject(after)) {
    diffObject(before, after, path, patch);
    return;
  }
  patch.push({ op: 'replace', path, value: after });
}

/** The members' changes: those gone, those changed, those new. */
function diffObject(before: Record<string, unknown>, after: Record<string, unknown>, path: string, patch: JsonPatchOperation[]): void {
  for (const key of Object.keys(before)) if (!Object.hasOwn(after, key)) patch.push({ op: 'remove', path: `${path}/${token(key)}` });
  for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) diff(before[key], after[key], `${path}/${token(key)}`, patch);
  for (const key of Object.keys(after)) if (!Object.hasOwn(before, key)) patch.push({ op: 'add', path: `${path}/${token(key)}`, value: after[key] });
}

/** The items' changes, or `false` when the list is better replaced: its items moved, or it has no ids and its length
 *  changed. */
function diffList(before: unknown[], after: unknown[], path: string, patch: JsonPatchOperation[]): boolean {
  const beforeIds = idsOf(before);
  const afterIds = idsOf(after);
  if (!beforeIds || !afterIds) {
    if (before.length !== after.length) return false;
    before.forEach((item, i) => diff(item, after[i], `${path}/${i}`, patch));
    return true;
  }
  const staying = new Set(afterIds);
  const kept = beforeIds.filter(id => staying.has(id));
  const known = new Set(beforeIds);
  const added = afterIds.filter(id => !known.has(id));
  if ([...kept, ...added].join('\u0000') !== afterIds.join('\u0000')) return false;
  for (let i = beforeIds.length - 1; i >= 0; i--) if (!staying.has(beforeIds[i])) patch.push({ op: 'remove', path: `${path}/${i}` });
  const beforeById = new Map(before.map((item, i) => [beforeIds[i], item]));
  kept.forEach((id, i) => diff(beforeById.get(id), after[i], `${path}/${i}`, patch));
  after.slice(kept.length).forEach(item => patch.push({ op: 'add', path: `${path}/-`, value: item }));
  return true;
}

/** Each item's `id` when every item is an object with a string id of its own, else `undefined`. */
function idsOf(list: unknown[]): string[] | undefined {
  const ids = list.map(item => (isObject(item) && typeof item.id === 'string' ? item.id : undefined));
  if (ids.some(id => id === undefined) || new Set(ids).size !== ids.length) return undefined;
  return ids as string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The same JSON — object members in any order, list items in theirs. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => same(item, b[i]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
  }
  return false;
}

/** A key as a JSON Pointer reference token (RFC 6901: "~" as "~0", "/" as "~1"). */
function token(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}
