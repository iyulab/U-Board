import { describe, expect, it } from 'vitest';
import type { ViewDocument } from '@iyulab/u-board/picture';
import { emptyProblems, placementProblems } from './placement.js';

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

describe('emptyProblems', () => {
  const canvas = (nodes: unknown[], decorations?: unknown[]) => ({ kind: 'canvas', background: {}, nodes, connectors: [], ...(decorations && { decorations }) }) as unknown as ViewDocument;
  const grid = (items: unknown[]) => ({ kind: 'grid', items }) as unknown as ViewDocument;

  it('says a picture with nothing in it is blank paper, for a grid and for a canvas', () => {
    expect(emptyProblems(grid([]))[0]!.message).toContain('nothing is drawn');
    expect(emptyProblems(canvas([]))[0]!.path).toBe('/parts');
  });

  it('says nothing of a picture with a part, or only a drawn shape', () => {
    expect(emptyProblems(grid([{ id: 'a' }]))).toEqual([]);
    expect(emptyProblems(canvas([{ id: 'n' }]))).toEqual([]);
    expect(emptyProblems(canvas([], [{ id: 'd' }]))).toEqual([]);
  });
});
