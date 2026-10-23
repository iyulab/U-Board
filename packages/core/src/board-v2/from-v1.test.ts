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

  it('draws a placeholder as its text, and leaves out a binding that reads no HTTP connector, saying so', () => {
    const { board, notes, unsupported } = fromV1(canvas([
      node('p', { type: 'status', props: { data: { label: 'New node', level: 'neutral', value: 'unbound' } } }),
      node('g', { type: 'gauge', props: { data: { value: 0 } }, bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.load' } } }, 200),
    ]));
    expect(unsupported).toEqual([]);
    expect(board.parts).toEqual({ p: { as: 'label', title: 'New node' }, g: { as: 'label', title: 'gauge' } });
    expect(notes).toEqual([
      'p: a status bound to nothing is drawn as its text',
      'g: the binding of data.value to "demo-cmms" reads no HTTP connector — left out',
      'g: a gauge bound to nothing is drawn as its text',
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
