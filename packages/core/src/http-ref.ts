/**
 * The HTTP connector's binding reference — the `ref` the binding form writes when an adapter offers no
 * references of its own (`Adapter.references`) — and how a response is read with it. One reading for every
 * place that answers such a binding: the server's resolve proxy, a page replaying a recorded response, the
 * binding form's preview. Two readers of one reference that disagree would show an author one value and a
 * viewer another.
 */

/** One item of a list in the response, named by its fields rather than its place: the first element of the
 *  array at `list` (a JSON Pointer) whose fields equal every one in `where`. A source's list can come in
 *  another order, or with an item missing, from one read to the next — a position would then name another
 *  item, and show its value as live. */
export interface HttpRefItem {
  list: string;
  where: Record<string, string | number | boolean>;
}

/** An HTTP connector binding's reference. */
export interface HttpRef {
  /** The request, relative to the connector's base URL — a path starting with a single `/`, with its query. */
  path: string;
  /** The list item the binding reads in, named by its fields. Absent: the whole response. */
  item?: HttpRefItem;
  /** A JSON Pointer to the value, inside `item` when there is one, else inside the whole response. */
  valuePath?: string;
  /** A JSON Pointer to the time the source says its value was observed, read where `valuePath` is. Absent:
   *  the value counts as observed when it was read. */
  observedAtPath?: string;
  /** The IANA time zone (`Asia/Seoul`) the source writes times in when a time carries no offset of its own.
   *  Absent: such times are UTC. */
  timeZone?: string;
}

/**
 * Whether `ref` is a well-formed HTTP connector reference.
 *
 * `path` is caller-controlled and the request carries the connector's credentials, so it must not be able
 * to move the request off the connector's origin. A path that does not start with a single `/` could
 * otherwise be parsed as URL authority — `"@attacker.example/"` appended to `https://plant.example.com`
 * yields `plant.example.com` as *userinfo* and `attacker.example` as the host, sending the owner's secret
 * to the caller's server.
 */
export function isHttpRef(ref: unknown): ref is HttpRef {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) return false;
  const { path, item, valuePath, observedAtPath, timeZone } = ref as Record<string, unknown>;
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    (item === undefined || isHttpRefItem(item)) &&
    (valuePath === undefined || typeof valuePath === 'string') &&
    (observedAtPath === undefined || isPointer(observedAtPath)) &&
    (timeZone === undefined || (typeof timeZone === 'string' && isTimeZone(timeZone)))
  );
}

function isPointer(path: unknown): path is string {
  return typeof path === 'string' && (path === '' || path.startsWith('/'));
}

function isHttpRefItem(item: unknown): item is HttpRefItem {
  if (!item || typeof item !== 'object') return false;
  const { list, where } = item as { list?: unknown; where?: unknown };
  if (!isPointer(list)) return false;
  if (!where || typeof where !== 'object' || Array.isArray(where)) return false;
  const values = Object.values(where);
  return values.length > 0 && values.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
}

/** The keys `path` names, in order. A path starting with `/` is an RFC 6901 JSON Pointer — the form the
 *  binding form writes, and the only one that can name a key containing a dot (`/@odata.count`) or a slash
 *  (`/a~1b`). `''` is the whole value. Anything else is the older dot-separated form (`value.0.Status`),
 *  still read so bindings saved before pointers keep resolving. */
function pathTokens(path: string): string[] {
  if (path === '') return [];
  if (!path.startsWith('/')) return path.split('.');
  return path.slice(1).split('/').map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** Follows `path` through `value`, telling "the path ends at `null`/`undefined`" (a value the source sent)
 *  apart from "the path leads nowhere" (a response that does not contain what the binding addresses — an
 *  empty result set, a renamed field). Only the response's own keys count, and an array index is a plain
 *  decimal without leading zeros (RFC 6901 §4) — never an inherited property or the append token `-`. */
export function valueAtPath(value: unknown, path: string): { found: true; value: unknown } | { found: false } {
  let cursor = value;
  for (const token of pathTokens(path)) {
    if (Array.isArray(cursor)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token) || Number(token) >= cursor.length) return { found: false };
      cursor = cursor[Number(token)];
    } else if (cursor && typeof cursor === 'object' && Object.hasOwn(cursor, token)) {
      cursor = (cursor as Record<string, unknown>)[token];
    } else {
      return { found: false };
    }
  }
  return { found: true, value: cursor };
}

