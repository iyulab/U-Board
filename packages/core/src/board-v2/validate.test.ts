import { describe, expect, it } from 'vitest';
import { validateBoardV2 } from './validate.js';

const data = {
  equipment: { from: 'plant', path: '/plant/equipment', list: '/value', key: 'id', fields: { state: { state: 'raw' } } },
  totals: { from: 'plant', path: '/plant/totals' },
};

/** A canvas board placing every part, one under the other. */
const canvas = (parts: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
  version: 2,
  data,
  parts,
  layout: {
    kind: 'canvas', size: [400, 600],
    place: Object.fromEntries(Object.keys(parts).map((id, i) => [id, [10, 10 + i * 80, 150, 70]])),
    ...more,
  },
});

const issues = (board: unknown) => validateBoardV2(board).map(i => `${i.at}: ${i.message}`);

describe('validateBoardV2', () => {
  it('takes a board that is right', () => {
    expect(issues(canvas({ a: { as: 'status-card', of: 'equipment[PR-01]', show: 'state' }, t: { as: 'stat', of: 'totals', show: 'count' } }))).toEqual([]);
  });

  it('asks for the version', () => {
    expect(issues({ ...canvas({}), version: 1 })).toEqual(['/version: a board in this language says "version": 2']);
  });

  it('says how to write an item of data, and names what there is', () => {
    expect(issues(canvas({ a: { as: 'stat', of: 'equipment/PR-01' } }))).toEqual([
      '/parts/a/of: an item of data is written "equipment[PR-01]" — "/" is only in the ids of parts "each" makes',
    ]);
    expect(issues(canvas({ a: { as: 'stat', of: 'machines[M1]' } }))).toEqual(['/parts/a/of: no data "machines" — data: equipment, totals']);
    expect(issues(canvas({ a: { as: 'stat', of: 'totals[T1]' } }))[0]).toContain('"totals" has no "list"');
  });

  it('checks presets and each', () => {
    expect(issues(canvas({ a: { use: 'card', of: 'equipment[PR-01]' } }))[0]).toBe('/parts/a/use: no preset "card" — presets: none');
    expect(issues(canvas({ a: { as: 'stat', each: 'equipment', of: 'equipment[PR-01]' } }))).toContain(
      '/parts/a/of: a part with "each" takes its items from "each" — leave "of" out',
    );
    expect(issues(canvas({ a: { as: 'stat', each: 'totals' } }))).toContain('/parts/a/each: "each" makes a part per item of a "list" — "totals" has none');
    expect(issues({ ...canvas({ a: { use: 'card', of: 'equipment[PR-01]' } }), presets: { card: { as: 'status-card' } } })).toEqual([]);
  });

  it('finds a part that is not placed, and a place of no part', () => {
    const board = canvas({ a: { as: 'stat', of: 'totals' } });
    (board.layout as Record<string, unknown>).place = { b: [0, 0] };
    expect(issues({ ...board, parts: { a: { as: 'stat', of: 'totals' } } })).toEqual([
      '/layout/place/b: no part "b" — parts: a',
      '/parts/a: "a" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('lays out the items of a list with no key in a grid, and asks for a key to place them one by one', () => {
    const queue = { from: 'kitchen', path: '/tickets', list: '/value' };
    const parts = { t: { as: 'status-card', each: 'queue' } };
    expect(issues({ version: 2, data: { queue }, parts, layout: { kind: 'grid', items: [['t', 3]] } })).toEqual([]);
    expect(issues({ version: 2, data: { queue }, parts, layout: { kind: 'canvas', size: [400, 300], place: { t: { '1': [0, 0] } } } })).toEqual([
      '/layout/place/t: items placed one by one are named by their "key" — give "queue" a "key", or lay them out in a grid',
    ]);
  });

  it('places an each part item by item, inside its own entry', () => {
    const board = { version: 2, data, parts: { m: { as: 'status-card', each: 'equipment' } }, layout: { kind: 'canvas', size: [400, 300], place: { m: { 'PR-01': [0, 0, 100, 60] } } } };
    expect(issues(board)).toEqual([]);
    expect(issues({ ...board, layout: { ...board.layout, place: { 'm/PR-01': [0, 0] } } })).toEqual([
      '/layout/place/m/PR-01: "m/PR-01" is an item of the "each" part "m" — place it inside it: "m": { "PR-01": [x, y, w, h], … }',
      '/parts/m: "m" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('stacks parts in a grid cell that holds a grid, and checks spans', () => {
    const parts = { map: { as: 'stat', of: 'totals' }, chart: { as: 'chart.bar', of: 'equipment' }, alarms: { as: 'list', of: 'equipment' } };
    const grid = (items: unknown[]) => ({ version: 2, data, parts, layout: { kind: 'grid', items } });
    expect(issues(grid([['map', 8], { grid: ['chart', ['alarms', 12]], span: 4 }]))).toEqual([]);
    expect(issues(grid(['map', { id: 'right', grid: ['chart', 'alarms'] }]))).toEqual([
      '/layout/items/1: "id" names the part a cell holds — a cell holding a canvas or a grid has none: leave "id" out',
      '/parts/chart: "chart" is not placed — put it in the layout, or remove it',
      '/parts/alarms: "alarms" is not placed — put it in the layout, or remove it',
    ]);
    expect(issues(grid([['map', 13], { grid: ['chart', 'alarms'], canvas: {} }]))).toEqual([
      '/layout/items/0/1: a span is a whole number of the 12 columns, 1 to 12',
      '/layout/items/1: a grid item holds one thing: a part ("id"), a "canvas" or a "grid"',
      '/parts/chart: "chart" is not placed — put it in the layout, or remove it',
      '/parts/alarms: "alarms" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('checks a group: its parts placed on its canvas, read of the group', () => {
    const pump = {
      as: 'group', size: [220, 140],
      parts: { card: { as: 'status-card', show: ['state'] }, level: { as: 'gauge', show: 'level' } },
      place: { card: [0, 0, 150, 140], level: [160, 0, 60, 140] },
    };
    const board = { version: 2, data, presets: { pump }, parts: { pumps: { use: 'pump', each: 'equipment' } }, layout: { kind: 'grid', items: ['pumps'] } };
    expect(issues(board)).toEqual([]);
    const broken = { ...board, presets: { pump: { ...pump, place: { card: [0, 0], valve: [1, 1] } } } };
    expect(issues(broken)).toEqual([
      '/parts/pumps/parts/level: "level" is not placed in the group — put it in its "place", or remove it',
      '/parts/pumps/place/valve: no part "valve" in the group — its parts: card, level',
    ]);
  });

  it('links parts, items of each parts and parts in groups; a link with a status reads a data item', () => {
    const parts = {
      P1: { as: 'status-card', of: 'equipment[P1]' },
      pumps: { as: 'group', each: 'equipment', size: [100, 60], parts: { valve: { as: 'stat', show: 'state' } }, place: { valve: [0, 0] } },
    };
    const board = (links: Record<string, unknown>) => ({
      version: 2, data, parts,
      layout: { kind: 'canvas', size: [800, 400], place: { P1: [0, 0], pumps: { P2: [200, 0] } }, links },
    });
    expect(issues(board({ a: { from: 'P1', to: 'pumps/P2' }, b: { from: 'pumps/P2/valve', to: 'P1', of: 'equipment[P2]', show: 'state' } }))).toEqual([]);
    expect(issues(board({ a: { from: 'P1', to: 'P9' }, b: { from: 'P1', to: 'pumps/P2', show: 'flow' } }))).toEqual([
      '/layout/links/a/to: no part "P9" to link',
      '/layout/links/b/show: a link shows a field "of" a data item — give "of" too',
    ]);
  });

  it('checks a data read: where on a list, the request time, and statuses', () => {
    const board = {
      ...canvas({}),
      statuses: { down: { tone: 'red' }, slow: { tone: 'warn', emphasis: 'glow' } },
      data: {
        air: { from: 'gov', path: '/air?date={{now:yyyyMMdd}}', list: '/items', key: 'station', where: { item: 'PM10' }, now: { delay: 2400, step: 3600 }, zone: 'Asia/Seoul' },
        bad: { from: 'gov', path: 'air', where: { item: ['PM10'] }, now: { step: 0 } },
      },
    };
    expect(issues(board)).toEqual([
      '/statuses/down/tone: "red" is not a tone — use ok · info · watch · warn · alarm · off · idle · accent · past · now · next',
      '/statuses/slow/emphasis: "glow" is not an emphasis — use invert · hatch · stamp · blink',
      '/data/bad/path: a data read needs "path": the request, starting with "/"',
      '/data/bad/where: "where" keeps the items of a "list" whose fields equal its values: { "field": value }',
      '/data/bad/now/step: "step" is how often the source has new data, in seconds (more than 0)',
    ]);
  });
});
