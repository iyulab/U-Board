import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { boardV2Schema } from './schema.js';
import { PART_KINDS } from './kinds.js';
import { validateBoardV2 } from './validate.js';

// The schema says a board's shape for a reader that has only the schema; the validator says the same and more. Every
// board below is judged by both, the same way — the cases are the shape, not what only the validator can see.
const accepts = new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(boardV2Schema());

const data = {
  equipment: {
    from: 'plant', path: '/plant/equipment', list: '/value', key: 'id', where: { line: 'L1' }, now: { delay: 60, step: 300 }, zone: 'Asia/Seoul',
    fields: { state: { state: 'raw' }, temp: { unit: '°C', digits: 1, state: ['ok', 70, 'warn', 80, 'alarm'] }, mode: { names: { a: 'Auto', '*': 'Manual' } } },
  },
  totals: { from: 'plant', path: '/plant/totals' },
};
const canvas = (parts: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
  version: 2,
  data,
  parts,
  layout: { kind: 'canvas', size: [400, 600], place: Object.fromEntries(Object.keys(parts).map((id, i) => [id, [10, 10 + i * 80, 150, 70]])), ...more },
});
const grid = (items: unknown[], parts: Record<string, unknown> = { a: { as: 'stat', of: 'totals' }, b: { as: 'chart.line', of: 'equipment' } }) => ({
  version: 2, data, parts, layout: { kind: 'grid', items },
});
const pump = {
  as: 'group', size: [220, 140],
  parts: { card: { as: 'status-card', show: ['state'] }, level: { as: 'gauge', show: 'temp' } },
  place: { card: [0, 0, 150, 140], level: [160, 0, 60, 140] },
  shapes: { pipe: { line: [[150, 70], [160, 70]] } },
};

const AGREED: [string, unknown, boolean][] = [
  ['a canvas board with statuses, a look, shapes and links', {
    ...canvas({ P1: { as: 'status-card', of: 'equipment[P1]', title: '{{key}}', show: ['state', 'temp'] }, T: { as: 'stat', of: 'totals' } }, {
      shapes: { zone: { box: [0, 0, 100, 60], label: 'Zone A', tone: 'accent' }, note: { text: 'North', at: [5, 5], size: 12 }, edge: { path: 'M 0 0 L 10 10' } },
      links: { feed: { from: 'P1', to: 'T', of: 'equipment[P1]', show: 'state', label: '{{temp}}', arrow: true } },
    }),
    statuses: { run: { tone: 'ok', label: 'Running', glyph: '▶', emphasis: 'hatch' } },
    board: { title: 'Plant', theme: 'dark', accent: '#22d3ee', skin: { frame: 'plate', palette: { paper: '#f4efe4' }, shadow: 'soft', density: 'compact' } },
  }, true],
  ['a grid with a cell of its own grid and a canvas cell', grid([['a', 8], { grid: ['b'], span: 4 }, { canvas: { size: [100, 100], place: {} }, span: 12 }]), true],
  ['a group preset repeated with each', { version: 2, data, presets: { pump }, parts: { pumps: { use: 'pump', each: 'equipment' } }, layout: { kind: 'grid', items: ['pumps'] } }, true],
  ['an element drawn by a part', {
    ...canvas({ t: { as: 'element', element: 'tank', of: 'equipment[T1]', props: { name: 'T1' }, bind: { level: 'temp', state: 'temp.tone' } } }),
    elements: { tank: { template: '<svg style="--l: {{level}}"></svg><b class="{{state}}">{{name}}</b>', props: { level: 'number', state: 'string', name: 'string' } } },
  }, true],
  ['every kind there is', { elements: { e: { template: '<svg/>' } }, ...grid(PART_KINDS.map(k => k.kind), Object.fromEntries(PART_KINDS.map(k => [k.kind, k.kind === 'group'
    ? { as: 'group', size: [10, 10], parts: {}, place: {} }
    : { as: k.kind, ...(k.of === 'no' ? {} : { of: 'equipment' }), ...(k.kind === 'element' ? { element: 'e' } : {}) }]))) }, true],

  ['no version', { data, parts: {}, layout: { kind: 'grid', items: [] } }, false],
  ['a word at the top the language does not have', { ...canvas({}), widgets: {} }, false],
  ['a kind that is not one', canvas({ a: { as: 'timeline', of: 'totals' } }), false],
  ['a part with both of and each', canvas({ a: { as: 'stat', of: 'equipment[P1]', each: 'equipment' } }), false],
  ['an item named with a slash', canvas({ a: { as: 'stat', of: 'equipment/P1' } }), false],
  ['a status in a tone that is not one', { ...canvas({}), statuses: { down: { tone: 'red' } } }, false],
  ['a frame that is not one', { ...canvas({}), board: { skin: { frame: 'stamp' } } }, false],
  ['a word in the board head it does not have', { ...canvas({}), board: { title: 'x', colour: '#000' } }, false],
  ['a data read with a relative path', { ...canvas({}), data: { x: { from: 'p', path: 'x' } } }, false],
  ['a request time that does not step', { ...canvas({}), data: { x: { from: 'p', path: '/x', list: '/v', now: { step: 0 } } } }, false],
  ['a field with a fraction of digits', { ...canvas({}), data: { x: { from: 'p', path: '/x', fields: { v: { digits: 1.5 } } } } }, false],
  ['a place of three numbers', { ...canvas({ a: { as: 'stat', of: 'totals' } }), layout: { kind: 'canvas', size: [10, 10], place: { a: [0, 0, 1] } } }, false],
  ['a span past the columns', grid([['a', 13], 'b']), false],
  ['a grid cell holding a part and a grid', grid([{ id: 'a', grid: ['b'] }]), false],
  ['a shape that is a box and a text', canvas({}, { shapes: { s: { box: [0, 0, 1, 1], text: 'x', at: [0, 0] } } }), false],
  ['a line of one point', canvas({}, { shapes: { s: { line: [[0, 0]] } } }), false],
  ['a relative path', canvas({}, { shapes: { s: { path: 'm 0 0 l 1 1' } } }), false],
  ['a link that shows a field of nothing', { ...canvas({ a: { as: 'stat', of: 'totals' } }, { links: { l: { from: 'a', to: 'a', show: 'state' } } }) }, false],
  ['a group with no place', canvas({ g: { as: 'group', size: [10, 10], parts: {} } }), false],
  ['an element prop of a type there is not', { ...canvas({}), elements: { e: { template: '<svg/>', props: { a: 'float' } } } }, false],
  ['an element bound to an expression', { ...canvas({ t: { as: 'element', element: 'e', of: 'totals', bind: { a: 'count + 1' } } }), elements: { e: { template: '<svg>{{a}}</svg>', props: { a: 'number' } } } }, false],
  ['a layout of a kind there is not', { version: 2, parts: {}, layout: { kind: 'map' } }, false],
];

describe('the v2 board schema', () => {
  it.each(AGREED)('%s — the schema and the validator agree', (_name, board, ok) => {
    const errors = validateBoardV2(board).filter(i => !i.hint);
    expect(errors.length === 0, JSON.stringify(errors)).toBe(ok);
    expect(accepts(board), JSON.stringify(accepts.errors?.slice(0, 3))).toBe(ok);
  });

  it('lists the kinds the validator takes, and the tones', () => {
    const schema = boardV2Schema() as { $defs: { part: { properties: { as: { enum: string[] } } }; tone: { enum: string[] } } };
    expect(schema.$defs.part.properties.as.enum).toEqual(PART_KINDS.map(k => k.kind));
    expect(schema.$defs.tone.enum).toContain('alarm');
  });
});