/** The element of `body`'s list that `item` names, and its place in this response — or `found: false`: no
 *  such list, or no element matches. A field matches when the source's value reads the same as the expected
 *  one (`"12"` and `12` are one id: sources are not consistent about the type of a code). */
export function findHttpRefItem(body: unknown, item: HttpRefItem): { found: true; value: unknown; index: number } | { found: false } {
  const list = valueAtPath(body, item.list);
  if (!list.found || !Array.isArray(list.value)) return { found: false };
  const index = list.value.findIndex(
    element =>
      element !== null &&
      typeof element === 'object' &&
      Object.entries(item.where).every(([field, expected]) => {
        if (!Object.hasOwn(element, field)) return false;
        const actual = (element as Record<string, unknown>)[field];
        return actual !== undefined && actual !== null && String(actual) === String(expected);
      })
  );
  return index < 0 ? { found: false } : { found: true, value: list.value[index], index };
}

/** What reading a response with a reference gave: the value and when the source observed it (epoch ms) —
 *  or why it could not be read, in the words of `QualityReason`. `address`: the response does not contain
 *  what the reference points at. `format`: it does, in a form the reference cannot read. */
export type HttpRefReading =
  | { ok: true; value: unknown; observedAt: number }
  | { ok: false; reason: 'address' | 'format'; message: string };

/** How far ahead of the read a source's time may be and still count as the read's own — the two clocks
 *  are not the same clock. Further ahead, the time is not one the source could have observed yet. */
const CLOCK_TOLERANCE_MS = 5 * 60_000;

/**
 * Reads `body` — a response the source answered at `readAt` (epoch ms) — with `ref`: the list item, the
 * value, and the time the source observed it. The observed time is the read's when `ref` names none or the
 * source leaves the named field empty (it said nothing about when); a time ahead of the read by less than
 * the clocks' tolerance is the read's too.
 */
export function readHttpRef(body: unknown, ref: HttpRef, readAt: number): HttpRefReading {
  if ((ref.valuePath || ref.item || ref.observedAtPath) && typeof body === 'string') {
    // Plain text has no fields: a path into it asks for a form the source does not answer in.
    return { ok: false, reason: 'format', message: 'the response is plain text, which a path cannot read into' };
  }
  let scope = body;
  if (ref.item) {
    const found = findHttpRefItem(body, ref.item);
    if (!found.found) {
      const where = Object.entries(ref.item.where).map(([field, expected]) => `${field}=${String(expected)}`).join(', ');
      return { ok: false, reason: 'address', message: `no item of "${ref.item.list}" where ${where}` };
    }
    scope = found.value;
  }
  const value = valueAtPath(scope, ref.valuePath ?? '');
  if (!value.found) return { ok: false, reason: 'address', message: `valuePath "${ref.valuePath}" not found in the response` };
  if (ref.observedAtPath === undefined) return { ok: true, value: value.value, observedAt: readAt };

  const time = valueAtPath(scope, ref.observedAtPath);
  if (!time.found) return { ok: false, reason: 'address', message: `observedAtPath "${ref.observedAtPath}" not found in the response` };
  if (time.value === null || time.value === '') return { ok: true, value: value.value, observedAt: readAt };
  const observedAt = parseSourceTime(time.value, ref.timeZone);
  if (observedAt === null) {
    return { ok: false, reason: 'format', message: `observedAtPath "${ref.observedAtPath}" holds ${JSON.stringify(time.value)}, which is not a time` };
  }
  if (observedAt > readAt + CLOCK_TOLERANCE_MS) {
    return {
      ok: false,
      reason: 'format',
      message: `observedAtPath "${ref.observedAtPath}" says ${new Date(observedAt).toISOString()}, later than the read — check the reference's timeZone`,
    };
  }
  return { ok: true, value: value.value, observedAt: Math.min(observedAt, readAt) };
}

