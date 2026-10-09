import { parseSourceTime } from '../http-ref.js';

/** A field of a response that reads as a time: where it is (a JSON Pointer) and what the source wrote there. */
export interface TimeField {
  pointer: string;
  raw: string | number;
}

/** A key named the way time fields are (`updatedAt`, `MSRMT_DT`, `timestamp`, `time`) — what lets a number
 *  count as a time, since most numbers in a response are measurements, counts or ids. */
const TIME_KEY = /time|date|stamp|updated|generated|(^|_)dt$|[a-z]At$|_at$/i;

const escape = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');

/** How many fields `timeFieldsIn` offers, and how many values it looks at to find them — a response can be
 *  a long list, and the offer is a select, not a search. */
const MAX_FIELDS = 30;
const MAX_VISITED = 5000;

/**
 * The fields of `value` that read as a time (`parseSourceTime`), in the order the response gives them — what
 * an author can name as the time the source observed a value. Text counts when it reads as a date and time,
 * except a run of 10 or 13 digits (an id as often as an epoch); a number counts when its key is named like a
 * time. A list is looked into through its first element: its others repeat the same fields.
 */
export function timeFieldsIn(value: unknown): TimeField[] {
  const fields: TimeField[] = [];
  let visited = 0;
  const visit = (node: unknown, pointer: string, key: string) => {
    if (fields.length >= MAX_FIELDS || ++visited > MAX_VISITED) return;
    if (typeof node === 'string') {
      if (!/^\s*(\d{10}|\d{13})\s*$/.test(node) && parseSourceTime(node) !== null) fields.push({ pointer, raw: node });
    } else if (typeof node === 'number') {
      if (TIME_KEY.test(key) && parseSourceTime(node) !== null) fields.push({ pointer, raw: node });
    } else if (Array.isArray(node)) {
      if (node.length > 0) visit(node[0], `${pointer}/0`, key);
    } else if (node !== null && typeof node === 'object') {
      for (const [k, child] of Object.entries(node)) visit(child, `${pointer}/${escape(k)}`, k);
    }
  };
  visit(value, '', '');
  return fields;
}

/** Whether the source wrote `raw` without saying its offset — a wall-clock time a time zone has to place. */
export function lacksOffset(raw: string | number): boolean {
  return typeof raw === 'string' && !/(Z|[+-]\d{2}:?\d{2})\s*$/i.test(raw.trim()) && !/^\s*(\d{10}|\d{13})\s*$/.test(raw);
}

/** The time zone the author's device is in — the default for a source they are binding, which is usually
 *  in their own region. */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Every time zone this runtime knows, for the author to pick from. */
export function knownTimeZones(): readonly string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
}
