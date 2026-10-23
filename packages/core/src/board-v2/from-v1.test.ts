import { describe, expect, it } from 'vitest';
import type { CanvasView, Node, Widget } from '../view-document.js';
import { fromV1 } from './from-v1.js';
import { toViewDocument } from './picture.js';
import { validateBoardV2 } from './validate.js';

const equipment = (id: string, valuePath: string) => ({
  path: '/plant/equipment', item: { list: '/value', where: { id } }, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: 60,
});
const node = (id: string, widget: Widget, x = 0): Node => ({ id, x, y: 0, width: 160, height: 100, anchored: false, widget });
const canvas = (nodes: Node[], more: Partial<CanvasView> = {}): CanvasView => ({ kind: 'canvas', background: {}, nodes, connectors: [], ...more });

describe('fromV1', () => {
  it('reads the bindings of one request and list as one data read, its items named by the field they differ by', () => {
    const { board, notes, unsupported } = fromV1(canvas([
      node('a', { type: 'metric', props: { data: { label: 'Load', value: 0, unit: '%' } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment('PR-01', '/load') } } }),
      node('b', { type: 'gauge', props: { data: { value: 0 }, options: { max: 120 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment('PR-02', 'load') } } }, 200),
    ]));
    expect(unsupported).toEqual([]);
    expect(notes).toEqual([]);
    expect(board.data).toEqual({
      equipment: { from: 'plant', path: '/plant/equipment', list: '/value', key: 'id', time: 'updatedAt', fresh: 60, fields: { load: { label: 'Load', unit: '%' } } },
    });
    expect(board.parts).toEqual({ a: { as: 'stat', of: 'equipment[PR-01]', show: 'load' }, b: { as: 'gauge', of: 'equipment[PR-02]', show: 'load', max: 120 } });
    expect(board.layout).toEqual({ kind: 'canvas', size: [360, 100], place: { a: [0, 0, 160, 100], b: [200, 0, 160, 100] } });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
  });

  it('keeps the fields items share in "where" and names them by the one they differ by', () => {
    const air = (station: string) => ({ path: '/air', item: { list: '/items', where: { item: 'PM10', station } }, valuePath: '/value' });
    const { board } = fromV1(canvas([
      node('n', { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'gov', ref: air('north') } } }),
      node('s', { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'gov', ref: air('south') } } }),
    ]));
    expect(board.data!.air).toMatchObject({ list: '/items', key: 'station', where: { item: 'PM10' } });
    expect(board.parts.s).toEqual({ as: 'stat', of: 'air[south]', show: 'value' });
  });

  it('turns a tone read where the value is into the state of its field, and a value map into its names', () => {
    const { board, unsupported } = fromV1(canvas([
      node('m', {
        type: 'status',
        props: { data: [{ label: 'Press', value: '', tone: 'idle' }, { label: 'Open orders', value: 0, tone: 'idle' }] },
        bindings: {
          'data.0.value': { adapter: 'plant', ref: equipment('PR-01', '/state'), map: { values: { running: 'Running' }, otherwise: 'Unknown' } },
          'data.0.tone': { adapter: 'plant', ref: equipment('PR-01', '/state'), map: { values: { running: 'ok', down: 'alarm' }, otherwise: 'idle' } },
          'data.1.value': { adapter: 'plant', ref: equipment('PR-01', '/orders') },
          'data.1.tone': { adapter: 'plant', ref: equipment('PR-01', '/orders'), map: { ranges: [{ max: 1, value: 'ok' }, { min: 1, max: 5, value: 'warn' }, { min: 5, value: 'alarm' }] } },
        },
      }),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts.m).toEqual({ as: 'stat-list', of: 'equipment[PR-01]', show: ['state', 'orders'] });
    expect(board.data!.equipment!.fields).toEqual({
      state: { label: 'Press', names: { running: 'Running', '*': 'Unknown' }, state: { running: 'ok', down: 'alarm', '*': 'idle' } },
      orders: { label: 'Open orders', state: ['ok', 1, 'warn', 5, 'alarm'] },
    });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
  });

  it('reads a status whose data is one row itself (the older form) as a list of one row', () => {
    const { board, unsupported } = fromV1(canvas([
      node('s', {
        type: 'status',
        props: { data: { label: 'Press', value: '', tone: 'idle' } },
        bindings: {
          'data.value': { adapter: 'plant', ref: equipment('PR-01', '/load') },
          'data.tone': { adapter: 'plant', ref: equipment('PR-01', '/load'), map: { ranges: [{ max: 80, value: 'ok' }, { min: 80, value: 'warn' }] } },
        },
      }),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts.s).toEqual({ as: 'stat-list', of: 'equipment[PR-01]', show: ['load'] });
    expect(board.data!.equipment!.fields).toEqual({ load: { label: 'Press', state: ['ok', 80, 'warn'] } });
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && Object.keys(drawn.nodes[0]!.widget.bindings!)).toEqual(['data.0.value', 'data.0.tone']);
  });

  it('reads a table’s whole list, each column a field of its items — a figure set right, an alignment it cannot keep noted', () => {
    const { board, notes, unsupported } = fromV1(canvas([
      node('t', {
        type: 'table',
        props: { title: 'Orders', data: [], mapping: { columns: [
          { field: 'order', label: 'Order' },
          { field: 'planned', label: 'Planned', format: 'number', align: 'right' },
          { field: 'rank', label: 'Rank', align: 'right' },
        ] } },
        bindings: { data: { adapter: 'mes', ref: { path: '/line/orders', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: 300 } } },
      }),
    ]));
    expect(unsupported).toEqual([]);
    expect(notes).toEqual(['t: its column rank is set left']);
    expect(board.data!.orders).toEqual({
      from: 'mes', path: '/line/orders', list: '/value', answerTime: '/updatedAt', fresh: 300,
      fields: { order: { label: 'Order' }, planned: { label: 'Planned', format: 'number' }, rank: { label: 'Rank' } },
    });
    expect(board.parts.t).toEqual({ as: 'table', of: 'orders', show: ['order', 'planned', 'rank'], title: 'Orders' });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && (drawn.nodes[0]!.widget.props as { mapping: unknown }).mapping).toEqual({ columns: [
      { field: 'order', label: 'Order' },
      { field: 'planned', label: 'Planned', format: 'number', align: 'right' },
      { field: 'rank', label: 'Rank' },
    ] });
  });

  it('draws a component as a group preset and each instance as a part that uses it, reading the item it names', () => {
    const bed = (field: string) => ({ adapter: 'ward', ref: { path: '/ward/beds', item: { list: '/value', where: { id: '{{bed}}' } }, valuePath: `/${field}` } });
    const { board, unsupported } = fromV1(canvas([node('desk', { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'ward', ref: { path: '/ward/summary', valuePath: '/free' } } } })], {
      elements: { bed: { render: 'template', template: '<b>{{no}}</b>{{state}}', size: { width: 100, height: 110 }, props: { type: 'object', properties: { no: { type: 'string' }, state: { type: 'string' } } } } },
      components: { bed: { params: { type: 'object', required: ['bed'], properties: { bed: { type: 'string' } } }, nodes: [{ id: 'card', x: 0, y: 0, widget: { type: 'element:bed', props: { no: '{{bed}}', state: '' }, bindings: { state: bed('state') } } }] } },
      instances: [
        { id: 'b1', component: 'bed', x: 200, y: 0, anchored: false, params: { bed: '701-1' } },
        { id: 'b2', component: 'bed', x: 320, y: 0, anchored: false, params: { bed: '701-2' } },
      ],
      connectors: [{ id: 'c', fromNodeId: 'desk', toNodeId: 'b2/card' }],
    }));
    expect(unsupported).toEqual([]);
    expect(board.presets).toEqual({ bed: { as: 'group', size: [100, 110], parts: { card: { as: 'element', element: 'bed', bind: { state: 'state', no: 'id' } } }, place: { card: [0, 0, 100, 110] } } });
    expect(board.parts.b1).toEqual({ use: 'bed', of: 'beds[701-1]' });
    expect(board.parts.b2).toEqual({ use: 'bed', of: 'beds[701-2]' });
    expect(board.layout.kind === 'canvas' && board.layout.place).toMatchObject({ b1: [200, 0, 100, 110], b2: [320, 0, 100, 110] });
    expect(board.layout.kind === 'canvas' && board.layout.links).toEqual({ c: { from: 'desk', to: 'b2/card' } });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.nodes.map(n => n.id)).toEqual(['desk', 'b1/card', 'b2/card']);
  });

  it('reads a list’s whole list, each slot of its rows a field of its items', () => {
    const { board, unsupported } = fromV1(canvas([
      node('l', {
        type: 'list',
        props: { title: 'Orders', data: [], mapping: { primary: 'item', secondary: 'who', trailing: 'amount', badge: 'badge' } },
        bindings: { data: { adapter: 'shop', ref: { path: '/sales/orders', valuePath: '/value' } } },
      }),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts.l).toEqual({ as: 'list', of: 'orders', show: 'item', secondary: 'who', trailing: 'amount', badge: 'badge', title: 'Orders' });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && (drawn.nodes[0]!.widget.props as { mapping: unknown }).mapping).toEqual({ primary: 'item', secondary: 'who', trailing: 'amount', badge: 'badge' });
  });

  it('reads a gauge’s end and subtitle from its item, and a time deeper in the answer as a field', () => {
    const lot = (valuePath: string) => ({ adapter: 'city', ref: { path: '/city', item: { list: '/parking', where: { code: 'P1' } }, valuePath } });
    const { board, unsupported } = fromV1(canvas([
      node('g', { type: 'gauge', props: { data: { value: 0, max: 100 }, options: { unit: 'cars', subtitle: 'Lot' } }, bindings: { 'data.value': lot('/now'), 'data.max': lot('/capacity'), 'options.subtitle': lot('/name') } }),
      node('t', { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'city', ref: { path: '/city', valuePath: '/weather/0/temp', observedAtPath: '/weather/0/at' } } } }),
      node('s', { type: 'status', props: { data: { label: 'Bikes', value: '' } }, bindings: { 'data.label': lot('/name'), 'data.value': lot('/now') } }),
    ]));
    expect(unsupported).toEqual(['a status row bound at label']);
    expect(board.parts.g).toEqual({ as: 'gauge', of: 'city[P1]', show: 'now', subtitle: 'Lot', max: 'capacity', title: '{{name}}' });
    expect(board.data!.city!.fields!.now).toMatchObject({ unit: 'cars' });
    expect(Object.values(board.data!).find(q => q.time !== undefined)).toMatchObject({ time: 'at', fields: { temp: { at: '/weather/0/temp' }, at: { at: '/weather/0/at' } } });
    const drawn = toViewDocument({ ...board, parts: { g: board.parts.g!, t: board.parts.t! }, layout: { kind: 'canvas', size: [400, 200], place: { g: [0, 0, 100, 100], t: [200, 0, 100, 100] } } });
    const nodes = drawn.kind === 'canvas' ? drawn.nodes : [];
    expect(nodes[0]!.widget.bindings!['options.max']!.ref).toMatchObject({ valuePath: '/capacity' });
    expect(nodes[1]!.widget.bindings!['data.value']!.ref).toMatchObject({ valuePath: '/weather/0/temp', observedAtPath: '/weather/0/at' });
  });

  it('colours a status row toned by another field of its item by that field’s state — the part’s state', () => {
    const { board, unsupported } = fromV1(canvas([
      node('p', {
        type: 'status',
        props: { data: [{ label: 'State', value: '' }, { label: 'Pressure', value: 0, unit: 'bar' }] },
        bindings: {
          'data.0.value': { adapter: 'plant', ref: equipment('P1', '/state') },
          'data.0.tone': { adapter: 'plant', ref: equipment('P1', '/state'), map: { values: { run: 'ok', trip: 'alarm' }, otherwise: 'off' } },
          'data.1.value': { adapter: 'plant', ref: equipment('P1', '/pressure') },
          'data.1.tone': { adapter: 'plant', ref: equipment('P1', '/state'), map: { values: { run: 'ok', trip: 'alarm' }, otherwise: 'off' } },
        },
      }),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts.p).toEqual({ as: 'stat-list', of: 'equipment[P1]', show: ['state', 'pressure'], state: 'state' });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    const b = drawn.kind === 'canvas' ? drawn.nodes[0]!.widget.bindings! : {};
    expect(b['data.1.tone']!.ref).toMatchObject({ valuePath: '/state' });
    expect(b['data.1.value']!.ref).toMatchObject({ valuePath: '/pressure' });
    expect(validateBoardV2({ ...board, parts: { p: { ...board.parts.p!, state: 'pressure' } } }).map(i => i.message)).toContain('"pressure" has no "state" in /data/equipment/fields — the field that colours the rows needs one');
  });

  it('reads a metric’s trend from its item as the stat’s trend', () => {
    const { board, unsupported } = fromV1(canvas([
      node('m', { type: 'metric', props: { data: { value: 0, label: 'Traffic' } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment('L1', '/value') }, 'data.sparkline': { adapter: 'plant', ref: equipment('L1', '/last6h') } } }),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts.m).toEqual({ as: 'stat', of: 'equipment[L1]', show: 'value', trend: 'last6h' });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.nodes[0]!.widget.bindings!['data.sparkline']!.ref).toMatchObject({ valuePath: '/last6h' });
  });

  it('reads a connector width bound to a value as the link’s weight, and a label of one field with its places', () => {
    const metric = (id: string, x: number) => node(id, { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment(id, '/load') } } }, x);
    const lane = (valuePath: string) => ({ adapter: 'plant', ref: { path: '/lanes', valuePath } });
    const { board, unsupported } = fromV1(canvas([metric('A', 0), metric('B', 300)], {
      connectors: [{
        id: 'l', fromNodeId: 'A', toNodeId: 'B', label: '{{value | fixed:0}} Mbps', style: { strokeWidth: 3 },
        bindings: {
          label: lane('/a/mbps'),
          'style.strokeWidth': { ...lane('/a/mbps'), map: { ranges: [{ min: 85, value: 5 }, { min: 60, value: 3.5 }], otherwise: 2 } },
        },
      }],
    }));
    expect(unsupported).toEqual([]);
    expect(board.layout.kind === 'canvas' && board.layout.links!.l).toEqual({ from: 'A', to: 'B', label: '{{mbps}} Mbps', of: 'lanes', width: 3, weight: { field: 'mbps', bands: [2, 60, 3.5, 85, 5] } });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    const c = drawn.kind === 'canvas' ? drawn.connectors[0]! : undefined;
    expect(c!.label).toBe('{{value | fixed:0}} Mbps');
    expect(c!.bindings!.label!.ref).toMatchObject({ valuePath: '/a/mbps' });
    expect(c!.bindings!['style.strokeWidth']!.map).toEqual({ ranges: [{ max: 60, value: 2 }, { min: 60, max: 85, value: 3.5 }, { min: 85, value: 5 }] });
    expect(validateBoardV2({ ...board, layout: { ...board.layout, links: { l: { from: 'A', to: 'B', of: 'lanes', weight: { field: 'mbps', bands: [2, 60] } } } } as typeof board.layout }).map(i => i.at))
      .toContain('/layout/links/l/weight/bands');
  });

  it('reads a list of one row per name as one item when a widget reads several of its rows — pivoted', () => {
    const row = (category: string) => ({ adapter: 'kma', ref: { path: '/ncst?nx=60', item: { list: '/items', where: { category } }, valuePath: '/obsrValue' } });
    const { board, unsupported } = fromV1(canvas([
      node('t', { type: 'element:town', props: { temp: 0, humidity: 0 }, bindings: { temp: row('T1H'), humidity: row('REH') } }),
    ], { elements: { town: { render: 'template', template: '{{temp}} {{humidity}}', size: { width: 100, height: 60 }, props: { type: 'object', properties: { temp: { type: 'number' }, humidity: { type: 'number' } } } } } }));
    expect(unsupported).toEqual([]);
    expect(board.data!.ncst).toEqual({ from: 'kma', path: '/ncst?nx=60', list: '/items', pivot: { key: 'category', value: 'obsrValue' }, fields: { T1H: {}, REH: {} } });
    expect(board.parts.t).toEqual({ as: 'element', element: 'town', of: 'ncst', bind: { temp: 'T1H', humidity: 'REH' } });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.nodes[0]!.widget.bindings!.humidity!.ref).toEqual({ path: '/ncst?nx=60', item: { list: '/items', where: { category: 'REH' } }, valuePath: '/obsrValue' });
    expect(validateBoardV2({ ...board, parts: { t: { ...board.parts.t!, of: 'ncst[T1H]' } } }).map(i => i.message)).toContain('"ncst" is pivoted into one item — write "ncst" and name its fields');
  });

  it('reads a chart’s whole list with the time the answer says it is of', () => {
    const { board } = fromV1(canvas([
      node('c', {
        type: 'chart.bar',
        props: { title: 'By type', data: [], mapping: { x: 'type', y: 'count' }, options: { horizontal: true } },
        bindings: { data: { adapter: 'bank', ref: { path: '/blood/types', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: 3600 } } },
      }),
    ]));
    expect(board.data!.types).toEqual({ from: 'bank', path: '/blood/types', list: '/value', answerTime: '/updatedAt', fresh: 3600 });
    expect(board.parts.c).toEqual({ as: 'chart.bar', of: 'types', title: 'By type', x: 'type', y: 'count', horizontal: true });
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.nodes[0]!.widget.bindings!.data!.ref).toEqual({
      path: '/blood/types', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: 3600,
    });
  });

  it('draws a placeholder as its text, and reads a binding to another adapter by its own reference', () => {
    const { board, notes, unsupported } = fromV1(canvas([
      node('p', { type: 'status', props: { data: { label: 'New node', level: 'neutral', value: 'unbound' } } }),
      node('g', { type: 'gauge', props: { data: { value: 0, label: 'Pump A' } }, bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.load' } } }, 200),
      node('h', { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'host', ref: { asset: 7 }, at: '/temp' } } }, 400),
    ]));
    expect(unsupported).toEqual([]);
    expect(notes).toEqual(['p: a status bound to nothing is drawn as its text']);
    expect(board.data).toEqual({
      load: { from: 'demo-cmms', ref: 'pump-a.load', fields: { value: { at: '', label: 'Pump A' } } },
      host: { from: 'host', ref: { asset: 7 }, fields: { temp: {} } },
    });
    expect(board.parts).toEqual({ p: { as: 'label', title: 'New node' }, g: { as: 'gauge', of: 'load', show: 'value', title: 'Pump A' }, h: { as: 'stat', of: 'host', show: 'temp' } });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.nodes.map(n => n.widget.bindings?.['data.value'])).toEqual([
      undefined,
      { adapter: 'demo-cmms', ref: 'pump-a.load' },
      { adapter: 'host', ref: { asset: 7 }, at: '/temp' },
    ]);
  });

  it('draws an element node as an element part: its definition, fixed props, and bound props as fields, words or tones', () => {
    const { board, unsupported } = fromV1(canvas(
      [node('t', {
        type: 'element:Tank',
        props: { name: 'T1', level: 0, tone: 'idle', counts: {} },
        bindings: {
          level: { adapter: 'plant', ref: equipment('T1', '/level') },
          tone: { adapter: 'plant', ref: equipment('T1', '/level'), map: { ranges: [{ max: 20, value: 'alarm' }, { min: 20, value: 'ok' }] } },
          counts: { adapter: 'plant', ref: equipment('T1', '/counts') },
        },
      })],
      { elements: { Tank: { render: 'template', template: '<b>{{name}}</b><i style="--l: {{level}}" class="{{tone}}"></i>{{counts.open}}', size: { width: 120, height: 90 }, props: { type: 'object', properties: { name: { type: 'string' }, level: { type: 'number' }, tone: { enum: ['ok', 'alarm', 'idle'] }, counts: { type: 'object' } } } } } },
    ));
    expect(unsupported).toEqual([]);
    expect(board.elements).toEqual({ tank: { template: '<b>{{name}}</b><i style="--l: {{level}}" class="{{tone}}"></i>{{counts.open}}', props: { name: 'string', level: 'number', tone: 'string', counts: 'object' } } });
    expect(board.parts.t).toEqual({ as: 'element', element: 'tank', of: 'equipment[T1]', props: { name: 'T1' }, bind: { level: 'level', tone: 'level.tone', counts: 'counts' } });
    expect(board.data!.equipment!.fields).toEqual({ level: { state: ['alarm', 20, 'ok'] }, counts: {} });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
  });

  it('draws connectors as links and decorations as shapes, their colours in the nearest tone', () => {
    const metric = (id: string, x: number) => node(id, { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment(id, '/load') } } }, x);
    const { board, notes, unsupported } = fromV1(canvas([metric('A', 0), metric('B', 300)], {
      connectors: [
        { id: 'feed', fromNodeId: 'A', toNodeId: 'B', label: '{{value | fixed:1}} t/h', labelSize: 14, style: { stroke: '#15803d', strokeWidth: 3, dash: 'dotted', arrow: 'end', route: 'curved' },
          bindings: { label: { adapter: 'plant', ref: equipment('A', '/flow') }, 'style.stroke': { adapter: 'plant', ref: equipment('A', '/state'), map: { values: { trip: 'alarm' }, otherwise: 'ok' } } } },
        { id: 'back', fromNodeId: 'B', toNodeId: 'A', label: 'return', style: { stroke: '#dc2626', route: 'orthogonal' } },
      ],
      decorations: [
        { id: 'zone', type: 'rect', x: 0, y: 0, width: 400, height: 200, stroke: '#64748b', label: 'Line 1', fill: '#f1f5f9' },
        { id: 'note', type: 'text', x: 10, y: 190, text: 'Hourly', fontSize: 12, fill: '#2563eb' },
      ],
    }));
    expect(unsupported).toEqual([]);
    expect(board.layout.kind === 'canvas' && board.layout.links).toEqual({
      feed: { from: 'A', to: 'B', label: '{{flow}} t/h', show: 'state', of: 'equipment[A]', width: 3, dash: true, arrow: true, route: 'curved' },
      back: { from: 'B', to: 'A', label: 'return', tone: 'alarm', route: 'orthogonal' },
    });
    expect(board.statuses).toBeUndefined();
    expect(board.data!.equipment!.fields!.state).toEqual({ state: { trip: 'alarm', '*': 'ok' } });
    expect(board.layout.kind === 'canvas' && board.layout.shapes).toEqual({
      zone: { box: [0, 0, 400, 200], label: 'Line 1' },
      note: { text: 'Hourly', at: [10, 190], size: 12, tone: 'info' },
    });
    expect(notes).toEqual([
      'feed: a dotted line is drawn dashed',
      "feed: its label's place and size take the board's",
      'back: its colour #dc2626 is drawn in the nearest tone, alarm',
      'zone: its colour #64748b is drawn in the nearest tone, idle',
      "zone: its fill take the board's",
      'note: its colour #2563eb is drawn in the nearest tone, info',
    ]);
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'canvas' && drawn.connectors.map(c => c.style)).toEqual([
      { stroke: 'idle', strokeWidth: 3, dash: 'dashed', arrow: 'end', route: 'curved' },
      { stroke: 'alarm', strokeWidth: 2, arrow: 'none', route: 'orthogonal' },
    ]);
  });

  it('draws a colour and a dash bound to one field as its state — tones, and a dashed or dotted value as a status of its own', () => {
    const metric = (id: string, x: number) => node(id, { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment(id, '/load') } } }, x);
    const { board, notes, unsupported } = fromV1(canvas([metric('A', 0), metric('B', 300)], {
      connectors: [{
        id: 'run', fromNodeId: 'A', toNodeId: 'B', style: { stroke: '#1d4fa0', strokeWidth: 6 },
        bindings: {
          'style.stroke': { adapter: 'plant', ref: equipment('A', '/state'), map: { values: { ok: 'positive', cancel: '#d7261e', idle: '#94a3b8' }, otherwise: 'warning' } },
          'style.dash': { adapter: 'plant', ref: equipment('A', '/state'), map: { values: { cancel: 'dashed', idle: 'dotted' }, otherwise: 'solid' } },
        },
      }],
    }));
    expect(unsupported).toEqual([]);
    expect(board.statuses).toEqual({ cancel: { tone: 'alarm', emphasis: 'hatch' }, 'idle-blink': { tone: 'idle', emphasis: 'blink' } });
    expect(board.data!.equipment!.fields!.state).toEqual({ state: { ok: 'ok', cancel: 'cancel', idle: 'idle-blink', '*': 'warn' } });
    expect(board.layout.kind === 'canvas' && board.layout.links).toEqual({ run: { from: 'A', to: 'B', show: 'state', of: 'equipment[A]', width: 6 } });
    expect(notes).toContain('run: its colour #d7261e is drawn in the nearest tone, alarm');
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    const dash = drawn.kind === 'canvas' ? drawn.connectors[0]!.bindings!['style.dash']!.map : undefined;
    expect(dash).toMatchObject({ values: { cancel: 'dashed', idle: 'dotted' } });
  });

  it('leaves a connector coloured and dashed by different fields unsupported', () => {
    const metric = (id: string, x: number) => node(id, { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment(id, '/load') } } }, x);
    const { unsupported } = fromV1(canvas([metric('A', 0), metric('B', 300)], {
      connectors: [{
        id: 'run', fromNodeId: 'A', toNodeId: 'B',
        bindings: {
          'style.stroke': { adapter: 'plant', ref: equipment('A', '/state'), map: { values: { down: 'alarm' }, otherwise: 'ok' } },
          'style.dash': { adapter: 'plant', ref: equipment('A', '/mode'), map: { values: { idle: 'dashed' }, otherwise: 'solid' } },
        },
      }],
    }));
    expect(unsupported).toEqual(['a connector coloured and dashed by different fields']);
  });

  it('lays a grid out item by item, an item spanning rows beside a grid in a cell of the items that fill them', () => {
    const metric = (id: string) => ({ id, widget: { type: 'metric', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'plant', ref: equipment(id, '/load') } } } });
    const { board, notes, unsupported } = fromV1({
      kind: 'grid',
      items: [
        { ...metric('map'), span: 8, rowSpan: 2 },
        { ...metric('a'), span: 4, spanMedium: 3 },
        { ...metric('b'), span: 2 }, { ...metric('c'), span: 2 },
        { id: 'plan', span: 12, height: 300, canvas: { background: {}, nodes: [node('d', metric('d').widget)], connectors: [] } },
      ],
    });
    expect(unsupported).toEqual([]);
    expect(notes).toEqual(["the spans at medium width are the board's"]);
    expect(board.layout).toEqual({
      kind: 'grid',
      items: [
        ['map', 8],
        { grid: [['a', 12], ['b', 6], ['c', 6]], span: 4 },
        { canvas: { size: [160, 100], place: { d: [0, 0, 160, 100] } }, span: 12, height: 300 },
      ],
    });
    expect(validateBoardV2(board).filter(i => !i.hint)).toEqual([]);
    const drawn = toViewDocument(board);
    expect(drawn.kind === 'grid' && drawn.items.map(i => [i.id, i.span, i.rowSpan])).toEqual([
      ['map', 8, 2], ['a', 4, undefined], ['b', 2, undefined], ['c', 2, undefined], [expect.stringMatching(/^cell/), 12, undefined],
    ]);
  });

  it('reports what the second version has no place for yet, never dropping it without a word', () => {
    const { unsupported } = fromV1(canvas(
      [node('e', { type: 'element:pump', props: {} })],
      { connectors: [{ id: 'l', fromNodeId: 'e', toNodeId: 'e' }] },
    ));
    expect(unsupported).toEqual(['an element the board does not define', 'a connector to a node not converted']);
    expect(fromV1({ kind: 'grid', items: [] }).unsupported).toEqual([]);
  });
});
