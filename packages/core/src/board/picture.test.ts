import { describe, expect, it } from 'vitest';
import { checkSpec } from '@iyulab/u-widgets/tools';
import { applyValueMap, deriveValue, withItemFields, writeText } from '../adapter.js';
import { isHttpRef, readHttpRef, type HttpRef } from '../http-ref.js';
import type { Node, ViewDocument, Widget } from '../view-document.js';
import { PictureError, isDataPlace, isFlowPlace, keyReadsOf, keysIn, toViewDocument } from './picture.js';
import type { Board } from './types.js';
import { validateBoard } from './validate.js';

// What the source answers, by request path.
const SOURCE: Record<string, unknown> = {
  '/plant/pumps': {
    value: [
      { id: 'P1', line: 'L1', state: 'run', flow: 41.5, rpm: 1450, current: true, updatedAt: '2026-10-23T03:00:00Z' },
      { id: 'P2', line: 'L1', state: 'trip', flow: 0, rpm: 0, current: false, updatedAt: '2026-10-23T03:00:00Z' },
    ],
  },
  // Features, as a map service answers: what an item is about is under its "properties".
  '/plant/features': {
    value: [
      { id: 'q1', properties: { mag: 4.5, place: 'Alaska', state: 'run' } },
      { id: 'q2', properties: { place: 'Chile', state: 'trip' } },
    ],
  },
  // A list inside each item: the machines of a zone.
  '/plant/zones': {
    value: [
      { id: 'Z1', name: 'North', updatedAt: '2026-10-23T03:00:00Z', assets: [{ state: 'run' }, { state: 'trip' }] },
      { id: 'Z2', name: 'South', updatedAt: '2026-10-23T03:00:00Z', assets: [{ state: 'trip' }, { state: 'run' }] },
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
    // A `$` key is a reading beside the widget, not a prop of it.
    if (key.startsWith('$')) continue;
    const ref = binding.ref as HttpRef;
    const reading = readHttpRef(SOURCE[ref.path], ref, READ_AT);
    if (!reading.ok) throw new Error(`${key}: ${reading.message}`);
    const read = binding.derive ? deriveValue(binding.derive, reading.value) : reading.value;
    const mapped = binding.map ? applyValueMap(binding.map, read, READ_AT) : read;
    const gained = binding.itemFields ? withItemFields(binding.itemFields, mapped, READ_AT) : mapped;
    const value = binding.text !== undefined ? writeText(binding.text, gained) : gained;
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
const board = (parts: Board['parts'], layout: Board['layout']): Board => ({
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
function view(b: Board, keys: Record<string, string[]> = {}): ViewDocument {
  expect(validateBoard(b).filter(i => !i.hint)).toEqual([]);
  const doc = toViewDocument(b, { keysOf: d => keys[d] ?? [] });
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
    expect(doc).not.toHaveProperty('skin');
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

  it('marks a value with its status’s glyph where the widget draws a mark — none bound when no status names one', () => {
    const marked: Board = { ...board(
      {
        card: { as: 'status-card', of: 'pumps[P2]', show: ['state'] },
        rows: { as: 'stat-list', of: 'pumps[P2]', show: ['flow'], state: 'state' },
        list: { as: 'list', of: 'pumps', show: ['id'], state: 'state' },
      },
      { kind: 'grid', items: ['card', 'rows', 'list'] },
    ), statuses: { running: { tone: 'ok', label: 'Running' }, tripped: { tone: 'alarm', label: 'Tripped', glyph: '⚡' } } };
    const doc = view(marked);
    expect(drawn(nodeOf(doc, 'card').widget).data).toMatchObject({ tone: 'alarm', status: 'Tripped', glyph: '⚡' });
    expect(drawn(nodeOf(doc, 'rows').widget).data).toEqual([expect.objectContaining({ tone: 'alarm', glyph: '⚡' })]);
    const list = nodeOf(doc, 'list').widget;
    expect(list.props).toMatchObject({ mapping: { tone: 'state$tone', glyph: 'state$glyph' } });
    expect((drawn(list).data as Array<Record<string, unknown>>).map(r => [r['state$tone'], r['state$glyph']])).toEqual([['ok', ''], ['alarm', '⚡']]);

    const plain = view(board({ card: { as: 'status-card', of: 'pumps[P2]', show: ['state'] } }, { kind: 'grid', items: ['card'] }));
    expect(nodeOf(plain, 'card').widget.bindings!['data.glyph']).toBeUndefined();
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
    expect(rows.mapping).toEqual({ primary: 'id', secondary: 'state', tone: 'state$tone' });
    expect(rows.options).toEqual({ maxItems: 5 });
    expect((rows.data as Record<string, unknown>[]).map(r => r['state$tone'])).toEqual(['ok', 'alarm']);
    const table = drawn(nodeOf(doc, 'table').widget);
    expect(table.mapping).toEqual({ columns: [
      { field: 'id', label: 'id' }, { field: 'state', label: 'state', toneField: 'state$tone' }, { field: 'flow', label: 'Flow', unit: 'm³/h', format: 'number:1', align: 'right' },
    ] });
    expect((drawn(nodeOf(doc, 'bars').widget).data as Record<string, unknown>[]).map(r => [r.label, r.value])).toEqual([['P1', 41.5], ['P2', 0]]);
    expect((drawn(nodeOf(doc, 'cells').widget).data as Record<string, unknown>[]).map(r => [r.label, r.tone])).toEqual([['P1', 'ok'], ['P2', 'alarm']]);
    // a status's emphasis reaches the grid's cells (not a bar's row): the tripped pump's cell blinks
    expect((drawn(nodeOf(doc, 'cells').widget).data as Record<string, unknown>[]).map(r => r.emphasis)).toEqual(['', 'blink']);
    expect((drawn(nodeOf(doc, 'bars').widget).data as Record<string, unknown>[]).every(r => !('emphasis' in r))).toBe(true);
  });

  it('lays out a part per item in a grid, for the keys of its list', () => {
    const doc = view(board({ pump: { as: 'stat', each: 'pumps', show: 'flow' } }, { kind: 'grid', items: [['pump', 4]] }), { pumps: ['P1', 'P2'] });
    expect(doc.kind === 'grid' && doc.items.map(i => i.id)).toEqual(['pump/P1', 'pump/P2']);
    expect(drawn(nodeOf(doc, 'pump/P2').widget)).toEqual({ data: { label: 'Flow', value: 0, unit: 'm³/h' }, options: { format: 'number:1' } });
  });

  it('says which lists a grid needs the keys of, and how to read them — a canvas names its items and needs none', () => {
    const grid = board({ pump: { as: 'stat', each: 'pumps', show: 'flow' }, t: { as: 'stat', of: 'totals', show: 'temp' } }, { kind: 'grid', items: ['pump', 't'] });
    const reads = keyReadsOf(grid);
    expect(reads).toEqual([{ data: 'pumps', adapter: 'plant', ref: { path: '/plant/pumps', valuePath: '/value', maxAgeSeconds: 60 } }]);
    const read = readHttpRef(SOURCE[(reads[0]!.ref as HttpRef).path], reads[0]!.ref as HttpRef, READ_AT);
    expect(read.ok && keysIn(grid, 'pumps', read.value)).toEqual(['P1', 'P2']);
    expect(keysIn({ ...grid, data: { ...grid.data, pumps: { ...pumps, key: undefined } } }, 'pumps', [{}, {}])).toEqual(['0', '1']);
    expect(keysIn(grid, 'pumps', { not: 'a list' })).toEqual([]);

    expect(keyReadsOf(board({ m: { as: 'marker', each: 'pumps', show: 'state' } }, { kind: 'canvas', size: [100, 100], place: { m: { P1: [0, 0, 10, 10] } } }))).toEqual([]);
  });

  it('carries a board skin to the picture, on a canvas and on a grid', () => {
    const skin = { palette: { paper: '#fff', ink: '#111' }, frame: 'plate', radius: 0 } as const;
    const parts = { pump: { as: 'status-card', each: 'pumps', title: 'Pump {{key}}' } } as Board['parts'];
    const canvas = view({ ...board(parts, { kind: 'canvas', size: [800, 400], place: { pump: { P1: [10, 10, 220, 110] } } }), board: { skin } }, { pumps: ['P1'] });
    const grid = view({ ...board(parts, { kind: 'grid', items: [['pump', 4]] }), board: { skin } }, { pumps: ['P1'] });
    expect(canvas).toMatchObject({ kind: 'canvas', skin });
    expect(grid).toMatchObject({ kind: 'grid', skin });
  });

  it('draws a status card’s meter, subtitle and note from its item', () => {
    const doc = view(board(
      {
        P1: { as: 'status-card', of: 'pumps[P1]', show: ['state', 'rpm'], subtitle: 'Line {{line}}', meter: { field: 'flow', max: 60, form: 'ring' }, note: '{{rpm}} rpm' },
        P2: { as: 'status-card', of: 'pumps[P2]', show: 'state', meter: 'flow', note: 'Check the seal' },
      },
      { kind: 'canvas', size: [400, 200], place: { P1: [0, 0, 180, 160], P2: [200, 0, 180, 160] } },
    ));
    const p1 = nodeOf(doc, 'P1').widget;
    expect(p1.props).toMatchObject({ data: { meter: { value: 0, max: 60, unit: 'm³/h', format: 'number:1', form: 'ring' } } });
    expect(drawn(p1)).toEqual({
      data: {
        title: 'P1', subtitle: 'Line L1', tone: 'ok', status: 'Running', emphasis: '',
        readings: [{ label: 'rpm', value: 1450, format: 'number' }],
        meter: { value: 41.5, max: 60, unit: 'm³/h', format: 'number:1', form: 'ring' },
        note: '1,450 rpm',
      },
    });
    expect(drawn(nodeOf(doc, 'P2').widget)).toEqual({
      data: { title: 'P2', tone: 'alarm', status: 'Tripped', emphasis: 'blink', meter: { value: 0, unit: 'm³/h', format: 'number:1' }, note: 'Check the seal' },
    });
  });

  it('reads the ends of a status card’s meter from fields of its item, as a gauge’s max is', () => {
    const doc = view(board(
      {
        P1: { as: 'status-card', of: 'pumps[P1]', show: 'state', meter: { field: 'flow', max: 'rpm' } },
        P2: { as: 'status-card', of: 'pumps[P2]', show: 'state', meter: { field: 'flow', min: 5, max: 60 } },
      },
      { kind: 'canvas', size: [400, 200], place: { P1: [0, 0, 180, 160], P2: [200, 0, 180, 160] } },
    ));
    const p1 = nodeOf(doc, 'P1').widget;
    // A field's end is not written into the picture's props — it is the binding that fills it.
    expect(p1.props).toMatchObject({ data: { meter: { value: 0, unit: 'm³/h', format: 'number:1' } } });
    expect((p1.props as { data: { meter: Record<string, unknown> } }).data.meter).not.toHaveProperty('max');
    expect(Object.keys(p1.bindings ?? {})).toContain('data.meter.max');
    expect(drawn(p1)).toMatchObject({ data: { meter: { value: 41.5, max: 1450 } } });
    // Numbers stay written in the board and bind nothing.
    const p2 = nodeOf(doc, 'P2').widget;
    expect(p2.props).toMatchObject({ data: { meter: { min: 5, max: 60 } } });
    expect(Object.keys(p2.bindings ?? {})).not.toContain('data.meter.max');
  });

  it('marks one item out with a highlight field, read beside the widget and never written into it', () => {
    const doc = view(board(
      {
        pump: { as: 'status-card', each: 'pumps', title: 'Pump {{key}}', show: ['state'], highlight: 'current' },
        one: { as: 'stat', of: 'pumps[P2]', show: 'flow', highlight: 'current' },
        plain: { as: 'stat', of: 'pumps[P1]', show: 'flow' },
      },
      { kind: 'canvas', size: [800, 400], place: { pump: { P1: [0, 0, 180, 160], P2: [200, 0, 180, 160] }, one: [400, 0, 150, 100], plain: [400, 120, 150, 100] } },
    ), { pumps: ['P1', 'P2'] });
    const p1 = nodeOf(doc, 'pump/P1');
    expect(p1.highlight).toEqual({ from: '$highlight' });
    expect(p1.widget.bindings!['$highlight']!.ref).toMatchObject({ path: '/plant/pumps', valuePath: '/current' });
    // The widget's own props do not hold it — the reading is beside it.
    expect(JSON.stringify(p1.widget.props)).not.toContain('highlight');
    expect(nodeOf(doc, 'pump/P2').highlight).toEqual({ from: '$highlight' });
    expect(nodeOf(doc, 'one').highlight).toEqual({ from: '$highlight' });
    expect(nodeOf(doc, 'plain').highlight).toBeUndefined();
    expect(nodeOf(doc, 'plain').widget.bindings).not.toHaveProperty('$highlight');
  });

  it('refuses a highlight on a part that reads no single item', () => {
    const whole = board({ s: { as: 'stat', of: 'totals', show: 'temp', highlight: 'current' } }, { kind: 'canvas', size: [100, 100], place: { s: [0, 0] } });
    expect(validateBoard(whole)).toEqual([{ at: '/parts/s/highlight', message: '"highlight" marks one item — the part reads one: "of": "<data>[<key>]", or "each"' }]);
    expect(() => toViewDocument(whole)).toThrow(/"highlight" names a boolean field of one item/);
  });

  it('reads a request time and a fixed filter with the item', () => {
    const b = board({ p: { as: 'stat', of: 'air[중구]', show: 'pm10' } }, { kind: 'canvas', size: [100, 100], place: { p: [0, 0] } });
    b.data!.air = { from: 'gov', path: '/air?date={{now:yyyyMMdd}}', list: '/items', key: 'station', where: { item: 'PM10' }, now: { delay: 2400, step: 3600 }, zone: 'Asia/Seoul' };
    expect(validateBoard(b)).toEqual([]);
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
          feed: { from: 'P1', to: 'P2', of: 'pumps[P2]', show: 'state', label: '{{flow}}', arrow: 'end' },
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

  it('turns a link’s arrowheads by a field — its words through a map, its sign through bands — and keeps fixed ones', () => {
    const doc = view(board(
      { P1: { as: 'stat', of: 'pumps[P1]', show: 'flow' }, P2: { as: 'stat', of: 'pumps[P2]', show: 'flow' } },
      {
        kind: 'canvas', size: [600, 300],
        place: { P1: [10, 10, 150, 80], P2: [300, 10, 150, 80] },
        links: {
          byWord: { from: 'P1', to: 'P2', of: 'pumps[P2]', arrow: { field: 'state', map: { trip: 'start', '*': 'none' } } },
          bySign: { from: 'P1', to: 'P2', of: 'pumps[P1]', arrow: { field: 'flow', bands: ['start', 0, 'end'] } },
          fixed: { from: 'P2', to: 'P1', arrow: 'both' },
        },
      },
    ));
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    const [byWord, bySign, fixed] = doc.connectors;
    const arrow = (c: typeof byWord) => {
      const b = c!.bindings!['style.arrow']!;
      const reading = readHttpRef(SOURCE[(b.ref as HttpRef).path], b.ref as HttpRef, READ_AT);
      return reading.ok ? applyValueMap(b.map!, reading.value) : reading.message;
    };
    // Until a field answers, a link read for its direction draws no arrowhead.
    expect(byWord!.style!.arrow).toBe('none');
    expect([arrow(byWord), arrow(bySign)]).toEqual(['start', 'end']);
    expect(fixed!.style!.arrow).toBe('both');
    expect(fixed!.bindings).toBeUndefined();
  });

  it('draws two lines whose ids read the same once cleaned as two elements, each with its own path', () => {
    const doc = view(board({}, { kind: 'canvas', size: [100, 100], place: {}, shapes: { 'a.b': { line: [[0, 0], [10, 0]] }, 'a-b': { line: [[0, 0], [0, 10]] } } }));
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    const types = doc.nodes.map(n => n.widget.type);
    expect(new Set(types).size).toBe(2);
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
    expect(Object.keys(doc.elements ?? {}).sort()).toEqual(['u-board-legend', 'u-board-label', 'u-board-marker', 'u-board-shape-edge', 'u-board-shape-pipe'].sort());
    expect(drawn(nodeOf(doc, 'm/P2').widget)).toEqual({ name: 'P2', tone: 'alarm', status: 'Tripped', note: '', shape: 'ring' });
    expect(drawn(nodeOf(doc, 'l').widget)).toEqual({ text: 41.5, tone: '' });
    expect(drawn(nodeOf(doc, 'key').widget)).toEqual({ items: [{ tone: 'ok', label: 'Running', glyph: '' }, { tone: 'alarm', label: 'Tripped', glyph: '' }] });
    // A line is a node boxed around its points, under the parts, drawn in the box's own coordinates.
    expect(doc.nodes[0]).toMatchObject({ id: 'shape.pipe', x: 96, y: 96, width: 208, height: 108, widget: { type: 'element:u-board-shape-pipe' } });
    expect(doc.elements!['u-board-shape-pipe']!.template).toContain('d="M4 4 L204 4 L204 104"');
    expect(doc.elements!['u-board-shape-edge']!.template).toContain('d="M 3 3 L 43 43"');
  });

  it('gives each item of a list an element reads the meaning of its fields — words under their own name, tone beside', () => {
    const b = board(
      { hours: { as: 'element', element: 'hours', of: 'hourly', bind: { items: 'value' } } },
      { kind: 'canvas', size: [400, 200], place: { hours: [0, 0, 400, 200] } },
    );
    b.data!.hourly = {
      from: 'plant', path: '/plant/hourly',
      fields: { value: { items: { hour: { names: { '09:00': 'Nine' } }, count: { state: ['running', 125, 'tripped'] }, flow: { at: '/count' } } } },
    };
    b.elements = { hours: { template: '<ul>{{#items}}<li class="{{count$tone}}" title="{{count$status}}">{{hour}} {{flow}}</li>{{/items}}</ul>', props: { items: 'list' } } };
    const doc = view(b);
    expect(drawn(nodeOf(doc, 'hours').widget)).toEqual({
      items: [
        { hour: 'Nine', count: 120, flow: 120, count$tone: 'ok', count$status: 'Running', count$emphasis: '' },
        { hour: '10:00', count: 131, flow: 131, count$tone: 'alarm', count$status: 'Tripped', count$emphasis: 'blink' },
      ],
    });
  });

  it('shows a field the read computes from the items of its list — and lets it raise a status like any reading', () => {
    const b = board(
      { down: { as: 'stat', of: 'pumps', show: 'tripped' }, mean: { as: 'stat', of: 'pumps', show: 'meanFlow' } },
      { kind: 'canvas', size: [400, 200], place: { down: [0, 0, 100, 100], mean: [100, 0, 100, 100] } },
    );
    b.data!.pumps = { ...pumps, fields: { ...pumps.fields, tripped: { derive: { op: 'count', where: { state: 'trip' } }, state: ['running', 1, 'tripped'] }, meanFlow: { derive: { op: 'avg', field: 'flow' }, digits: 1 } } } as never;
    const doc = view(b);
    const down = nodeOf(doc, 'down').widget;
    expect(down.bindings!['data.value']).toMatchObject({ derive: { op: 'count', where: { state: 'trip' } }, ref: { path: '/plant/pumps' } });
    expect(drawn(down).data).toMatchObject({ value: 1, tone: 'alarm' });
    expect(drawn(nodeOf(doc, 'mean').widget).data).toMatchObject({ value: 20.75 });
    // Shown from one item it would have no list to compute from.
    const one = board({ d: { as: 'stat', of: 'pumps[P1]', show: 'tripped' } }, { kind: 'canvas', size: [100, 100], place: { d: [0, 0] } });
    one.data!.pumps = b.data!.pumps;
    expect(() => toViewDocument(one)).toThrow(/is computed from the items of "pumps"/);
  });

  it('draws a part per item of a list inside the item a group is made for, each reading its own place in the list', () => {
    const zone = {
      as: 'group', size: [200, 100],
      parts: { name: { as: 'stat', show: 'name' }, machine: { as: 'status-card', each: '/assets', show: ['state'] } },
      place: { name: [0, 0, 200, 20], machine: { '0': [0, 20, 100, 80], '1': [100, 20, 100, 80] } },
    };
    const b = { ...board({ zones: { use: 'zone', each: 'zones' } }, { kind: 'canvas', size: [400, 300], place: { zones: { Z1: [0, 0, 200, 100], Z2: [0, 150, 200, 100] } } }), presets: { zone } } as Board;
    b.data!.zones = { from: 'plant', path: '/plant/zones', list: '/value', key: 'id', time: 'updatedAt', fresh: 60, fields: { name: {}, assets: { items: { state: { state: { run: 'running', trip: 'tripped', '*': 'off' } } } } } };
    const doc = view(b);
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(doc.nodes.map(n => n.id)).toEqual(['zones/Z1/name', 'zones/Z1/machine/0', 'zones/Z1/machine/1', 'zones/Z2/name', 'zones/Z2/machine/0', 'zones/Z2/machine/1']);
    // Each reads the one answer: the zone, then the machine in it by its place — never a request of its own.
    expect(nodeOf(doc, 'zones/Z1/machine/1').widget.bindings!['data.tone']).toMatchObject({ ref: { path: '/plant/zones', item: { list: '/value', where: { id: 'Z1' } }, valuePath: '/assets/1/state', maxAgeSeconds: 60 } });
    expect(drawn(nodeOf(doc, 'zones/Z1/machine/0').widget).data).toMatchObject({ tone: 'ok' });
    expect(drawn(nodeOf(doc, 'zones/Z1/machine/1').widget).data).toMatchObject({ tone: 'alarm' });
    expect(drawn(nodeOf(doc, 'zones/Z2/machine/0').widget).data).toMatchObject({ tone: 'alarm' });
  });

  it('places the parts made per item of a list inside the item by the fields of those items, and says where it cannot', () => {
    const zone = {
      as: 'group', size: [200, 100],
      parts: { machine: { as: 'status-card', each: '/assets', show: ['state'] } },
      place: { machine: { at: ['x', 'y'], frame: [0, 0, 200, 100], size: [40, 40] } },
    };
    const b = { ...board({ zones: { use: 'zone', each: 'zones' } }, { kind: 'canvas', size: [400, 300], place: { zones: { Z1: [0, 0, 200, 100] } } }), presets: { zone } } as Board;
    b.data!.zones = { from: 'plant', path: '/plant/zones', list: '/value', key: 'id', fields: { assets: { items: { x: {}, y: {}, state: { state: { run: 'running' } } } } } };
    const rows = [{ id: 'Z1', assets: [{ x: 50, y: 20, state: 'run' }, { x: 150, y: 70, state: 'run' }, { state: 'run' }] }];
    const doc = toViewDocument(b, { rowsOf: () => rows });
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(doc.nodes.map(n => [n.id, n.x, n.y])).toEqual([['zones/Z1/machine/0', 30, 0], ['zones/Z1/machine/1', 130, 50]]);
    const outside = { ...board({ m: { as: 'status-card', each: '/assets', show: ['state'] } }, { kind: 'canvas', size: [100, 100], place: { m: { '0': [0, 0] } } }) } as Board;
    expect(validateBoard(outside).map(i => i.message).join(' ')).toContain('is for a part inside a group');
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
    const onCanvas = { ...board(parts, { kind: 'canvas', size: [800, 400], place: { pumps: { P1: [10, 10, 400, 200] } } }), presets: { pump } } as Board;
    const doc = view(onCanvas);
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    expect(doc.nodes.map(n => [n.id, n.x, n.y, n.width, n.height])).toEqual([['pumps/P1/card', 10, 10, 200, 200], ['pumps/P1/flow', 210, 10, 200, 200]]);
    expect(drawn(nodeOf(doc, 'pumps/P1/card').widget).data).toMatchObject({ title: 'P1', tone: 'ok' });
    expect(doc.decorations).toEqual([expect.objectContaining({ id: 'pumps/P1/shape.rim', x: 10, y: 10, width: 400, height: 200 })]);
    expect(doc.connectors).toEqual([expect.objectContaining({ id: 'pumps/P1/link.l', fromNodeId: 'pumps/P1/card', toNodeId: 'pumps/P1/flow' })]);

    const inGrid = view({ ...board(parts, { kind: 'grid', items: [['pumps', 6]] }), presets: { pump } } as Board, { pumps: ['P1', 'P2'] });
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
  });

  it('draws nothing for a grid in a cell that holds only an each part with no items — it is not an error', () => {
    const parts = { map: { as: 'stat', of: 'totals', show: 'output' }, pumps: { as: 'stat', each: 'pumps', title: '{{key}}', show: 'state' } };
    const layout = { kind: 'grid', items: [['map', 8], { grid: ['pumps'], span: 4 }] } as Board['layout'];
    const empty = view(board(parts, layout), { pumps: [] });
    expect(empty.kind === 'grid' && empty.items.map(i => [i.id, i.span])).toEqual([['map', 8]]);
    // the same board when the list has items: the cell fills with them
    const filled = view(board(parts, layout), { pumps: ['P1', 'P2'] });
    expect(filled.kind === 'grid' && filled.items.map(i => i.id)).toEqual(['map', 'pumps/P1', 'pumps/P2']);
  });

  it('lays the items of a grid in a cell side by side, in rows that fill the cell', () => {
    const parts = {
      map: { as: 'stat', of: 'totals', show: 'output' }, a: { as: 'stat', of: 'totals', show: 'temp' },
      b: { as: 'stat', of: 'totals', show: 'oee' }, c: { as: 'stat', of: 'totals', show: 'output' },
    };
    const doc = view(board(parts, { kind: 'grid', items: [{ grid: [['a', 6], ['b', 6], 'c'], span: 4 }, ['map', 8]] }));
    expect(doc.kind === 'grid' && doc.items.map(i => [i.id, i.span, i.rowSpan])).toEqual([
      ['a', 2, undefined], ['b', 2, undefined], ['map', 8, 2], ['c', 4, undefined],
    ]);

    const third = board(parts, { kind: 'grid', items: [{ grid: [['a', 4], ['b', 4], ['c', 4]], span: 6 }, ['map', 6]] });
    const thirds = view(third);
    expect(thirds.kind === 'grid' && thirds.items.map(i => i.span)).toEqual([2, 2, 2, 6]);

    const short = board(parts, { kind: 'grid', items: [{ grid: [['a', 6], 'b'], span: 4 }, ['map', 8]] });
    expect(() => toViewDocument(short)).toThrow(new PictureError('/layout/items', 'each row of a grid in a cell fills the cell — a row takes 6 of 12'));
    const split = board(parts, { kind: 'grid', items: [{ grid: [['a', 4], ['b', 8]], span: 4 }, ['map', 8]] });
    expect(() => toViewDocument(split)).toThrow(/takes items of whole columns — 4 of 12 is 1\.33 of them/);
  });

  it('writes a title of words and fields from the item it reads, the fields in their words and digits', () => {
    const b = board(
      { p: { as: 'status-card', each: 'pumps', title: 'Pump {{key}} · {{flow}} m³/h · {{mode}}', show: ['state'] } },
      { kind: 'canvas', size: [400, 200], place: { p: { P1: [0, 0, 200, 100] } } },
    );
    (b.data!.pumps as { fields: Record<string, unknown> }).fields = { ...pumps.fields, mode: { names: { run: 'auto', '*': 'manual' }, at: '/state' } };
    const doc = view(b);
    const title = nodeOf(doc, 'p/P1').widget.bindings!['data.title']!;
    expect(title.text).toBe('Pump P1 · {{flow | fixed:1}} m³/h · {{mode$name}}');
    expect(drawn(nodeOf(doc, 'p/P1').widget).data).toMatchObject({ title: 'Pump P1 · 41.5 m³/h · auto' });
  });

  describe('a field that lives deeper in an item than its top', () => {
    const features = (parts: Board['parts'], place: Record<string, unknown>): Board => {
      const b = board(parts, { kind: 'canvas', size: [400, 200], place: place as never });
      b.data!.quakes = {
        from: 'plant', path: '/plant/features', list: '/value', key: 'id',
        fields: {
          place: { at: '/properties/place' },
          mag: { at: '/properties/mag', digits: 1 },
          state: { at: '/properties/state', state: { run: 'running', trip: 'tripped', '*': 'off' } },
        },
      };
      return b;
    };

    it('is written into a text by its pointer, an item without it leaving the hole empty', () => {
      const b = features(
        { q: { as: 'status-card', each: 'quakes', title: 'M{{mag}} · {{place}}', show: ['state'] } },
        { q: { q1: [0, 0, 200, 100], q2: [200, 0, 200, 100] } },
      );
      const doc = view(b, { quakes: ['q1', 'q2'] });
      const title = nodeOf(doc, 'q/q1').widget.bindings!['data.title']!;
      expect(title.text).toBe('M{{mag | fixed:1}} · {{place}}');
      expect(title.itemFields).toEqual({ mag: { from: '/properties/mag' }, place: { from: '/properties/place' } });
      expect(drawn(nodeOf(doc, 'q/q1').widget).data).toMatchObject({ title: 'M4.5 · Alaska' });
      expect(drawn(nodeOf(doc, 'q/q2').widget).data).toMatchObject({ title: 'M · Chile' });
    });

    it("is a table's column, a list's row and a state, read where it lives", () => {
      const b = features(
        { t: { as: 'table', of: 'quakes', show: ['place', 'mag', 'state'] }, l: { as: 'list', of: 'quakes', show: ['place'], time: 'mag', state: 'state' } },
        { t: [0, 0], l: [200, 0] },
      );
      const doc = view(b);
      const table = drawn(nodeOf(doc, 't').widget);
      expect(table.data).toEqual([
        expect.objectContaining({ id: 'q1', place: 'Alaska', mag: 4.5, state$tone: 'ok' }),
        expect.objectContaining({ id: 'q2', place: 'Chile', state$tone: 'alarm' }),
      ]);
      expect((table.mapping as { columns: { field: string }[] }).columns.map(c => c.field)).toEqual(['place', 'mag', 'state']);
      expect((drawn(nodeOf(doc, 'l').widget).mapping as Record<string, string>)).toMatchObject({ primary: 'place', time: 'mag' });
    });
  });

  it("draws a marker as one of the board's symbols, the one a field names", () => {
    const b = board(
      { m: { as: 'marker', each: 'pumps', symbol: '{{kind}}', show: 'state', note: '{{rpm}} rpm' } },
      { kind: 'canvas', size: [400, 200], place: { m: { P1: [0, 0, 120, 60] } } },
    );
    // The source's line names the drawing, in the board's words for it.
    (b.data!.pumps as { fields: Record<string, unknown> }).fields = { ...pumps.fields, kind: { at: '/line', names: { L1: 'pump-a', '*': 'pump-b' } } };
    b.symbols = { 'pump-a': { viewBox: '0 0 24 24', path: 'M2 2h20v20H2z' }, 'pump-b': { path: 'M2 2h10v10H2z' } };
    const doc = view(b);
    expect(doc.kind === 'canvas' && doc.symbols).toEqual({ 'pump-a': { viewBox: '0 0 24 24', markup: '<path d="M2 2h20v20H2z"/>' }, 'pump-b': { markup: '<path d="M2 2h10v10H2z"/>' } });
    expect(drawn(nodeOf(doc, 'm/P1').widget)).toEqual({ name: 'P1', tone: 'ok', status: 'Running', note: '1,450 rpm', symbol: 'pump-a' });
  });

  it('reads the whole of a list kept by "where" as the items it keeps', () => {
    const b = board({ t: { as: 'table', of: 'air' } }, { kind: 'canvas', size: [100, 100], place: { t: [0, 0] } });
    b.data!.air = { from: 'gov', path: '/air', list: '/items', key: 'station', where: { item: 'PM10' }, fresh: 5400 };
    expect(validateBoard(b)).toEqual([]);
    const refs = Object.values(nodeOf(toViewDocument(b), 't').widget.bindings!).map(binding => binding.ref);
    expect(refs).toEqual([{ path: '/air', items: { list: '/items', where: { item: 'PM10' } }, maxAgeSeconds: 5400 }]);
    expect(refs.every(isHttpRef)).toBe(true);
  });

  it('says what one value of every item kept by "where" would be, and where', () => {
    const b = board({ s: { as: 'stat', of: 'air', show: 'pm10' } }, { kind: 'canvas', size: [100, 100], place: { s: [0, 0] } });
    b.data!.air = { from: 'gov', path: '/air', list: '/items', key: 'station', where: { item: 'PM10' } };
    expect(() => toViewDocument(b)).toThrow(new PictureError('/parts/s', '"pm10" of every item of "air" is not one value — read the list, or a field of one item'));
  });
});

describe('the picture model of a v2 board — triggers', () => {
  const parts = {
    card: { as: 'status-card', of: 'pumps[P1]', show: ['state', 'flow'] },
    pump: { as: 'status-card', each: 'pumps', show: ['state'] },
  } as Board['parts'];
  const layout = { kind: 'canvas', size: [800, 400], place: { card: [10, 10, 200, 100], pump: { P1: [220, 10, 200, 100], P2: [430, 10, 200, 100] } } } as Board['layout'];

  it('names each part’s status on a board with no triggers — its own state, else the first field it shows with one', () => {
    const b = board(
      { ...parts, flow: { as: 'stat', of: 'pumps[P2]', show: 'state' }, plain: { as: 'stat', of: 'pumps[P2]', show: 'flow' } } as Board['parts'],
      { ...layout, place: { ...(layout as { place: object }).place, flow: [10, 200, 120, 60], plain: [150, 200, 120, 60] } } as Board['layout'],
    );
    const doc = view(b, { pumps: ['P1', 'P2'] });
    expect(doc.triggers).toBeUndefined();
    expect(nodeOf(doc, 'card').states).toEqual({ from: 'data.tone', map: { values: { run: 'running', trip: 'tripped' }, otherwise: 'off' } });
    expect(nodeOf(doc, 'pump/P2').states?.from).toBe('data.tone');
    expect(nodeOf(doc, 'flow').states?.map).toEqual({ values: { run: 'running', trip: 'tripped' }, otherwise: 'off' });
    // A field with no status rule names no state.
    expect(nodeOf(doc, 'plain').states).toBeUndefined();
  });

  it('runs a board’s triggers on the nodes its parts are drawn as, naming a part’s status from its state field', () => {
    const b: Board = {
      ...board(parts, layout),
      triggers: [
        { on: { event: 'click', part: 'card' }, when: { part: 'card', status: 'tripped' }, do: [{ action: 'emit', name: 'card' }, { action: 'open-link', url: '/x?p={{part}}&s={{status}}' }] },
        { on: { event: 'enter', part: 'pump/P2', status: 'tripped' }, do: [{ action: 'focus', part: 'pump/P2' }] },
        { on: { event: 'click', part: 'pump/P9' }, do: [{ action: 'emit', name: 'gone' }] },
      ],
    };
    const doc = view(b, { pumps: ['P1', 'P2'] });
    expect(doc.triggers).toEqual([
      { on: { event: 'click', node: 'card' }, when: { node: 'card', state: 'tripped' }, do: [{ action: 'emit', name: 'card' }, { action: 'open-link', url: '/x?p={{node}}&s={{state}}' }] },
      { on: { event: 'enter', node: 'pump/P2', state: 'tripped' }, do: [{ action: 'focus', node: 'pump/P2' }] },
    ]);
    // The status a trigger reads is the card's state, named by the board's statuses from the raw value.
    expect(nodeOf(doc, 'card').states).toEqual({ from: 'data.tone', map: { values: { run: 'running', trip: 'tripped' }, otherwise: 'off' } });
    expect(nodeOf(doc, 'pump/P2').states?.from).toBe('data.tone');
    // A part no trigger reads still names its status — the board state says what every part is in.
    expect(nodeOf(doc, 'pump/P1').states?.from).toBe('data.tone');
    // A trigger on an item its data does not have now (P9) is left out; one in a grid is drawn only with the items it has.
    const grid: Board = { ...b, layout: { kind: 'grid', items: ['card', 'pump'] } };
    expect(toViewDocument(grid, { keysOf: () => [] }).triggers).toEqual([doc.triggers![0]]);
    expect(toViewDocument(grid, { keysOf: () => ['P2'] }).triggers).toEqual(doc.triggers);
  });

  it('refuses a trigger on a status a part does not show', () => {
    const b: Board = { ...board(parts, layout), triggers: [{ on: { event: 'enter', part: 'card', field: 'rpm', status: 'tripped' }, do: [{ action: 'emit', name: 'x' }] }] };
    expect(() => toViewDocument(b, { keysOf: () => ['P1'] })).toThrow(new PictureError('/triggers/0/on/field', '"card" does not show "rpm"\'s status — a trigger reads a status the part shows'));
  });
});

describe('items placed by their own fields (a canvas)', () => {
  const quakes = { from: 'plant', path: '/plant/quakes', list: '/features', key: 'id' } as const;
  const world = (place: unknown, parts: Board['parts'] = { quake: { as: 'marker', each: 'quakes', title: '{{key}}' } }): Board => {
    const base = board(parts, { kind: 'canvas', size: [360, 180], place: { quake: place as never } });
    return { ...base, data: { ...base.data, quakes } };
  };
  const rows = [
    { id: 'q1', lon: 0, lat: 0 },
    { id: 'q2', lon: -180, lat: 90 },
    { id: 'q3', lon: 90, lat: -45 },
    { id: 'q4', lon: 'east', lat: 10 },
    { id: 'q5', lon: 200, lat: 10 },
    { id: 'q6', lat: 10 },
  ];
  const draw = (b: Board, list: unknown[] = rows) => {
    const unplaced: Array<[string, number]> = [];
    const doc = toViewDocument(b, { rowsOf: () => list, onUnplaced: (part, count) => unplaced.push([part, count]) });
    return { doc, unplaced };
  };
  const centre = (n: Node) => [n.x + (n.width ?? 160) / 2, n.y + (n.height ?? 100) / 2];

  it('puts each item at its fields’ place in the frame — linearly, its box centred there', () => {
    const b = world({ at: ['lon', 'lat'], frame: [-180, 90, 180, -90], size: [10, 10] });
    expect(validateBoard(b).filter(i => !i.hint)).toEqual([]);
    const { doc } = draw(b);
    expect(centre(nodeOf(doc, 'quake/q1'))).toEqual([180, 90]);
    expect(centre(nodeOf(doc, 'quake/q2'))).toEqual([0, 0]);
    expect(centre(nodeOf(doc, 'quake/q3'))).toEqual([270, 135]);
    expect(nodeOf(doc, 'quake/q1')).toMatchObject({ width: 10, height: 10 });
  });

  it('puts the point of the box an anchor names on the item’s place — the middle of an edge, not only the middle', () => {
    const at = (anchor: string) => {
      const b = world({ at: ['lon', 'lat'], frame: [-180, 90, 180, -90], size: [20, 10], anchor });
      expect(validateBoard(b).filter(i => !i.hint)).toEqual([]);
      const n = nodeOf(draw(b, [{ id: 'q', lon: 0, lat: 0 }]).doc, 'quake/q');
      return [n.x, n.y];
    };
    // The place is (180, 90) on this canvas: a box 20 wide and 10 high.
    expect(at('center')).toEqual([170, 85]);
    expect(at('left')).toEqual([180, 85]);
    expect(at('right')).toEqual([160, 85]);
    expect(at('top')).toEqual([170, 90]);
    expect(at('bottom')).toEqual([170, 80]);
    expect(validateBoard(world({ at: ['lon', 'lat'], anchor: 'middle' })).map(i => i.message)).toContain('"anchor" is the point of the box the position is: center, left, right, top or bottom');
  });

  it('takes the canvas’s own coordinates when no frame is given, and the default box when no size is', () => {
    const { doc } = draw(world({ at: ['x', 'y'] }), [{ id: 'a', x: 100, y: 50 }]);
    const n = nodeOf(doc, 'quake/a');
    expect(centre(n)).toEqual([100, 50]);
    expect(n.width).toBeUndefined();
  });

  it('leaves out an item with no number in a field or outside the frame, and tells how many', () => {
    const { doc, unplaced } = draw(world({ at: ['lon', 'lat'], frame: [-180, 90, 180, -90] }));
    expect(doc.kind === 'canvas' && doc.nodes.map(n => n.id)).toEqual(['quake/q1', 'quake/q2', 'quake/q3']);
    expect(unplaced).toEqual([['quake', 3]]);
    expect(draw(world({ at: ['lon', 'lat'], frame: [-180, 90, 180, -90] }), rows.slice(0, 3)).unplaced).toEqual([]);
  });

  it('reads a field where it lives in an item — a feature’s coordinates are deep in it', () => {
    const b = world({ at: ['lon', 'lat'], frame: [-180, 90, 180, -90], size: [10, 10] });
    const deep = { ...b, data: { ...b.data, quakes: { ...quakes, fields: { lon: { at: '/geometry/coordinates/0' }, lat: { at: '/geometry/coordinates/1' } } } } } as Board;
    expect(validateBoard(deep).filter(i => !i.hint)).toEqual([]);
    const { doc } = draw(deep, [{ id: 'f1', geometry: { coordinates: [90, -45, 10] } }, { id: 'f2', geometry: null }]);
    expect(centre(nodeOf(doc, 'quake/f1'))).toEqual([270, 135]);
    expect(doc.kind === 'canvas' && doc.nodes.map(n => n.id)).toEqual(['quake/f1']);
  });

  it('needs to be given the items, and asks for them as a grid asks for keys', () => {
    const b = world({ at: ['lon', 'lat'] });
    expect(() => toViewDocument(b)).toThrow(PictureError);
    expect(keyReadsOf(b).map(r => r.data)).toEqual(['quakes']);
  });

  it('is told from a place by hand by its "at": a list of names', () => {
    expect(isDataPlace({ at: ['a', 'b'] })).toBe(true);
    expect(isDataPlace({ at: [1, 2] })).toBe(false);
    expect(isDataPlace({ P1: [0, 0] })).toBe(false);
    expect(isDataPlace([1, 2])).toBe(false);
  });

  it('is refused for what it cannot place: other keys, a frame without width, no key', () => {
    const issues = (place: unknown, data = quakes as Record<string, unknown>) => {
      const base = world(place);
      return validateBoard({ ...base, data: { ...base.data, quakes: data as never } }).filter(i => !i.hint).map(i => i.at);
    };
    expect(issues({ at: ['lon', 'lat'], q1: [1, 2] })).toEqual(['/layout/place/quake/q1']);
    expect(issues({ at: ['lon'] })).toEqual(['/layout/place/quake/at']);
    expect(issues({ at: ['lon', 'lat'], frame: [0, 0, 0, 5] })).toEqual(['/layout/place/quake/frame']);
    expect(issues({ at: ['lon', 'lat'], size: [0, 4] })).toEqual(['/layout/place/quake/size']);
    expect(issues({ at: ['lon', 'lat'] }, { from: 'plant', path: '/plant/quakes', list: '/features' })).toEqual(['/layout/place/quake']);
  });
});

describe('triggers on every item of an each part', () => {
  const parts = { pump: { as: 'status-card', each: 'pumps', title: '{{key}}', show: ['state', 'flow'] }, total: { as: 'stat', of: 'totals', show: 'temp' } } as const;
  const withTriggers = (triggers: NonNullable<Board['triggers']>): Board => {
    const b = board(parts as never, { kind: 'grid', items: ['pump', 'total'] });
    return { ...b, data: { ...b.data, pumps: { ...pumps, fields: { ...pumps.fields, line: {} } } }, triggers };
  };
  const rows = [{ id: 'P1', line: 'L 1', state: 'run' }, { id: 'P2', line: null, state: 'trip' }, { id: 'P3', line: 'L3', state: 'run' }];
  const draw = (b: Board) => toViewDocument(b, { keysOf: () => rows.map(r => r.id), rowsOf: () => rows });

  it('runs one trigger per item, each opening the link of its own item', () => {
    const doc = draw(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: '/pumps/{{key}}?line={{line}}&from={{part}}' }] }]));
    expect(doc.triggers).toEqual([
      { on: { event: 'click', node: 'pump/P1' }, do: [{ action: 'open-link', url: '/pumps/P1?line=L%201&from={{node}}' }] },
      // An item with no value for the field cannot make the link: no trigger for it.
      { on: { event: 'click', node: 'pump/P3' }, do: [{ action: 'open-link', url: '/pumps/P3?line=L3&from={{node}}' }] },
    ]);
  });

  it('puts only the item’s key in a link that names no field, so it needs no items', () => {
    const b = withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: '/pumps/{{key}}' }] }]);
    expect(toViewDocument(b, { keysOf: () => ['A B', 'C'] }).triggers!.map(t => (t.do[0] as { url: string }).url)).toEqual(['/pumps/A%20B', '/pumps/C']);
    expect(() => toViewDocument(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: '/p?l={{line}}' }] }]), { keysOf: () => ['P1'] })).toThrow(PictureError);
  });

  it('reacts to an item entering a status, and names the items one by one for a trigger that names one', () => {
    const doc = draw(withTriggers([
      { on: { event: 'enter', part: 'pump', status: 'tripped' }, do: [{ action: 'emit', name: 'tripped' }] },
      { on: { event: 'click', part: 'pump/P1' }, do: [{ action: 'open-link', url: '/pumps/{{key}}' }] },
    ]));
    expect(doc.triggers!.map(t => t.on)).toEqual([
      { event: 'enter', node: 'pump/P1', state: 'tripped' },
      { event: 'enter', node: 'pump/P2', state: 'tripped' },
      { event: 'enter', node: 'pump/P3', state: 'tripped' },
      { event: 'click', node: 'pump/P1' },
    ]);
    expect(doc.triggers![3]!.do).toEqual([{ action: 'open-link', url: '/pumps/P1' }]);
  });

  it('is refused where an item has no meaning, and where a value would choose the address', () => {
    const issues = (b: Board) => validateBoard(b).filter(i => !i.hint).map(i => i.at);
    expect(issues(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: '/pumps/{{key}}' }] }]))).toEqual([]);
    // `focus` and a status condition name one thing — an item by its id.
    expect(issues(withTriggers([{ on: { event: 'click', part: 'total' }, do: [{ action: 'focus', part: 'pump' }] }]))).toEqual(['/triggers/0/do/0/part']);
    expect(issues(withTriggers([{ on: { event: 'open' }, when: { part: 'pump', status: 'running' }, do: [{ action: 'emit', name: 'x' }] }]))).toEqual(['/triggers/0/when/part']);
    // An item’s hole needs an item, and never stands in the address.
    expect(issues(withTriggers([{ on: { event: 'click', part: 'total' }, do: [{ action: 'open-link', url: '/x/{{key}}' }] }]))).toEqual(['/triggers/0/do/0/url']);
    expect(issues(withTriggers([{ on: { event: 'open' }, do: [{ action: 'open-link', url: '/x/{{line}}' }] }]))).toEqual(['/triggers/0/do/0/url']);
    expect(issues(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: 'https://x.example.com@{{line}}.example.net/a' }] }]))).toEqual(['/triggers/0/do/0/url']);
    expect(issues(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: 'https://{{key}}@x.example.com/a' }] }]))).toEqual(['/triggers/0/do/0/url']);
    expect(issues(withTriggers([{ on: { event: 'click', part: 'pump' }, do: [{ action: 'open-link', url: 'https://x.example.com/a/{{key}}?l={{line}}#{{line}}' }] }]))).toEqual([]);
  });
});

