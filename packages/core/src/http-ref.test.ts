import { describe, it, expect } from 'vitest';
import { isHttpRef, isSourceErrorField, parseSourceTime, readHttpRef, requestPath, requestTimeProblem, sourceErrorIn, valueAtPath, findHttpRefItem } from './http-ref.js';

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

  it('refuses a max age that is not a positive number of seconds', () => {
    for (const maxAgeSeconds of [0, -60, '3600', Number.POSITIVE_INFINITY]) expect(isHttpRef({ path: '/r', maxAgeSeconds })).toBe(false);
    expect(isHttpRef({ path: '/r', maxAgeSeconds: 90 })).toBe(true);
  });

  it('takes every item a list keeps, alone — not with an item, a value path or an observed-time path', () => {
    const items = { list: '/items', where: { item: 'PM10' } };
    expect(isHttpRef({ path: '/air', items, maxAgeSeconds: 5400, timeZone: 'Asia/Seoul' })).toBe(true);
    expect(isHttpRef({ path: '/air', items: { list: '/items', where: {} } })).toBe(false);
    expect(isHttpRef({ path: '/air', items, item: { list: '/items', where: { station: 'north' } } })).toBe(false);
    expect(isHttpRef({ path: '/air', items, valuePath: '/value' })).toBe(false);
    expect(isHttpRef({ path: '/air', items, observedAtPath: '/time' })).toBe(false);
  });

  it('refuses an item with no fields to match', () => {
    expect(isHttpRef({ path: '/r', item: { list: '/rows', where: {} } })).toBe(false);
  });
});

describe('requestPath', () => {
  const KMA = '/getUltraSrtNcst?base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=60&ny=127';

  it('is the path itself when it has no time place', () => {
    expect(requestPath({ path: '/readings?x=1' }, READ_AT)).toBe('/readings?x=1');
  });

  it('fills each time place with the time of the request on the time zone’s clock, to the minute by default', () => {
    // 14:30:00Z is 23:30 in Seoul.
    expect(requestPath({ path: KMA, timeZone: 'Asia/Seoul' }, READ_AT + 59_000)).toBe('/getUltraSrtNcst?base_date=20261009&base_time=2330&nx=60&ny=127');
    expect(requestPath({ path: '/d/{{now:yyyy-MM-ddTHH:mm}}' }, READ_AT)).toBe('/d/2026-10-09T14:30');
  });

  it('takes the time the source has published by: the delay earlier, rounded down to its step', () => {
    const hourly = { path: KMA, timeZone: 'Asia/Seoul', requestTime: { delaySeconds: 40 * 60, stepSeconds: 3600 } };
    // 23:30 in Seoul: the 23:00 data is not out until 23:40, so 22:00.
    expect(requestPath(hourly, READ_AT)).toBe('/getUltraSrtNcst?base_date=20261009&base_time=2200&nx=60&ny=127');
    expect(requestPath(hourly, READ_AT + 10 * 60_000)).toBe('/getUltraSrtNcst?base_date=20261009&base_time=2300&nx=60&ny=127');
    // 00:20 the next day in Seoul is still the day before's 23:00 — date and time come from one time.
    expect(requestPath(hourly, READ_AT + 50 * 60_000)).toBe('/getUltraSrtNcst?base_date=20261009&base_time=2300&nx=60&ny=127');
  });

  it('counts a step from midnight on the time zone’s clock', () => {
    const daily = { path: '/day/{{now:yyyyMMdd}}', timeZone: 'Asia/Seoul', requestTime: { stepSeconds: 86_400 } };
    expect(requestPath(daily, READ_AT)).toBe('/day/20261009');
    expect(requestPath(daily, READ_AT + 31 * 60_000)).toBe('/day/20261010');
  });
});

