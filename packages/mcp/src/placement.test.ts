import { describe, expect, it } from 'vitest';
import { placementProblems } from './placement.js';

describe('placementProblems', () => {
  it('says, for a part whose items fell off the canvas, how many and where to look', () => {
    expect(placementProblems({ zone: 3, dot: 1 }, undefined)).toEqual([
      { path: '/parts/zone', message: '3 items of "zone" are not drawn: no number in the fields its place names, or outside its frame — check "at" and "frame"' },
      { path: '/parts/dot', message: '1 item of "dot" is not drawn: no number in the fields its place names, or outside its frame — check "at" and "frame"' },
    ]);
  });

  it('names a data a part is made per item of whose answer is no list', () => {
    const [problem] = placementProblems(undefined, ['zones/a']);
    expect(problem!.path).toBe('/data/zones~1a');
    expect(problem!.message).toContain('"zones/a" is read as an object keyed by names');
  });

  it('says nothing when everything was drawn', () => {
    expect(placementProblems({}, [])).toEqual([]);
    expect(placementProblems(undefined, undefined)).toEqual([]);
  });
});
