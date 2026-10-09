import { describe, it, expect } from 'vitest';
import { lacksOffset, timeFieldsIn } from './time-fields.js';

describe('timeFieldsIn', () => {
  it('offers text that reads as a date and time, wherever it is, in the order given', () => {
    const response = {
      status: { updated: '2026-10-09 23:20', code: 'OK' },
      rows: [{ id: 'A-1', measured: '202610092300', level: '36' }, { id: 'A-2', measured: '202610092300' }],
    };
    expect(timeFieldsIn(response)).toEqual([
      { pointer: '/status/updated', raw: '2026-10-09 23:20' },
      { pointer: '/rows/0/measured', raw: '202610092300' },
    ]);
  });

  it('offers a number only when its key is named like a time', () => {
    expect(timeFieldsIn({ time: 1791476400000, generatedAt: 1791476400, count: 1791476400000, mag: 4.2 })).toEqual([
      { pointer: '/time', raw: 1791476400000 },
      { pointer: '/generatedAt', raw: 1791476400 },
    ]);
  });

  it('leaves out a run of 10 or 13 digits written as text — an id as often as an epoch', () => {
    expect(timeFieldsIn({ station: '1234567890', order: '1791476400000' })).toEqual([]);
  });

  it('escapes a key with a slash or tilde in its pointer', () => {
    expect(timeFieldsIn({ 'a/b': { '~t': '2026-10-09T10:00:00Z' } })).toEqual([{ pointer: '/a~1b/~0t', raw: '2026-10-09T10:00:00Z' }]);
  });

  it('offers the whole value when it is itself a time', () => {
    expect(timeFieldsIn('2026-10-09T10:00:00Z')).toEqual([{ pointer: '', raw: '2026-10-09T10:00:00Z' }]);
  });
});

describe('lacksOffset', () => {
  it('tells a wall-clock time from one that places itself', () => {
    expect(lacksOffset('2026-10-09 23:20')).toBe(true);
    expect(lacksOffset('202610092300')).toBe(true);
    expect(lacksOffset('2026-10-09T10:00:00Z')).toBe(false);
    expect(lacksOffset('2026-10-09T19:00:00+09:00')).toBe(false);
    expect(lacksOffset(1791476400000)).toBe(false);
    expect(lacksOffset('1791476400')).toBe(false);
  });
});
