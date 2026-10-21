import { describe, it, expect } from 'vitest';
import { gridSpans } from './grid-board.js';

const medium = (...items: { span?: number; spanMedium?: number; rowSpan?: number }[]) => gridSpans(items).map(s => s.spanMedium);

describe('gridSpans at medium width', () => {
  it('halves a row whose spans are all even', () => {
    expect(medium({ span: 8 }, { span: 4 })).toEqual([4, 2]);
    expect(medium({}, {}, {})).toEqual([2, 2, 2]);
    expect(medium({ span: 12 }, { span: 6 }, { span: 6 })).toEqual([6, 3, 3]);
  });

  it('fills the six columns with a row of odd spans that fills the twelve', () => {
    expect(medium({ span: 7 }, { span: 5 })).toEqual([4, 2]);
    expect(medium({ span: 5 }, { span: 7 })).toEqual([2, 4]);
    expect(medium({ span: 9 }, { span: 3 })).toEqual([5, 1]);
  });

  it('splits a row that divides at its middle into two medium rows', () => {
    expect(medium({ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 })).toEqual([3, 3, 3, 3]);
    expect(medium({ span: 6 }, { span: 3 }, { span: 3 })).toEqual([6, 3, 3]);
    expect(medium({ span: 1 }, { span: 5 }, { span: 3 }, { span: 3 })).toEqual([1, 5, 3, 3]);
  });

  it('shares a row that does not fill the width over half its columns', () => {
    expect(medium({ span: 3 })).toEqual([2]);
    expect(medium({ span: 5 }, { span: 4 })).toEqual([3, 2]);
  });

  it('reads the rows as the full width lays them out — beside an item spanning rows, the next ones fill what is left', () => {
    // The plan takes eight columns for three rows; the cards beside it go one to a row, then three to a row below.
    const spans = medium({ span: 8, rowSpan: 3 }, {}, {}, {}, {}, {}, {});
    expect(spans).toEqual([4, 2, 2, 2, 2, 2, 2]);
    expect(medium({ span: 9, rowSpan: 2 }, { span: 3 }, { span: 3 }, { span: 7 }, { span: 5 })).toEqual([5, 1, 1, 4, 2]);
  });

  it('keeps an item’s own spanMedium, and leaves the rest of its row at half their span rounded up', () => {
    expect(medium({ span: 7, spanMedium: 6 }, { span: 5 })).toEqual([6, 3]);
    expect(medium({ span: 7 }, { span: 5 }, { span: 12, spanMedium: 6 })).toEqual([4, 2, 6]);
  });

  it('keeps the full-width spans as they are, the default 4', () => {
    expect(gridSpans([{}, { span: 7 }]).map(s => s.span)).toEqual([4, 7]);
  });
});
