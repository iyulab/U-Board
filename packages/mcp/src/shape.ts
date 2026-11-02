/**
 * What a data source's response looks like, small enough for an assistant to read: every value's JSON Pointer with its
 * type and an example, the first item of each list standing for the rest, and — for a list of objects — the fields
 * that tell its items apart, to name one item by (a binding's `item: { list, where }`). The response itself can be
 * megabytes; this stays within `MAX_LINES` lines.
 */
export interface ResponseShape {
  /** `"<pointer>: <type> <example>"`, one per value, depth first. */
  values: string[];
  /** Each list of objects: its pointer, how many items, the fields whose values differ from item to item, and the
   *  values of the first of them — the names a part gives to read one item (`<data>[<value>]`), at most `MAX_NAMES`. */
  lists: { list: string; items: number; keys: string[]; names?: Record<string, unknown[]> }[];
  /** Set when the response had more values than were listed. */
  truncated?: true;
}

const MAX_LINES = 80;
const MAX_DEPTH = 8;
const MAX_EXAMPLE = 40;
const MAX_NAMES = 12;

export function shapeOf(response: unknown): ResponseShape {
  const values: string[] = [];
  const lists: ResponseShape['lists'] = [];
  let truncated = false;

  const walk = (value: unknown, pointer: string, depth: number) => {
    if (values.length >= MAX_LINES) {
      truncated = true;
      return;
    }
    if (Array.isArray(value)) {
      values.push(`${pointer || '/'}: array(${value.length})`);
      if (value.length === 0 || depth >= MAX_DEPTH) return;
      if (value.every(item => isObject(item))) {
        const keys = distinguishingKeys(value);
        // Only the first item is walked below: the values that tell the items apart are said here, so an item is named
        // by what it is called, not guessed.
        const names = keys[0] === undefined ? undefined : { [keys[0]]: value.slice(0, MAX_NAMES).map(item => item[keys[0]!]) };
        lists.push({ list: pointer || '/', items: value.length, keys, ...(names && { names }) });
      }
      walk(value[0], `${pointer}/0`, depth + 1);
    } else if (isObject(value)) {
      const keys = Object.keys(value);
      if (depth >= MAX_DEPTH) {
        values.push(`${pointer || '/'}: object(${keys.length} keys)`);
        return;
      }
      if (keys.length === 0) values.push(`${pointer || '/'}: object(empty)`);
      for (const key of keys) walk(value[key], `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`, depth + 1);
    } else {
      values.push(`${pointer || '/'}: ${typeOf(value)}${value === null ? '' : ` ${example(value)}`}`);
    }
  };

  walk(response, '', 0);
  return truncated ? { values, lists, truncated: true } : { values, lists };
}

/** The fields, among those every item has with text, a number or a boolean, whose values are all different — up to
 *  five, most telling first (fewer repeated values). */
function distinguishingKeys(items: Record<string, unknown>[]): string[] {
  const sample = items.slice(0, 200);
  const candidates = Object.keys(sample[0]).filter(key => sample.every(item => isScalar(item[key])));
  return candidates
    .map(key => ({ key, distinct: new Set(sample.map(item => item[key])).size }))
    .filter(({ distinct }) => distinct === sample.length || distinct > sample.length * 0.9)
    .sort((a, b) => b.distinct - a.distinct)
    .slice(0, 5)
    .map(({ key }) => key);
}

function typeOf(value: unknown): string {
  return value === null ? 'null' : typeof value;
}

function example(value: unknown): string {
  const text = JSON.stringify(value);
  return text.length > MAX_EXAMPLE ? `${text.slice(0, MAX_EXAMPLE)}…"` : text;
}

function isScalar(value: unknown): boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
