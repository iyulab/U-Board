import { describe, it, expect } from 'vitest';
import { isWhereValue, whereMatches, whereText } from './where';

describe('a where value', () => {
  it('is a value, { not: value } or { in: [values] } — and nothing else', () => {
    for (const ok of ['a', 1, true, false, { not: 'a' }, { not: 0 }, { in: ['a', 1] }]) expect(isWhereValue(ok), JSON.stringify(ok)).toBe(true);
    for (const no of [null, undefined, [], {}, { not: {} }, { not: [1] }, { in: [] }, { in: 'a' }, { in: [{}] }, { like: 'a' }, { not: 'a', in: ['b'] }]) expect(isWhereValue(no), JSON.stringify(no)).toBe(false);
  });

  it('matches by text, and a field that is not there equals nothing', () => {
    expect(whereMatches(1, '1')).toBe(true);
    expect(whereMatches('1', 1)).toBe(true);
    expect(whereMatches(undefined, 'a')).toBe(false);
    expect(whereMatches(null, 'null')).toBe(false);
    expect(whereMatches('a', { not: 'a' })).toBe(false);
    expect(whereMatches('b', { not: 'a' })).toBe(true);
    expect(whereMatches(undefined, { not: 'a' })).toBe(true);
    expect(whereMatches(2, { in: ['1', 2] })).toBe(true);
    expect(whereMatches(undefined, { in: ['a'] })).toBe(false);
  });

  it('says itself in words', () => {
    expect(whereText('room', '704')).toBe('room=704');
    expect(whereText('room', { not: '704' })).toBe('room!=704');
    expect(whereText('room', { in: ['701', 702] })).toBe('room in 701|702');
  });
});
