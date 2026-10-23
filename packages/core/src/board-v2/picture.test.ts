import { describe, expect, it } from 'vitest';
import { checkSpec } from '@iyulab/u-widgets/tools';
import { applyValueMap, withItemFields } from '../adapter.js';
import { readHttpRef, type HttpRef } from '../http-ref.js';
import { validateViewDocument } from '../validate-view-document.js';
import type { Node, ViewDocument, Widget } from '../view-document.js';
import { PictureError, toViewDocument } from './picture.js';
import type { BoardV2 } from './types.js';
import { validateBoardV2 } from './validate.js';

// What the source answers, by request path.
const SOURCE: Record<string, unknown> = {
  '/plant/pumps': {
    value: [
      { id: 'P1', line: 'L1', state: 'run', flow: 41.5, rpm: 1450, updatedAt: '2026-10-23T03:00:00Z' },
      { id: 'P2', line: 'L1', state: 'trip', flow: 0, rpm: 0, updatedAt: '2026-10-23T03:00:00Z' },
    ],
  },
  '/plant/totals': { output: 1280, oee: 0.83, temp: 74 },
  '/plant/hourly': { value: [{ hour: '09:00', count: 120 }, { hour: '10:00', count: 131 }] },
};
const READ_AT = Date.parse('2026-10-23T03:00:30Z');

/** A widget's props with every binding read from the source and mapped — what the renderer would draw. */
function drawn(widget: Widget): Record<string, unknown> {
  const props = structuredClone(widget.props ?? {}) as Record<string, unknown>;
  for (const [key, binding] of Object.entries(widget.bindings ?? {})) {
    const ref = binding.ref as HttpRef;
    const reading = readHttpRef(SOURCE[ref.path], ref, READ_AT);
    if (!reading.ok) throw new Error(`${key}: ${reading.message}`);
    const mapped = binding.map ? applyValueMap(binding.map, reading.value) : reading.value;
    const value = binding.itemFields ? withItemFields(binding.itemFields, mapped) : mapped;
    const path = key.split('.');
    let at: Record<string, unknown> = props;
    for (const step of path.slice(0, -1)) at = (at[step] ??= {}) as Record<string, unknown>;
    at[path.at(-1)!] = value;
  }
  return props;
}

const pumps = {
  from: 'plant', path: '/plant/pumps', list: '/value', key: 'id', time: 'updatedAt', fresh: 60,
  fields: { state: { state: { run: 'running', trip: 'tripped', '*': 'off' } }, flow: { label: 'Flow', unit: 'm³/h', digits: 1 }, rpm: { format: 'number' } },
} as const;
const board = (parts: BoardV2['parts'], layout: BoardV2['layout']): BoardV2 => ({
  version: 2,
  board: { title: 'Plant', theme: 'dark', accent: '#22d3ee' },
  statuses: { running: { tone: 'ok', label: 'Running' }, tripped: { tone: 'alarm', label: 'Tripped', emphasis: 'blink' } },
  data: {
    pumps,
    totals: { from: 'plant', path: '/plant/totals', fields: { temp: { unit: '°C', state: ['ok', 70, 'warn', 80, 'alarm'] }, oee: { format: 'percent' } } },
    hourly: { from: 'plant', path: '/plant/hourly', list: '/value' },
  },
  parts,
  layout,
});

/**
 * The view document of a board that is valid — the two checks a board meets before it is drawn — whose every widget,
 * drawn with the source's values, is one the widget library reads: no option it does not have, none of the wrong type.
 */
function view(b: BoardV2, keys: Record<string, string[]> = {}): ViewDocument {
  expect(validateBoardV2(b).filter(i => !i.hint)).toEqual([]);
  const doc = toViewDocument(b, { keysOf: d => keys[d] ?? [] });
  expect(validateViewDocument(doc)).toEqual([]);
  for (const placed of doc.kind === 'canvas' ? doc.nodes : doc.items) {
    // An element is U-Board's own drawing, checked by the view document's validator above.
    if (!('widget' in placed) || placed.widget.type.startsWith('element:')) continue;
    const { valid, errors, warnings } = checkSpec({ widget: placed.widget.type, ...drawn(placed.widget) });
    expect({ valid, errors, warnings }, placed.id).toEqual({ valid: true, errors: [], warnings: [] });
  }
  return doc;
}
const nodeOf = (doc: ViewDocument, id: string) => (doc.kind === 'canvas' ? doc.nodes : doc.items).find(n => n.id === id) as Node;