describe('requestTimeProblem', () => {
  it('takes time places and nothing else in braces', () => {
    expect(requestTimeProblem('/r?d={{now:yyyyMMdd}}&t={{ now:HHmm }}')).toBeUndefined();
    expect(requestTimeProblem('/r?d={{now:yyyy/MM}}')).toMatch(/time places/);
    expect(requestTimeProblem('/r?d={{value}}')).toMatch(/time places/);
    expect(requestTimeProblem('/r?d={{now:ss}}')).toMatch(/time places/);
    // A `}}` alone is text — JSON in a query closes two objects with it.
    expect(requestTimeProblem('/q?f={"a":{"b":1}}')).toBeUndefined();
    expect(isHttpRef({ path: '/q?f={"a":{"b":1}}' })).toBe(true);
  });

  it('makes a reference with another place, or a malformed request time, not one', () => {
    expect(isHttpRef({ path: '/r?d={{host}}' })).toBe(false);
    expect(isHttpRef({ path: '/r?d={{now:yyyyMMdd}}', requestTime: { delaySeconds: 2400, stepSeconds: 3600 } })).toBe(true);
    for (const requestTime of [{ stepSeconds: 0 }, { delaySeconds: -1 }, { delaySeconds: '60' }, { every: 60 }, []]) {
      expect(isHttpRef({ path: '/r', requestTime })).toBe(false);
    }
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
    expect(readHttpRef(body, { path: '/r', valuePath: '/rows/0/level' }, READ_AT)).toEqual({ ok: true, value: 36, observedAt: READ_AT, lagging: false });
  });

  it('reads the observed time where the value is — inside the item when there is one', () => {
    const reading = readHttpRef(
      body,
      { path: '/r', item: { list: '/rows', where: { station: 'north' } }, valuePath: '/level', observedAtPath: '/measuredAt', timeZone: 'Asia/Seoul' },
      READ_AT
    );
    expect(reading).toEqual({ ok: true, value: 36, observedAt: Date.parse('2026-10-09T14:00:00Z'), lagging: false });
  });

  it('reads the observed time from the whole response when there is no item', () => {
    const reading = readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/updatedAt', timeZone: 'Asia/Seoul' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 36, observedAt: Date.parse('2026-10-09T14:20:00Z'), lagging: false });
  });

  it('counts a value as observed at the read when the source leaves the time empty', () => {
    const reading = readHttpRef(body, { path: '/r', item: { list: '/rows', where: { station: 'south' } }, valuePath: '/level', observedAtPath: '/measuredAt' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 41, observedAt: READ_AT, lagging: false });
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

  it('says which part of the reference is missing when the time field is not there — the item or the response', () => {
    const list = { rows: [{ id: 'a', level: 3 }] };
    const inItem = readHttpRef(list, { path: '/r', item: { list: '/rows', where: { id: 'a' } }, valuePath: '/level', observedAtPath: '/updatedAt' }, READ_AT);
    expect(inItem).toMatchObject({ ok: false, reason: 'address', message: 'the time field "/updatedAt" (observedAtPath) is not in the item' });
    const inResponse = readHttpRef({ level: 3 }, { path: '/r', valuePath: '/level', observedAtPath: '/updatedAt' }, READ_AT);
    expect(inResponse).toMatchObject({ ok: false, reason: 'address', message: 'the time field "/updatedAt" (observedAtPath) is not in the response' });
  });

  it('refuses a time later than the read, naming the time zone as what to check', () => {
    // 23:20 read as UTC is nine hours after the read at 14:30 UTC — the zone was left out.
    const reading = readHttpRef(body, { path: '/r', valuePath: '/rows/0/level', observedAtPath: '/updatedAt' }, READ_AT);
    expect(reading).toMatchObject({ ok: false, reason: 'format' });
    expect(reading.ok === false && reading.message).toContain('timeZone');
  });

  it('takes a time a little ahead of the read as the read — the two clocks differ', () => {
    const reading = readHttpRef({ v: 1, t: '2026-10-09T14:32:00Z' }, { path: '/r', valuePath: '/v', observedAtPath: '/t' }, READ_AT);
    expect(reading).toEqual({ ok: true, value: 1, observedAt: READ_AT, lagging: false });
  });

  it('says a value older than the reference’s max age is lagging — the source’s latest, but behind', () => {
    const ref = { path: '/r', item: { list: '/rows', where: { station: 'north' } }, valuePath: '/level', observedAtPath: '/measuredAt', timeZone: 'Asia/Seoul' };
    // Observed 14:00, read 14:30: thirty minutes old.
    expect(readHttpRef(body, { ...ref, maxAgeSeconds: 3600 }, READ_AT)).toMatchObject({ ok: true, value: 36, lagging: false });
    expect(readHttpRef(body, { ...ref, maxAgeSeconds: 1200 }, READ_AT)).toMatchObject({ ok: true, value: 36, lagging: true });
  });

  it('says the format is wrong for a path into plain text', () => {
    expect(readHttpRef('OK', { path: '/r', observedAtPath: '/t' }, READ_AT)).toMatchObject({ ok: false, reason: 'format' });
  });

  it('says which item is missing', () => {
    const reading = readHttpRef(body, { path: '/r', item: { list: '/rows', where: { station: 'east' } }, valuePath: '/level' }, READ_AT);
    expect(reading).toEqual({ ok: false, reason: 'address', message: 'no item of "/rows" where station=east' });
  });

  describe('every item a list keeps (`items`)', () => {
    const air = {
      items: [
        { station: 'north', item: 'PM10', value: '36' },
        { station: 'north', item: 'O3', value: '0.031' },
        { station: 'south', item: 'PM10', value: 41 },
      ],
    };

    it('reads the elements whose fields all match, in the source’s order, observed at the read', () => {
      expect(readHttpRef(air, { path: '/air', items: { list: '/items', where: { item: 'PM10' } } }, READ_AT)).toEqual({
        ok: true,
        value: [air.items[0], air.items[2]],
        observedAt: READ_AT,
        lagging: false,
      });
    });

    it('reads an empty list when no element matches — the rows are there, none of them this kind', () => {
      expect(readHttpRef(air, { path: '/air', items: { list: '/items', where: { item: 'CO' } } }, READ_AT)).toMatchObject({ ok: true, value: [] });
    });

    it('says the address is wrong when there is no list there', () => {
      expect(readHttpRef(air, { path: '/air', items: { list: '/rows', where: { item: 'PM10' } } }, READ_AT)).toEqual({
        ok: false,
        reason: 'address',
        message: 'no list at "/rows" in the response',
      });
      expect(readHttpRef('OK', { path: '/air', items: { list: '/items', where: { item: 'PM10' } } }, READ_AT)).toMatchObject({ ok: false, reason: 'format' });
    });
  });
});

describe('parseSourceTime', () => {
  const utc = (iso: string) => Date.parse(iso);

  it('reads ISO 8601 with an offset as the instant it names, whatever the time zone', () => {
    expect(parseSourceTime('2026-10-09T19:00:00+09:00', 'America/New_York')).toBe(utc('2026-10-09T10:00:00Z'));
    expect(parseSourceTime('2026-10-09T10:00:00.250Z')).toBe(utc('2026-10-09T10:00:00.250Z'));
    expect(parseSourceTime('2026-10-09T05:00:00-0500')).toBe(utc('2026-10-09T10:00:00Z'));
    expect(parseSourceTime('2026-10-09T19:00:00+09')).toBe(utc('2026-10-09T10:00:00Z'));
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

  it('reads a compact date some sources write as a number, not as an epoch', () => {
    expect(parseSourceTime(202610091900, 'Asia/Seoul')).toBe(utc('2026-10-09T10:00:00Z'));
    expect(parseSourceTime(20261009, 'Asia/Seoul')).toBe(utc('2026-10-08T15:00:00Z'));
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

describe('an error a source answers with success', () => {
  // A source that writes a status only when it fails, at the top of its answer; its data answer nests one elsewhere.
  const onlyOnError = { path: '/code', messagePath: '/message' };
  // A source that always writes a status, and one value of it means success.
  const always = { path: '/response/header/resultCode', ok: ['00'], messagePath: '/response/header/resultMsg' };

  it('is found where the source writes it, in its own words with its status', () => {
    expect(sourceErrorIn({ status: 500, code: 'INFO-100', message: '인증키가 유효하지 않습니다.' }, onlyOnError)).toBe('인증키가 유효하지 않습니다. (INFO-100)');
    expect(sourceErrorIn({ response: { header: { resultCode: '03', resultMsg: 'NODATA_ERROR' } } }, always)).toBe('NODATA_ERROR (03)');
  });

  it('is not found in an answer that succeeded', () => {
    expect(sourceErrorIn({ errorMessage: { code: 'INFO-000', message: '정상 처리되었습니다.' }, rows: [] }, onlyOnError)).toBeUndefined();
    expect(sourceErrorIn({ response: { header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' } } }, always)).toBeUndefined();
    expect(sourceErrorIn({ code: null }, onlyOnError), 'null says nothing').toBeUndefined();
    expect(sourceErrorIn({ code: { nested: true } }, onlyOnError), 'an object is not a status').toBeUndefined();
  });

  it('compares statuses as text, and falls back to the status when the source gives no words', () => {
    expect(sourceErrorIn({ response: { header: { resultCode: 0 } } }, { path: '/response/header/resultCode', ok: ['0'] })).toBeUndefined();
    expect(sourceErrorIn({ code: 'E1', message: ' ' }, onlyOnError)).toBe('E1');
    expect(sourceErrorIn({ code: 42 }, { path: '/code' })).toBe('42');
  });

  it('keeps a long message short', () => {
    expect(sourceErrorIn({ code: 'x'.repeat(500) }, { path: '/code' })!.length).toBe(301);
  });

  it('is a setting only in its known shape', () => {
    expect(isSourceErrorField(onlyOnError)).toBe(true);
    expect(isSourceErrorField(always)).toBe(true);
    for (const bad of [null, [], { path: '' }, { path: 'code' }, { path: '/code', ok: [] }, { path: '/code', ok: [0] }, { path: '/code', messagePath: 'm' }, { path: '/code', extra: 1 }]) {
      expect(isSourceErrorField(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});
