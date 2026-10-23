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
      'g: the binding of data.value to "demo-cmms" reads no HTTP connector — left out (A622-1)',
      'g: a gauge bound to nothing is drawn as its text',
    ]);
  });

  it('reports what the second version has no place for yet, never dropping it without a word', () => {
    const { unsupported } = fromV1(canvas(
      [node('e', { type: 'element:pump', props: {} })],
      { connectors: [{ id: 'l', fromNodeId: 'e', toNodeId: 'e' }], decorations: [{ id: 'd', type: 'rect', x: 0, y: 0, width: 10, height: 10 }] },
    ));
    expect(unsupported).toEqual(['connectors', 'decorations', 'an element node']);
    expect(fromV1({ kind: 'grid', items: [] }).unsupported).toEqual(['a grid board']);
  });
});
