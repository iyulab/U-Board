import { describe, expect, it } from 'vitest';
import { checkBoard, emptyBoard, foldRepeats, sourceAdvice } from './check.js';
import { RULEBOOK_EXAMPLE } from './rulebook.js';
import { validateBoard } from './validate.js';

const totals = { totals: { from: 'plant', path: '/plant/totals' } };

describe('checkBoard', () => {
  it('takes a board that is right, with nothing to refuse', () => {
    expect(checkBoard(RULEBOOK_EXAMPLE).issues).toEqual([]);
  });

  it('refuses what the language does not have, at its path, and gives no advice then', () => {
    const board = { data: totals, parts: { t: { as: 'metric', of: 'totals' } }, layout: { kind: 'grid', items: ['t'] } };
    const { issues, advice } = checkBoard(board);
    expect(issues.map(i => i.path)).toEqual(['/parts/t/as']);
    expect(advice).toEqual([]);
  });

  it('refuses a board the language takes but the renderer cannot draw, where it cannot', () => {
    const many = {
      data: { pumps: { from: 'plant', path: '/plant/rows', list: '/value', key: 'id', where: { kind: 'pump' }, fields: { state: { at: '/state' } } } },
      parts: { t: { as: 'stat', of: 'pumps', show: 'state' } },
      layout: { kind: 'grid', items: ['t'] },
    };
    expect(validateBoard(many).filter(i => !i.hint)).toEqual([]);
    expect(checkBoard(many).issues).toEqual([{ path: '/parts/t', message: expect.stringContaining('is not one value') }]);
  });

  it('takes a field that lives deeper in an item, in a list and in a text alike', () => {
    const deep = {
      data: { deep: { from: 'plant', path: '/plant/rows', list: '/value', fields: { x: { at: '/a/b' } } } },
      parts: { t: { as: 'list', of: 'deep', primary: 'x' } },
      layout: { kind: 'grid', items: ['t'] },
    };
    expect(checkBoard(deep).issues).toEqual([]);
  });

  it('advises on a board that is right but could be written better', () => {
    const board = {
      elements: { tag: { template: '<b>{{name}}</b>', props: { name: 'string' } } },
      parts: { e: { as: 'element', element: 'tag', props: { name: 'pump' } } },
      layout: { kind: 'grid', items: ['e'] },
    };
    expect(checkBoard(board)).toEqual({ issues: [], advice: [{ path: '/elements/tag', message: expect.stringContaining('draws no shape of its own') }] });
  });

  it('says when a read names a source by its name, or one the workspace does not have — with the id to write', () => {
    const board = {
      data: {
        byName: { from: 'Line 1', path: '/line.json' },
        byId: { from: 's1', path: '/line.json' },
        gone: { from: 'nowhere', path: '/x' },
        hosted: { from: 'plc', ref: { tag: 'T1' } },
      },
      parts: {},
      layout: { kind: 'grid' as const, items: [] },
    };
    expect(sourceAdvice(board, [{ id: 's1', name: ' line 1' }])).toEqual([
      { path: '/data/byName/from', message: '"Line 1" is the name of a data source — "from" takes its id: "s1". Nothing is read until it does' },
      { path: '/data/gone/from', message: '"nowhere" is no data source of this workspace — "from" takes a source\'s id (list_sources). Nothing is read until it does' },
    ]);
  });
});

describe('foldRepeats', () => {
  const at = (n: number) => Array.from({ length: n }, (_, i) => ({ path: `/data/p${i}/from`, message: 'the same words' }));

  it('gives the same finding in full a few times and counts the rest in one line', () => {
    const folded = foldRepeats(at(520));
    expect(folded).toHaveLength(4);
    expect(folded.slice(0, 3)).toEqual(at(3));
    expect(folded[3]).toEqual({ path: '/data/p3/from', message: 'and 517 more the same (/data/p3/from, /data/p4/from, /data/p5/from, …) — the fix is the same: the same words', count: 517 });
  });

  it('leaves alone what is said so few times that a line to count it would save nothing', () => {
    expect(foldRepeats(at(4))).toEqual(at(4));
    expect(foldRepeats([])).toEqual([]);
  });

  it('folds each kind of finding on its own, keeps the order, and counts a late one with the rest of its kind', () => {
    const mixed = [...at(6), { path: '/x', message: 'another' }, { path: '/late', message: 'the same words' }];
    const folded = foldRepeats(mixed);
    expect(folded.map(f => f.path)).toEqual(['/data/p0/from', '/data/p1/from', '/data/p2/from', '/data/p3/from', '/x']);
    expect(folded[3]).toMatchObject({ count: 4, message: expect.stringContaining('/data/p3/from, /data/p4/from, /data/p5/from, …') });
  });

  it('is what a board of many reads of one unknown source is answered with', () => {
    const data = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`p${i}`, { from: 'nowhere', path: `/${i}` }]));
    const advice = sourceAdvice({ data, parts: {}, layout: { kind: 'grid' as const, items: [] } }, []);
    expect(advice).toHaveLength(4);
    expect(advice[3]).toMatchObject({ count: 47 });
  });
});

describe('emptyBoard', () => {
  it('starts a board of either kind with no parts, which the check takes and draws', () => {
    for (const kind of ['canvas', 'grid'] as const) {
      const board = emptyBoard(kind);
      expect(board.layout.kind).toBe(kind);
      expect(checkBoard(board).issues).toEqual([]);
    }
  });
});
