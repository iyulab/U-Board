import { describe, it, expect } from 'vitest';
import { shapeOf } from './shape.js';

describe('shapeOf', () => {
  it('names each value by its JSON Pointer, with its type and an example, the first item standing for a list', () => {
    const response = {
      updated: '2026-10-15T09:00:00+09:00',
      items: [
        { id: 'P-101', temp: 61.5, running: true, note: null },
        { id: 'P-102', temp: 58, running: false, note: null },
      ],
    };
    expect(shapeOf(response)).toEqual({
      values: [
        '/updated: string "2026-10-15T09:00:00+09:00"',
        '/items: array(2)',
        '/items/0/id: string "P-101"',
        '/items/0/temp: number 61.5',
        '/items/0/running: boolean true',
        '/items/0/note: null',
      ],
      lists: [{ list: '/items', items: 2, keys: ['id', 'temp', 'running'], names: { id: ['P-101', 'P-102'] } }],
    });
  });

  it('offers only fields whose values tell the items apart', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ station: `S${i}`, district: i < 10 ? 'east' : 'west', pm10: i }));
    expect(shapeOf({ rows: items }).lists).toEqual([{ list: '/rows', items: 20, keys: ['station', 'pm10'], names: { station: items.slice(0, 12).map(i => i.station) } }]);
  });

  it('escapes keys in pointers, shortens long examples, and reads a bare value or list', () => {
    expect(shapeOf({ 'a/b': 'x'.repeat(100) }).values[0]).toBe(`/a~1b: string "${'x'.repeat(39)}…"`);
    expect(shapeOf(42)).toEqual({ values: ['/: number 42'], lists: [] });
    expect(shapeOf([]).values).toEqual(['/: array(0)']);
  });

  it('stays small however large the response', () => {
    const wide = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`k${i}`, i]));
    const shape = shapeOf(wide);
    expect(shape.values.length).toBeLessThanOrEqual(80);
    expect(shape.truncated).toBe(true);
  });
});
