import { describe, it, expect } from 'vitest';
import { expandComponents, fillParameters } from './components';
import { bindingsIn } from './document-bindings';
import { resolveDocument } from './resolve-document';
import { boardStateOf } from './board-state';
import type { Adapter } from './adapter';
import type { CanvasView, ComponentDefinition } from './view-document';

const card: ComponentDefinition = {
  params: {
    type: 'object',
    properties: { machine: { type: 'string' }, max: { type: 'number', default: 100 } },
    required: ['machine'],
  },
  nodes: [
    {
      id: 'temp',
      x: 0,
      y: 0,
      widget: { type: 'gauge', props: { max: '{{max}}', label: 'Temp {{machine}}' }, bindings: { value: { adapter: 'plant', ref: { path: '/machines/{{machine}}/temp' } } } },
      states: { from: 'value', map: { ranges: [{ min: 80, value: 'hot' }], otherwise: 'ok' } },
    },
    { id: 'speed', x: 0, y: 120, widget: { type: 'gauge', bindings: { value: { adapter: 'plant', ref: { path: '/machines/{{machine}}/speed' } } } } },
  ],
  connectors: [{ id: 'link', fromNodeId: 'temp', toNodeId: 'speed' }],
  decorations: [{ id: 'frame', type: 'rect', x: -10, y: -10, width: 180, height: 250, label: '{{machine}}' }],
};

const board = (extra: Partial<CanvasView> = {}): CanvasView => ({
  kind: 'canvas',
  background: {},
  nodes: [{ id: 'hall', x: 0, y: 0, anchored: false, widget: { type: 'status' } }],
  connectors: [],
  components: { card },
  instances: [
    { id: 'press-1', component: 'card', x: 200, y: 40, anchored: false, params: { machine: 'P1' } },
    { id: 'press-2', component: 'card', x: 420, y: 40, anchored: true, params: { machine: 'P2', max: 150 } },
  ],
  ...extra,
});

describe('expandComponents', () => {
  it('draws each instance as its parts: moved to its origin, named <instance>/<part>, its parameters filled in', () => {
    const drawn = expandComponents(board());
    expect(drawn).not.toHaveProperty('components');
    expect(drawn).not.toHaveProperty('instances');
    expect(drawn.nodes.map(n => n.id)).toEqual(['hall', 'press-1/temp', 'press-1/speed', 'press-2/temp', 'press-2/speed']);
    const temp = drawn.nodes[3];
    expect(temp).toMatchObject({ x: 420, y: 40, anchored: true });
    expect(temp.widget.props).toEqual({ max: 150, label: 'Temp P2' });
    expect(temp.widget.bindings?.value.ref).toEqual({ path: '/machines/P2/temp' });
    expect(temp.states?.from).toBe('value');
    expect(drawn.nodes[1].widget.props).toEqual({ max: 100, label: 'Temp P1' });
    expect(drawn.connectors).toEqual([{ id: 'press-1/link', fromNodeId: 'press-1/temp', toNodeId: 'press-1/speed' }, { id: 'press-2/link', fromNodeId: 'press-2/temp', toNodeId: 'press-2/speed' }]);
    expect(drawn.decorations).toEqual([
      { id: 'press-1/frame', type: 'rect', x: 190, y: 30, width: 180, height: 250, label: 'P1' },
      { id: 'press-2/frame', type: 'rect', x: 410, y: 30, width: 180, height: 250, label: 'P2' },
    ]);
  });

  it('changes nothing when expanded again, and leaves a board without components as it is', () => {
    const drawn = expandComponents(board());
    expect(expandComponents(drawn)).toEqual(drawn);
    const plain: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    expect(expandComponents(plain)).toEqual(plain);
    const grid = { kind: 'grid' as const, items: [] };
    expect(expandComponents(grid)).toBe(grid);
  });

  it('draws nothing for an instance of a component the board does not define', () => {
    const drawn = expandComponents(board({ instances: [{ id: 'x', component: 'missing', x: 0, y: 0, anchored: false }] }));
    expect(drawn.nodes.map(n => n.id)).toEqual(['hall']);
  });
});

describe('fillParameters', () => {
  it('gives a whole placeholder the value itself, writes it as text inside a longer text, and leaves out a value it does not have', () => {
    expect(fillParameters({ a: '{{n}}', b: 'n={{n}}', c: ['{{t}}'], d: '{{missing}}', e: 'x{{missing}}y' }, { n: 3, t: true })).toEqual({ a: 3, b: 'n=3', c: [true], e: 'xy' });
  });
});

describe('a component board, read', () => {
  const plant: Adapter = {
    id: 'plant',
    resolve: async ref => {
      const path = (ref as { path: string }).path;
      return { quality: 'live', value: path.endsWith('/temp') ? (path.includes('P2') ? 90 : 20) : 5 };
    },
  };

  it('declares the bindings its instances read, filled in, at the component, by instance', () => {
    const declared = [...bindingsIn(board())].map(({ binding, at, instance }) => ({ ref: binding.ref, at, instance }));
    expect(declared).toEqual([
      { ref: { path: '/machines/P1/temp' }, at: '/components/card/nodes/0/widget/bindings/value', instance: 'press-1' },
      { ref: { path: '/machines/P1/speed' }, at: '/components/card/nodes/1/widget/bindings/value', instance: 'press-1' },
      { ref: { path: '/machines/P2/temp' }, at: '/components/card/nodes/0/widget/bindings/value', instance: 'press-2' },
      { ref: { path: '/machines/P2/speed' }, at: '/components/card/nodes/1/widget/bindings/value', instance: 'press-2' },
    ]);
  });

  it('resolves its instances’ parts and states them by their part ids', async () => {
    const resolved = await resolveDocument(board(), [plant]);
    expect(resolved).not.toHaveProperty('instances');
    expect(resolved.nodes.map(n => [n.id, n.widget.props?.value, n.state])).toEqual([
      ['hall', undefined, undefined],
      ['press-1/temp', 20, 'ok'],
      ['press-1/speed', 5, undefined],
      ['press-2/temp', 90, 'hot'],
      ['press-2/speed', 5, undefined],
    ]);
    const state = boardStateOf(resolved, { now: 0 });
    expect(state.parts['press-2/temp']).toEqual({ state: 'hot', quality: 'live' });
  });
});