describe('items placed by a rule', () => {
  const rows = [
    { id: 'P1', line: 'L1' }, { id: 'P2', line: 'L2' }, { id: 'P3', line: 'L1' }, { id: 'P4', line: 'L2' }, { id: 'P5', line: 'L1' },
  ];
  const parts = { pump: { as: 'status-card', each: 'pumps', title: '{{key}}', show: ['state'] } } as const;
  const withPlace = (place: unknown): Board => board(parts as never, { kind: 'canvas', size: [600, 400], place: { pump: place } } as never);
  const draw = (b: Board, extra: Parameters<typeof toViewDocument>[1] = {}) => {
    const doc = toViewDocument(b, { rowsOf: () => rows, ...extra });
    if (doc.kind !== 'canvas') throw new Error('a canvas');
    return doc;
  };
  const boxOf = (n: { id: string; x: number; y: number; width?: number; height?: number }) => [n.id, n.x, n.y, n.width, n.height];

  it('flows the items in columns, in the order the data gives them', () => {
    const b = withPlace({ flow: { at: [10, 20], cell: [100, 50], gap: [5, 6], columns: 2 } });
    expect(validateBoard(b)).toEqual([]);
    // A rule needs the items themselves, so a viewer or a server reads the list for it as it does for a place by fields.
    expect(keyReadsOf(b).map(read => read.data)).toEqual(['pumps']);
    expect(draw(b).nodes.map(boxOf)).toEqual([
      ['pump/P1', 10, 20, 100, 50], ['pump/P2', 115, 20, 100, 50], ['pump/P3', 10, 76, 100, 50], ['pump/P4', 115, 76, 100, 50], ['pump/P5', 10, 132, 100, 50],
    ]);
  });

  it('groups the items by a field into boxes of one size, the items flowing inside each', () => {
    const b = withPlace({
      by: 'line',
      boxes: { at: [0, 0], gap: [10, 10], columns: 2, label: 'Line {{key}}' },
      flow: { cell: [100, 40], gap: [4, 4], columns: 2, pad: [8, 24] },
    });
    expect(validateBoard(b)).toEqual([]);
    const doc = draw(b);
    // The biggest group has three items: two rows of two → a box 16 + 200 + 4 wide, 24 + 80 + 4 + 8 high.
    expect(doc.nodes.map(boxOf)).toEqual([
      ['pump/P1', 8, 24, 100, 40], ['pump/P3', 112, 24, 100, 40], ['pump/P5', 8, 68, 100, 40],
      ['pump/P2', 238, 24, 100, 40], ['pump/P4', 342, 24, 100, 40],
    ]);
    expect(doc.decorations?.map(d => d.type === 'rect' ? [d.x, d.y, d.width, d.height, d.label] : null)).toEqual([[0, 0, 220, 116, 'Line L1'], [230, 0, 220, 116, 'Line L2']]);
  });

  it('lets an item placed by a rule also be marked out, follow the clock and read the end of its meter from a field', () => {
    const b = board(
      { pump: { as: 'status-card', each: 'pumps', title: '{{key}}', show: ['age'], meter: { field: 'flow', max: 'rpm' }, highlight: 'current' } } as never,
      {
        kind: 'canvas', size: [600, 400],
        place: { pump: { by: 'line', boxes: { at: [0, 0], gap: [10, 10], columns: 2, label: 'Line {{key}}' }, flow: { cell: [100, 40], gap: [4, 4], columns: 2, pad: [8, 24] } } },
      } as never,
    );
    b.data!.pumps = { ...pumps, fields: { ...pumps.fields, age: { at: '/updatedAt', state: { relative: ['idle', -300, 'ok', 0, 'warn'] } } } } as never;
    expect(validateBoard(b).filter(i => !i.hint)).toEqual([]);
    const doc = draw(b);
    const node = (id: string) => doc.nodes.find(n => n.id === id)!;
    // placed by the rule …
    expect(doc.nodes.map(boxOf)).toEqual([
      ['pump/P1', 8, 24, 100, 40], ['pump/P3', 112, 24, 100, 40], ['pump/P5', 8, 68, 100, 40], ['pump/P2', 238, 24, 100, 40], ['pump/P4', 342, 24, 100, 40],
    ]);
    // … and every other thing a part may have is still on it, read beside the widget, the item's own.
    for (const id of ['pump/P1', 'pump/P4']) {
      expect(node(id).highlight).toEqual({ from: '$highlight' });
      const bindings = node(id).widget.bindings!;
      expect(bindings['$highlight']!.ref).toMatchObject({ path: '/plant/pumps', valuePath: '/current' });
      expect(bindings['data.tone']!.map).toMatchObject({ relativeTo: 'now' });
      expect(Object.keys(bindings).filter(key => key.startsWith('data.meter'))).not.toEqual([]);
    }
    expect(JSON.stringify(doc.nodes.map(n => n.widget.props))).not.toContain('highlight');
  });

  it('refuses a rule inside a group, and says what a place there is', () => {
    const b = board(
      { g: { as: 'group', size: [100, 100], parts: { a: { as: 'stat', of: 'totals', show: 'temp' } }, place: { a: { flow: { cell: [50, 50], columns: 2 } } } } } as never,
      { kind: 'canvas', size: [600, 400], place: { g: [0, 0] } } as never,
    );
    expect(validateBoard(b).filter(i => !i.hint).map(i => `${i.at}: ${i.message}`)).toEqual([expect.stringMatching(/^\/parts\/g\/place\/a: .*\[x, y/)]);
  });

  it('draws a box of the size it is given, and tells how many items it could not place', () => {
    const lost: [string, number][] = [];
    const b = withPlace({ by: 'line', boxes: { cell: [300, 200], columns: 1 }, flow: { cell: [100, 40], columns: 2 } });
    const doc = draw(b, { rowsOf: () => [...rows, { id: 'P6' }, { line: 'L1' }], onUnplaced: (part, count) => lost.push([part, count]) });
    expect(doc.decorations?.map(d => d.type === 'rect' ? [d.width, d.height] : null)).toEqual([[300, 200], [300, 200]]);
    expect(lost).toEqual([['pump', 2]]);
  });

  it('is refused where it cannot be read', () => {
    const issues = (place: unknown) => validateBoard(withPlace(place)).filter(i => !i.hint).map(i => [i.at, i.message]);
    expect(issues({ flow: { cell: [100, 50], columns: 0 } })).toEqual([['/layout/place/pump/flow/columns', '"columns" is a whole number of columns, 1 or more']]);
    expect(issues({ flow: { columns: 2 } })).toEqual([['/layout/place/pump/flow/cell', '"cell" is the size of one item: [width, height], both above 0']]);
    expect(issues({ flow: { cell: [100, 50], columns: 2 }, boxes: { columns: 1 } })).toEqual([['/layout/place/pump/boxes', '"boxes" are the groups of "by" — name the field the items are grouped by: "by": "<field>"']]);
    expect(issues({ flow: { cell: [100, 50], columns: 2 }, by: 'line' })).toEqual([['/layout/place/pump', 'items grouped by a field are drawn in boxes: give "boxes": { "columns": n, "at"?, "gap"?, "cell"?, "label"? }']]);
    expect(issues({ flow: { cell: [100, 50], columns: 2 }, gap: [1, 1] })).toEqual([['/layout/place/pump/gap', 'items placed by a rule take "flow", "by" and "boxes" — "gap" is not one (items are not also placed by hand)']]);
    // An item called "flow" is still an item: its place is an array.
    expect(isFlowPlace({ flow: [0, 0, 10, 10], P1: [0, 0] })).toBe(false);
    expect(isFlowPlace({ flow: { cell: [1, 1], columns: 1 } })).toBe(true);
    expect(() => toViewDocument(withPlace({ flow: { cell: [100, 50], columns: 2 } }))).toThrow(/give rowsOf/);
  });
});

describe('a state that follows the clock', () => {
  // The source answered at READ_AT; both pumps were updated 30 seconds before.
  const withState = (rule: unknown): Board => {
    const b = board({ pump: { as: 'status-card', each: 'pumps', title: '{{key}}', show: ['age'] } } as never, { kind: 'grid', items: ['pump'] });
    b.data!.pumps = { ...pumps, fields: { ...pumps.fields, age: { at: '/updatedAt', state: rule as never } } };
    return b;
  };
  const toneOf = (b: Board) => {
    const doc = toViewDocument(b, { keysOf: () => ['P1'] });
    const tone = (doc.kind === 'grid' ? doc.items : []).flatMap(i => ('widget' in i ? [i.widget] : []))[0]!.bindings!['data.tone']!;
    return tone;
  };

  it('reads the bands over the seconds from the time the board is read to the value', () => {
    const b = withState({ relative: ['idle', -300, 'ok', 0, 'warn'] });
    expect(validateBoard(b).filter(i => !i.hint)).toEqual([]);
    const tone = toneOf(b);
    expect(tone.map).toMatchObject({ relativeTo: 'now', ranges: [{ max: -300, value: 'idle' }, { min: -300, max: 0, value: 'ok' }, { min: 0, value: 'warn' }] });
    // 30 seconds before the read: within the second band.
    expect(applyValueMap(tone.map!, '2026-10-23T03:00:00Z', READ_AT)).toBe('ok');
    expect(applyValueMap(tone.map!, '2026-10-23T02:50:00Z', READ_AT)).toBe('idle');
    expect(applyValueMap(tone.map!, '2026-10-23T03:05:00Z', READ_AT)).toBe('warn');
    // Epoch seconds and milliseconds are times too; anything else is no time.
    expect(applyValueMap(tone.map!, Date.parse('2026-10-23T03:00:00Z') / 1000, READ_AT)).toBe('ok');
    expect(applyValueMap(tone.map!, Date.parse('2026-10-23T03:00:00Z'), READ_AT)).toBe('ok');
    expect(applyValueMap(tone.map!, 'soon', READ_AT)).toBe('soon');
  });

  it('is refused where it is not bands', () => {
    const issues = (rule: unknown) => validateBoard(withState(rule)).filter(i => !i.hint).map(i => [i.at, i.message]);
    expect(issues({ relative: ['idle', 'ok'] })).toEqual([['/data/pumps/fields/age/state/relative', 'bands are [word, number, word, …] — a word, then a number and the word from it up']]);
    expect(issues({ relative: ['idle', 0, 'ok'], raw: 'x' })).toEqual([['/data/pumps/fields/age/state', 'a relative state is { "relative": ["past", -60, "now", 60, "next"] } — bands of the seconds from now to the time; nothing beside "relative"']]);
  });
});
