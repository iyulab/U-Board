import { describe, it, expect } from 'vitest';
import { isHttpRef, parseSourceTime, readHttpRef, valueAtPath, findHttpRefItem } from './http-ref.js';

const READ_AT = Date.parse('2026-10-09T14:30:00Z');

describe('isHttpRef', () => {
  it('takes a path with its optional item, value path, observed-time path and time zone', () => {
    expect(isHttpRef({ path: '/readings' })).toBe(true);
    expect(
      isHttpRef({ path: '/readings', item: { list: '/rows', where: { id: 'A-1' } }, valuePath: '/level', observedAtPath: '/measuredAt', timeZone: 'Asia/Seoul' })
    ).toBe(true);
  });

  it('refuses a path that could leave the connector origin', () => {
    expect(isHttpRef({ path: '//attacker.example.org/' })).toBe(false);
    expect(isHttpRef({ path: '@attacker.example.org/' })).toBe(false);
  });

  it('refuses an observed-time path that is not a JSON Pointer, and a time zone the runtime does not know', () => {
    expect(isHttpRef({ path: '/r', observedAtPath: 'measuredAt' })).toBe(false);
    expect(isHttpRef({ path: '/r', timeZone: 'Mars/Olympus' })).toBe(false);
    expect(isHttpRef({ path: '/r', timeZone: 9 })).toBe(false);
  });

  it('refuses an item with no fields to match', () => {
    expect(isHttpRef({ path: '/r', item: { list: '/rows', where: {} } })).toBe(false);
  });
});

describe('valueAtPath', () => {
  it('reads the whole value at the empty pointer', () => {
    expect(valueAtPath({ a: 1 }, '')).toEqual({ found: true, value: { a: 1 } });
  });

  it('reads the older dot-separated form', () => {
    expect(valueAtPath({ value: [{ Status: 'Run' }] }, 'value.0.Status')).toEqual({ found: true, value: 'Run' });
  });

  it('tells a null the source sent from a path that leads nowhere', () => {
    expect(valueAtPath({ a: null }, '/a')).toEqual({ found: true, value: null });
    expect(valueAtPath({ a: null }, '/b')).toEqual({ found: false });
    expect(valueAtPath([1], '/-')).toEqual({ found: false });
  });
});

describe('findHttpRefItem', () => {
  it('finds the element by its fields, reading "12" and 12 as one id', () => {
    expect(findHttpRefItem({ rows: [{ id: 3 }, { id: 12, v: 'x' }] }, { list: '/rows', where: { id: '12' } })).toEqual({
      found: true,
      value: { id: 12, v: 'x' },
      index: 1,
    });
  });
});

describe('readHttpRef', () => {
  const body = {
    updatedAt: '2026-10-09 23:20',
    rows: [
      { station: 'north', level: 36, measuredAt: '202610092300' },
      { station: 'south', level: 41, measuredAt: '' },
    ],
  };

  it('reads the value as observed at the read when the reference names no time', () => {
    expect(readHttpRef(body, { path: '/r', valuePath: '/rows/0/level' }, READ_AT)).toEqual({ ok: true, value: 36, observedAt: READ_AT });
  });

  it('reads the observed time where the value is — inside the item when there is one', () => {
    const reading = readHttpRef(
      body,
      { path: '/r', item: { list: '/rows', where: { station: 'north' } }, valuePath: '/level', observedAtPath: '/measuredAt', timeZone: 'Asia/Seoul' },
      READ_AT
    );
    expect(reading).toEqual({ ok: true, value: 36, observedAt: Date.parse('2026-10-09T14:00:00Z') });
  });

  it('reads the observed time from the whole response when there is no item', () => {
    const reading = readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/updatedAt', timeZone: 'Asia/Seoul' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 36, observedAt: Date.parse('2026-10-09T14:20:00Z') });
  });

  it('counts a value as observed at the read when the source leaves the time empty', () => {
    const reading = readHttpRef(body, { path: '/r', item: { list: '/rows', where: { station: 'south' } }, valuePath: '/level', observedAtPath: '/measuredAt' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 41, observedAt: READ_AT });
  });

  it('says the address is wrong when the observed-time path leads nowhere', () => {
    expect(readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/generatedAt' }, READ_AT)).toMatchObject({
      ok: false,
      reason: 'address',
    });
  });

  it('says the format is wrong when the observed-time field holds no time', () => {
    expect(readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/rows/0/station' }, READ_AT)).toMatchObject({
      ok: false,
      reason: 'format',
    });
  });

  it('refuses a time later than the read, naming the time zone as what to check', () => {
    // 23:20 read as UTC is nine hours after the read at 14:30 UTC — the zone was left out.
    const reading = readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/updatedAt' }, READ_AT);
    expect(reading).toMatchObject({ ok: false, reason: 'format' });
    expect(reading.ok === false && reading.message).toContain('timeZone');
  });

  it('takes a time a little ahead of the read as the read — the two clocks differ', () => {
    const reading = readHttpRef({ v: 1, t: '2026-10-09T14:32:00Z' }, { path: '/r', valuePath: '/v', observedAtPath: '/t' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 1, observedAt: READ_AT });
  });

  it('says the format is wrong for a path into plain text', () => {
    expect(readHttpRef('OK', { path: '/r', observedAtPath: '/t' }, READ_AT)).toMatchObject({ ok: false, reason: 'format' });
  });

  it('says which item is missing', () => {
    const reading = readHttpRef(body, { path: '/r', item: { list: '/rows', where: { station: 'east' } }, valuePath: '/level' }, READ_AT);
    expect(reading).toEqual({ ok: false, reason: 'address', message: 'no item of "/rows" where station=east' });
  });
});

