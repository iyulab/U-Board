import { describe, it, expect } from 'vitest';
import { matches, pickedFromQuery, queryFor } from '../src/live/tag-filter';

const known = new Set(['energy', 'retro', 'example']);

describe('gallery tag filter', () => {
  it('reads the pick from the address, ignoring tags it does not know', () => {
    expect([...pickedFromQuery(new URLSearchParams('tag=energy,retro,nope'), known)]).toEqual(['energy', 'retro']);
    expect(pickedFromQuery(new URLSearchParams(''), known).size).toBe(0);
  });

  it('writes the pick into the address, keeping its other parameters', () => {
    expect(queryFor(new Set(['energy', 'retro']), new URLSearchParams('x=1'))).toBe('?x=1&tag=energy,retro');
    expect(queryFor(new Set(), new URLSearchParams('tag=energy'))).toBe('');
  });

  it('keeps a board that has every tag picked', () => {
    expect(matches(['energy', 'retro', 'example'], new Set(['energy', 'retro']))).toBe(true);
    expect(matches(['energy', 'example'], new Set(['energy', 'retro']))).toBe(false);
    expect(matches(['energy'], new Set())).toBe(true);
  });
});