/** `yyyy-MM-dd HH:mm:ss.SSS±hh:mm` and its parts left out: date only, no seconds, `T` or a space between,
 *  `.` or `/` between the date's fields, `Z` or no offset. */
const DELIMITED = /^(\d{4})[-./](\d{2})[-./](\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
/** `yyyyMMdd`, `yyyyMMddHHmm`, `yyyyMMddHHmmss`, and the same with a space or `T` before the time. */
const COMPACT = /^(\d{4})(\d{2})(\d{2})(?:[T ]?(\d{2})(\d{2})(\d{2})?)?$/;

/**
 * The instant (epoch ms) a source's time names, or `null` when it names none. A number is seconds since the
 * epoch, or milliseconds once it is too large to be seconds (from 1e11 — the year 5138 in seconds, 1973 in
 * milliseconds); a string of 10 or 13 digits is the same. Other strings are a date and time — delimited
 * (ISO 8601 and the variations sources write) or compact (`202610091900`). A time without an offset is a
 * wall-clock time in `timeZone`, or in UTC when none is given.
 */
export function parseSourceTime(raw: unknown, timeZone?: string): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? (raw >= 1e11 ? raw : raw * 1000) : null;
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (/^\d{10}$|^\d{13}$/.test(text)) return parseSourceTime(Number(text));
  const delimited = DELIMITED.exec(text);
  const parts = delimited ?? COMPACT.exec(text);
  if (!parts) return null;
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = parts;
  const ms = delimited?.[7] ?? '0';
  const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute, second, Number(ms.padEnd(3, '0')));
  const back = new Date(wall);
  // Date.UTC rolls an out-of-range field over (month 13, the 31st of a 30-day month) — that is not a time.
  if (
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day ||
    back.getUTCHours() !== hour ||
    back.getUTCMinutes() !== minute ||
    back.getUTCSeconds() !== second
  ) {
    return null;
  }
  const offset = delimited?.[8];
  if (offset) {
    if (/^z$/i.test(offset)) return wall;
    const [, sign, oh, om] = /^([+-])(\d{2}):?(\d{2})$/.exec(offset)!;
    return wall - (sign === '-' ? -1 : 1) * (Number(oh) * 60 + Number(om)) * 60_000;
  }
  return timeZone ? wallClockToInstant(wall, timeZone) : wall;
}

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  let format = zoneFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    zoneFormats.set(timeZone, format);
  }
  return format;
}

/** Whether `timeZone` is a time zone this runtime knows (an IANA name such as `Asia/Seoul`, or `UTC`). */
export function isTimeZone(timeZone: string): boolean {
  try {
    zoneFormat(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** How far `timeZone`'s wall clock is ahead of UTC at `instant` (ms). */
function zoneOffset(instant: number, timeZone: string): number {
  const field: Record<string, number> = {};
  for (const part of zoneFormat(timeZone).formatToParts(new Date(instant))) field[part.type] = Number(part.value);
  const wall = Date.UTC(field.year, field.month - 1, field.day, field.hour, field.minute, field.second);
  return wall - (instant - (((instant % 1000) + 1000) % 1000));
}

/** The instant at which `timeZone`'s wall clock reads `wall` (the wall-clock fields written as if in UTC).
 *  The offset is taken at the guess and once more at the corrected instant, which settles it on either
 *  side of a daylight-saving change. */
function wallClockToInstant(wall: number, timeZone: string): number {
  const first = wall - zoneOffset(wall, timeZone);
  return wall - zoneOffset(first, timeZone);
}