describe('parseSourceTime', () => {
  const utc = (iso: string) => Date.parse(iso);

  it('reads ISO 8601 with an offset as the instant it names, whatever the time zone', () => {
    expect(parseSourceTime('2026-10-09T19:00:00+09:00', 'America/New_York')).toBe(utc('2026-10-09T10:00:00Z'));
    expect(parseSourceTime('2026-10-09T10:00:00.250Z')).toBe(utc('2026-10-09T10:00:00.250Z'));
    expect(parseSourceTime('2026-10-09T05:00:00-0500')).toBe(utc('2026-10-09T10:00:00Z'));
  });

  it('reads a time without an offset in the given zone, else in UTC', () => {
    expect(parseSourceTime('2026-10-09 19:10', 'Asia/Seoul')).toBe(utc('2026-10-09T10:10:00Z'));
    expect(parseSourceTime('2026-10-09T19:10')).toBe(utc('2026-10-09T19:10:00Z'));
    expect(parseSourceTime('2026.10.09 19:10:30', 'Asia/Seoul')).toBe(utc('2026-10-09T10:10:30Z'));
    expect(parseSourceTime('2026-10-09', 'Asia/Seoul')).toBe(utc('2026-10-08T15:00:00Z'));
  });

  it('reads the compact forms', () => {
    expect(parseSourceTime('202610091900', 'Asia/Seoul')).toBe(utc('2026-10-09T10:00:00Z'));
    expect(parseSourceTime('20261009190030', 'Asia/Seoul')).toBe(utc('2026-10-09T10:00:30Z'));
    expect(parseSourceTime('20261009 2310', 'Asia/Seoul')).toBe(utc('2026-10-09T14:10:00Z'));
    expect(parseSourceTime('20261009', 'Asia/Seoul')).toBe(utc('2026-10-08T15:00:00Z'));
  });

  it('reads epoch seconds and milliseconds, as numbers or digit strings', () => {
    const at = utc('2026-10-09T10:00:00Z');
    expect(parseSourceTime(at)).toBe(at);
    expect(parseSourceTime(at / 1000)).toBe(at);
    expect(parseSourceTime(String(at))).toBe(at);
    expect(parseSourceTime(String(at / 1000))).toBe(at);
  });

  it('settles a wall-clock time on either side of a daylight-saving change', () => {
    // New York leaves daylight saving at 02:00 on 2026-11-01: 00:30 is still EDT (-4), 03:00 is EST (-5).
    expect(parseSourceTime('2026-11-01 00:30', 'America/New_York')).toBe(utc('2026-11-01T04:30:00Z'));
    expect(parseSourceTime('2026-11-01 03:00', 'America/New_York')).toBe(utc('2026-11-01T08:00:00Z'));
    expect(parseSourceTime('2026-07-01 12:00', 'America/New_York')).toBe(utc('2026-07-01T16:00:00Z'));
  });

  it('names no time for text that is not one, or a date that does not exist', () => {
    for (const raw of ['north', '', '2026-13-01', '2026-02-30', '2026-10-09 25:00', '24시간', '202609', true, null, {}, -5, Number.NaN]) {
      expect(parseSourceTime(raw)).toBeNull();
    }
  });
});
