import { describe, expect, it } from 'vitest';
import { META_MAX_ENTRIES, metaLines, metaOf } from './value-meta.js';

describe('what a reading says about its value (meta)', () => {
  it('keeps words, finite numbers and yes/no values under names', () => {
    expect(metaOf({ source: 'sensor 14', calibrated: true, offset: -0.5, count: 0 })).toEqual({ source: 'sensor 14', calibrated: true, offset: -0.5, count: 0 });
  });

  it('leaves out what is not one of those, and a reading with nothing left has none', () => {
    expect(metaOf({ a: { nested: 1 }, b: [1], c: null, d: undefined, e: NaN, f: Infinity, '': 'x', '  ': 'y', ok: 'kept' })).toEqual({ ok: 'kept' });
    expect(metaOf({ a: null })).toBeUndefined();
    expect(metaOf({})).toBeUndefined();
    for (const raw of [undefined, null, 'text', 12, true, ['a', 'b']]) expect(metaOf(raw)).toBeUndefined();
  });

  it('is a note beside a value: a few entries, short names and words', () => {
    const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i]));
    expect(Object.keys(metaOf(many)!)).toHaveLength(META_MAX_ENTRIES);
    const clipped = metaOf({ ['n'.repeat(100)]: 'w'.repeat(500) })!;
    const [[name, words]] = Object.entries(clipped) as [string, string][];
    expect(name.length).toBe(48);
    expect(words.length).toBe(160);
    expect(words.endsWith('…')).toBe(true);
  });

  it('is shown as lines of name and value, a yes/no as yes or no', () => {
    expect(metaLines({ source: 'sensor 14', calibrated: false, offset: 2 })).toEqual(['source: sensor 14', 'calibrated: no', 'offset: 2']);
    expect(metaLines(undefined)).toEqual([]);
  });
});
