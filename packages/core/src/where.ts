// What a `where` says about an item's field: a value (the field equals it), `{ "not": value }` (it does not), or
// `{ "in": [values] }` (it equals one of them). Nothing else — a language of expressions is not what a board is for.
// A field the item does not have, or holds null in, equals nothing: `not` keeps such an item, `in` leaves it out.

export type WhereScalar = string | number | boolean;

/** The one thing a `where` names a field's value by. */
export type WhereValue = WhereScalar | { not: WhereScalar } | { in: readonly WhereScalar[] };

const isScalar = (v: unknown): v is WhereScalar => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/** Whether `v` is something a `where` can say about a field. */
export function isWhereValue(v: unknown): v is WhereValue {
  if (isScalar(v)) return true;
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== 1) return false;
  const only = (v as Record<string, unknown>)[keys[0]!];
  return keys[0] === 'not' ? isScalar(only) : keys[0] === 'in' ? Array.isArray(only) && only.length > 0 && only.every(isScalar) : false;
}

const equals = (actual: unknown, expected: WhereScalar): boolean => actual !== undefined && actual !== null && String(actual) === String(expected);

/** Whether a field's value (`actual`) is what `expected` says — compared as text, so the number 1 and the text "1" are the same. */
export function whereMatches(actual: unknown, expected: WhereValue): boolean {
  if (isScalar(expected)) return equals(actual, expected);
  if ('not' in expected) return !equals(actual, expected.not);
  return expected.in.some(value => equals(actual, value));
}

/** Whether a value names the field by equality alone — the only kind an index on equal fields can look up. */
export const isEquality = (v: WhereValue): v is WhereScalar => isScalar(v);

/** `field=value`, `field!=value` or `field in a|b` — a `where`'s entry in words. */
export function whereText(field: string, expected: WhereValue): string {
  if (isScalar(expected)) return `${field}=${String(expected)}`;
  return 'not' in expected ? `${field}!=${String(expected.not)}` : `${field} in ${expected.in.map(String).join('|')}`;
}