describe('the picture model of a v2 board', () => {
  it('draws a status card per placed item: its state as a tone and words, its other fields as readings', () => {
    const doc = view(board(
      { pump: { as: 'status-card', each: 'pumps', title: 'Pump {{key}}', show: ['state', 'flow', 'rpm'] } },
      { kind: 'canvas', size: [800, 400], place: { pump: { P1: [10, 10, 220, 110], P2: [10, 130, 220, 110] } } },
    ));
    expect(doc).toMatchObject({ kind: 'canvas', appearance: 'dark', accent: '#22d3ee' });
    const p1 = nodeOf(doc, 'pump/P1');
    expect(p1).toMatchObject({ x: 10, y: 10, width: 220, height: 110, anchored: true, widget: { type: 'status-card' } });
    expect(drawn(p1.widget)).toEqual({
      data: {
        title: 'Pump P1', tone: 'ok', status: 'Running', emphasis: '',
        readings: [{ label: 'Flow', value: 41.5, unit: 'm³/h', format: 'number:1' }, { label: 'rpm', value: 1450, format: 'number' }],
      },
    });
    expect(drawn(nodeOf(doc, 'pump/P2').widget).data).toMatchObject({ title: 'Pump P2', tone: 'alarm', status: 'Tripped', emphasis: 'blink' });
    // The source's time and how old a value may be come with every read.
    expect(p1.widget.bindings!['data.readings.0.value']!.ref).toEqual({
      path: '/plant/pumps', item: { list: '/value', where: { id: 'P1' } }, valuePath: '/flow', observedAtPath: '/updatedAt', maxAgeSeconds: 60,
    });
  });

  it('draws stats, a stat list, a gauge and a chart in a grid, each in the order and span the layout gives', () => {
    const doc = view(board(
      {
        head: { as: 'header', title: 'Line 1', kicker: 'Plant', clock: true },
        out: { as: 'stat', of: 'totals', show: 'output', title: 'Output' },
        temp: { as: 'gauge', of: 'totals', show: 'temp', max: 120, form: 'thermometer' },
        kpis: { as: 'stat-list', of: 'totals', show: ['oee', 'temp'] },
        hourly: { as: 'chart.bar', of: 'hourly', title: 'Per hour', x: 'hour', y: 'count' },
      },
      { kind: 'grid', items: [['head', 12], 'out', ['temp', 3], { id: 'kpis', span: 3, height: 160 }, ['hourly', 6]] },
    ));
    expect(doc.kind === 'grid' && doc.items.map(i => [i.id, i.span])).toEqual([['head', 12], ['out', undefined], ['temp', 3], ['kpis', 3], ['hourly', 6]]);
    expect(drawn(nodeOf(doc, 'head').widget)).toEqual({ data: { text: 'Line 1', kicker: 'Plant', clock: true } });
    expect(drawn(nodeOf(doc, 'out').widget)).toEqual({ data: { label: 'Output', value: 1280 } });
    expect(drawn(nodeOf(doc, 'temp').widget)).toEqual({ data: { value: 74, tone: 'warn' }, options: { unit: '°C', max: 120, form: 'thermometer' } });
    expect(drawn(nodeOf(doc, 'kpis').widget)).toEqual({
      data: [{ label: 'oee', value: 0.83, format: 'percent' }, { label: 'temp', value: 74, unit: '°C', tone: 'warn' }],
    });
    expect(drawn(nodeOf(doc, 'hourly').widget)).toEqual({
      title: 'Per hour', data: [{ hour: '09:00', count: 120 }, { hour: '10:00', count: 131 }], mapping: { x: 'hour', y: 'count' },
    });
  });

  it("colours the rows of a list, a table, bars and a grid of cells by each item's state", () => {
    const doc = view(board(
      {
        rows: { as: 'list', of: 'pumps', show: ['id', 'flow', 'state'], secondary: 'state', title: 'Pumps', max: 5 },
        table: { as: 'table', of: 'pumps', show: ['id', 'state', 'flow'] },
        bars: { as: 'bar-list', of: 'pumps', show: 'flow' },
        cells: { as: 'status-grid', of: 'pumps', show: ['id', 'state'] },
      },
      { kind: 'grid', items: ['rows', 'table', 'bars', 'cells'] },
    ));
    const rows = drawn(nodeOf(doc, 'rows').widget);
    expect(rows.mapping).toEqual({ primary: 'id', secondary: 'state', tone: 'state@tone' });
    expect(rows.options).toEqual({ maxItems: 5 });
    expect((rows.data as Record<string, unknown>[]).map(r => r['state@tone'])).toEqual(['ok', 'alarm']);
    const table = drawn(nodeOf(doc, 'table').widget);
    expect(table.mapping).toEqual({ columns: [
      { field: 'id', label: 'id' }, { field: 'state', label: 'state', toneField: 'state@tone' }, { field: 'flow', label: 'Flow', unit: 'm³/h', format: 'number:1' },
    ] });
    expect((drawn(nodeOf(doc, 'bars').widget).data as Record<string, unknown>[]).map(r => [r.label, r.value])).toEqual([['P1', 41.5], ['P2', 0]]);
    expect((drawn(nodeOf(doc, 'cells').widget).data as Record<string, unknown>[]).map(r => [r.label, r.tone])).toEqual([['P1', 'ok'], ['P2', 'alarm']]);
  });

  it('lays out a part per item in a grid, for the keys of its list', () => {
    const doc = view(board({ pump: { as: 'stat', each: 'pumps', show: 'flow' } }, { kind: 'grid', items: [['pump', 4]] }), { pumps: ['P1', 'P2'] });
    expect(doc.kind === 'grid' && doc.items.map(i => i.id)).toEqual(['pump/P1', 'pump/P2']);
    expect(drawn(nodeOf(doc, 'pump/P2').widget)).toEqual({ data: { label: 'Flow', value: 0, unit: 'm³/h' }, options: { format: 'number:1' } });
  });

  it('reads a request time and a fixed filter with the item', () => {
    const b = board({ p: { as: 'stat', of: 'air[중구]', show: 'pm10' } }, { kind: 'canvas', size: [100, 100], place: { p: [0, 0] } });
    b.data!.air = { from: 'gov', path: '/air?date={{now:yyyyMMdd}}', list: '/items', key: 'station', where: { item: 'PM10' }, now: { delay: 2400, step: 3600 }, zone: 'Asia/Seoul' };
    expect(validateBoardV2(b)).toEqual([]);
    expect(nodeOf(toViewDocument(b), 'p').widget.bindings!['data.value']!.ref).toEqual({
      path: '/air?date={{now:yyyyMMdd}}', item: { list: '/items', where: { item: 'PM10', station: '중구' } }, valuePath: '/pm10',
      timeZone: 'Asia/Seoul', requestTime: { delaySeconds: 2400, stepSeconds: 3600 },
    });
  });

  it('draws shapes as decorations and links as connectors, a link in its field’s state', () => {
    const doc = view(board(
      { P1: { as: 'stat', of: 'pumps[P1]', show: 'flow' }, P2: { as: 'stat', of: 'pumps[P2]', show: 'flow' } },
      {
        kind: 'canvas', size: [600, 300],
        place: { P1: [10, 10, 150, 80], P2: [300, 10, 150, 80] },
        shapes: { zone: { box: [0, 0, 500, 120], label: 'Line 1', tone: 'accent' }, note: { text: 'North', at: [5, 140], size: 12 } },
        links: {
          feed: { from: 'P1', to: 'P2', of: 'pumps[P2]', show: 'state', label: '{{flow}}', arrow: true },
          plain: { from: 'P2', to: 'P1', dash: true },
        },
      },
    ));
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(doc.decorations).toEqual([
      { id: 'shape.zone', type: 'rect', x: 0, y: 0, width: 500, height: 120, fill: 'none', stroke: 'accent', strokeWidth: 1.5, label: 'Line 1', labelAt: 'top-start' },
      { id: 'shape.note', type: 'text', x: 5, y: 140, text: 'North', fill: 'next', fontSize: 12 },
    ]);
    const [feed, plain] = doc.connectors;
    expect(plain).toEqual({ id: 'link.plain', fromNodeId: 'P2', toNodeId: 'P1', style: { stroke: 'idle', strokeWidth: 2, dash: 'dashed', arrow: 'none' } });
    const read = (key: string) => {
      const b = feed!.bindings![key]!;
      const reading = readHttpRef(SOURCE[(b.ref as HttpRef).path], b.ref as HttpRef, READ_AT);
      return reading.ok ? (b.map ? applyValueMap(b.map, reading.value) : reading.value) : reading.message;
    };
    // P2 has tripped: the link is in the alarm tone, dotted for the status's blink, and labelled with its flow.
    expect([read('style.stroke'), read('style.dash'), read('style.strokeWidth'), read('label')]).toEqual(['alarm', 'dotted', 2, 0]);
  });

  it("draws markers, labels, a legend and lines with U-Board's own elements", () => {
    const doc = view(board(
      {
        m: { as: 'marker', each: 'pumps', show: 'state', shape: 'ring' },
        l: { as: 'label', of: 'pumps[P1]', show: 'flow' },
        key: { as: 'legend' },
      },
      {
        kind: 'canvas', size: [600, 300],
        place: { m: { P1: [10, 10, 120, 30], P2: [10, 50, 120, 30] }, l: [200, 10, 100, 24], key: [300, 260, 280, 30] },
        shapes: { pipe: { line: [[100, 100], [300, 100], [300, 200]], tone: 'info', width: 4 }, edge: { path: 'M 10 250 L 50 290' } },
      },
    ));
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(Object.keys(doc.elements ?? {}).sort()).toEqual(['ub-legend', 'ub-label', 'ub-marker', 'ub-shape-edge', 'ub-shape-pipe'].sort());
    expect(drawn(nodeOf(doc, 'm/P2').widget)).toEqual({ name: 'P2', tone: 'alarm', status: 'Tripped', note: '', shape: 'ring' });
    expect(drawn(nodeOf(doc, 'l').widget)).toEqual({ text: 41.5, tone: '' });
    expect(drawn(nodeOf(doc, 'key').widget)).toEqual({ items: [{ tone: 'ok', label: 'Running', glyph: '' }, { tone: 'alarm', label: 'Tripped', glyph: '' }] });
    // A line is a node boxed around its points, under the parts, drawn in the box's own coordinates.
    expect(doc.nodes[0]).toMatchObject({ id: 'shape.pipe', x: 96, y: 96, width: 208, height: 108, widget: { type: 'element:ub-shape-pipe' } });
    expect(doc.elements!['ub-shape-pipe']!.template).toContain('d="M4 4 L204 4 L204 104"');
    expect(doc.elements!['ub-shape-edge']!.template).toContain('d="M 3 3 L 43 43"');
  });

  it("draws the board's own elements, their props fixed or bound to a field, its status or its tone", () => {
    const b = board(
      { t: { as: 'element', element: 'tank', each: 'pumps', props: { name: 'Pump' }, bind: { level: 'flow', state: 'state.status', tone: 'state.tone' } } },
      { kind: 'canvas', size: [400, 200], place: { t: { P2: [0, 0, 100, 100] } } },
    );
    b.elements = { tank: { template: '<svg style="--l: {{level}}"><circle r="4"/></svg><b class="{{state}}" data-tone="{{tone}}">{{name}}</b>', props: { level: 'number', state: 'string', tone: 'string', name: 'string' } } };
    const doc = view(b);
    expect(doc.kind === 'canvas' && doc.elements?.tank).toEqual({
      render: 'template', template: b.elements.tank!.template,
      props: { type: 'object', properties: { level: { type: 'number' }, state: { type: 'string' }, tone: { type: 'string' }, name: { type: 'string' } } },
    });
    expect(drawn(nodeOf(doc, 't/P2').widget)).toEqual({ level: 0, state: 'tripped', tone: 'alarm', name: 'Pump' });
  });

  it('draws a group into the box it is placed in, its parts reading its item, and as a canvas cell in a grid', () => {
    const pump = {
      as: 'group', size: [200, 100],
      parts: { card: { as: 'status-card', show: ['state'] }, flow: { as: 'stat', show: 'flow' } },
      place: { card: [0, 0, 100, 100], flow: [100, 0, 100, 100] },
      shapes: { rim: { box: [0, 0, 200, 100] } },
      links: { l: { from: 'card', to: 'flow' } },
    };
    const parts = { pumps: { use: 'pump', each: 'pumps' } };
    const onCanvas = { ...board(parts, { kind: 'canvas', size: [800, 400], place: { pumps: { P1: [10, 10, 400, 200] } } }), presets: { pump } } as BoardV2;
    const doc = view(onCanvas);
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(doc.nodes.map(n => [n.id, n.x, n.y, n.width, n.height])).toEqual([['pumps/P1/card', 10, 10, 200, 200], ['pumps/P1/flow', 210, 10, 200, 200]]);
    expect(drawn(nodeOf(doc, 'pumps/P1/card').widget).data).toMatchObject({ title: 'P1', tone: 'ok' });
    expect(doc.decorations).toEqual([expect.objectContaining({ id: 'pumps/P1/shape.rim', x: 10, y: 10, width: 400, height: 200 })]);
    expect(doc.connectors).toEqual([expect.objectContaining({ id: 'pumps/P1/link.l', fromNodeId: 'pumps/P1/card', toNodeId: 'pumps/P1/flow' })]);

    const inGrid = view({ ...board(parts, { kind: 'grid', items: [['pumps', 6]] }), presets: { pump } } as BoardV2, { pumps: ['P1', 'P2'] });
    expect(inGrid.kind === 'grid' && inGrid.items.map(i => [i.id, i.span, 'canvas' in i && i.canvas.nodes.map(n => n.id)])).toEqual([
      ['pumps/P1', 6, ['pumps/P1/card', 'pumps/P1/flow']],
      ['pumps/P2', 6, ['pumps/P2/card', 'pumps/P2/flow']],
    ]);
  });

  it('stacks the items of a grid in a cell, the row beside it spanning them all', () => {
    const parts = { map: { as: 'stat', of: 'totals', show: 'output' }, a: { as: 'stat', of: 'totals', show: 'temp' }, b: { as: 'stat', of: 'totals', show: 'oee' }, c: { as: 'stat', of: 'totals', show: 'output' } };
    const doc = view(board(parts, { kind: 'grid', items: [['map', 8], { grid: ['a', 'b'], span: 4 }, ['c', 12]] }));
    expect(doc.kind === 'grid' && doc.items.map(i => [i.id, i.span, i.rowSpan])).toEqual([
      ['map', 8, 2], ['a', 4, undefined], ['b', 4, undefined], ['c', 12, undefined],
    ]);
    const side = board(parts, { kind: 'grid', items: [{ grid: [['a', 6], ['b', 6]], span: 4 }, ['map', 8]] });
    expect(() => toViewDocument(side)).toThrow(/side by side is not drawn yet/);
  });

  it('says what it does not draw yet, and where', () => {
    const b = board({ v: { as: 'marker', of: 'pumps[P1]', symbol: 'valve' } }, { kind: 'canvas', size: [100, 100], place: { v: [0, 0] } });
    expect(() => toViewDocument(b)).toThrow(new PictureError('/parts/v/symbol', 'a marker with a symbol is not drawn yet'));
  });
});
