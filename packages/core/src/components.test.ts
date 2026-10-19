import { describe, it, expect } from 'vitest';
import { expandComponents, fillParameters } from './components';
import { validateViewDocument } from './validate-view-document';
import { bindingsIn } from './document-bindings';
import { resolveDocument } from './resolve-document';
import { boardStateOf } from './board-state';
import { lintViewDocument } from './lint-view-document';
import { elementUses, removeElement, renameElement } from './editing/element-editing';
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

describe('a component board, validated', () => {
  it('is valid, strictly, with a connector and a trigger naming parts of an instance', () => {
    const doc = board({
      connectors: [{ id: 'feed', fromNodeId: 'hall', toNodeId: 'press-2/temp' }],
      triggers: [{ on: { event: 'click', node: 'press-1/speed' }, do: [{ action: 'focus', node: 'press-2/temp' }] }],
    });
    expect(validateViewDocument(doc, { strict: true })).toEqual([]);
  });

  it('reports a component that does not hold at the component only — a line or a trigger to its instances’ parts is not wrong too', () => {
    const broken: ComponentDefinition = { ...card, decorations: [{ id: 'frame', type: 'rect', x: 0, y: 0, width: 10, height: 10, fill: 'var(--edge)' }] };
    const doc = board({
      components: { card: broken },
      connectors: [{ id: 'feed', fromNodeId: 'hall', toNodeId: 'press-2/temp' }],
      triggers: [{ on: { event: 'click', node: 'press-1/speed' }, do: [{ action: 'focus', node: 'press-2/temp' }] }],
    });
    expect(validateViewDocument(doc, { strict: true }).map(issue => issue.path)).toEqual(['/components/card/decorations/0/fill']);
  });

  it('says where a document field put among the components belongs', () => {
    const doc = board({ components: { card, instances: [{ id: 'press-3', component: 'card', x: 0, y: 0 }] } as never });
    expect(validateViewDocument(doc, { strict: true })).toContainEqual({
      path: '/components/instances',
      message: '"instances" is a field of the document, not a component — it goes at /instances, beside /components',
    });
  });

  it('names the instance for what it gives, and the component for what it uses', () => {
    const doc = board({
      instances: [
        { id: 'a', component: 'card', x: 0, y: 0, anchored: false, params: { max: 'high', line: 2 } },
        { id: 'b', component: 'crad', x: 0, y: 0, anchored: false },
      ],
    });
    expect(validateViewDocument(doc)).toEqual([
      { path: '/instances/0/params/line', message: 'the component "card" has no parameter "line" — it has: machine, max' },
      { path: '/instances/0/params/machine', message: 'expected this prop — the component requires it' },
      { path: '/instances/0/params/max', message: 'expected a number' },
      { path: '/instances/1/component', message: 'no component "crad" is defined — the board has: card' },
    ]);
  });

  it('refuses a text that uses a parameter the component does not declare, at its path in the component', () => {
    const doc = board({ components: { card: { ...card, decorations: [{ id: 'frame', type: 'text', x: 0, y: 0, text: 'Line {{line}}' }] } }, instances: [] });
    expect(validateViewDocument(doc)).toEqual([{ path: '/components/card/decorations/0/text', message: '{{line}}: the component declares no parameter "line" — it has: machine, max' }]);
  });

  it('says a board connector may join an instance’s part, when it joins nothing', () => {
    const doc = board({ connectors: [{ id: 'feed', fromNodeId: 'hall', toNodeId: 'press-3/temp' }] });
    expect(validateViewDocument(doc)).toEqual([
      { path: '/connectors/0/toNodeId', message: 'no node has the id "press-3/temp" — a connector joins two nodes of /nodes or of an instance (<instance id>/<part id>)' },
    ]);
  });

  it('refuses a part id another part of the board has, at the instance', () => {
    const doc = board({ nodes: [{ id: 'press-1/temp', x: 0, y: 0, anchored: false, widget: { type: 'status' } }] });
    expect(validateViewDocument(doc)).toEqual([
      { path: '/instances/0/id', message: 'one of its parts takes the id "press-1/temp", which /nodes/0 has — give the instance or the part another id' },
    ]);
  });

  it('keeps part ids to their component: the same part id in two components is no clash, and a connector joins only its own', () => {
    const other: ComponentDefinition = { nodes: [{ id: 'temp', x: 0, y: 0, widget: { type: 'gauge' } }], connectors: [{ id: 'l', fromNodeId: 'temp', toNodeId: 'hall' }] };
    expect(validateViewDocument(board({ components: { card, other }, instances: [] }))).toEqual([
      { path: '/components/other/connectors/0/toNodeId', message: 'no node has the id "hall" — a connector joins two nodes of /components/other/nodes' },
    ]);
  });

  it('checks the element props an instance fills in, at the component, naming the instance', () => {
    const doc = board({
      elements: { lamp: { render: 'template', props: { type: 'object', properties: { on: { type: 'boolean' } } }, template: '<b class="{{on}}"></b>' } },
      components: { lamp: { params: { type: 'object', properties: { on: {} } }, nodes: [{ id: 'l', x: 0, y: 0, widget: { type: 'element:lamp', props: { on: '{{on}}' } } }] } },
      instances: [
        { id: 'a', component: 'lamp', x: 0, y: 0, anchored: false, params: { on: true } },
        { id: 'b', component: 'lamp', x: 0, y: 0, anchored: false, params: { on: 'yes' } },
      ],
    });
    expect(validateViewDocument(doc)).toEqual([
      { path: '/components/lamp/nodes/0/widget/props/on', message: 'expected a boolean — for the instance "b" (/instances/1)' },
    ]);
  });

  it('asks for a value a part uses that has no default, and refuses a list inside a longer text', () => {
    const def: ComponentDefinition = { params: { type: 'object', properties: { tag: {}, tags: {} } }, nodes: [{ id: 'n', x: 0, y: 0, caption: 'Tag {{tags}}', widget: { type: 'gauge', props: { tag: '{{tag}}' } } }] };
    const doc = board({ components: { def }, instances: [{ id: 'a', component: 'def', x: 0, y: 0, anchored: false, params: { tags: ['x'] } }] });
    expect(validateViewDocument(doc)).toEqual([
      { path: '/instances/0/params/tags', message: 'expected text, a number or true/false — {{tags}} sits inside a text at /components/def/nodes/0/caption' },
      { path: '/instances/0/params/tag', message: 'expected a value — the component "def" uses {{tag}} and gives it no default' },
    ]);
  });
});

describe('a component board, edited and advised on', () => {
  const lampBoard = (): CanvasView =>
    board({
      elements: { lamp: { render: 'template', template: '<b></b>' } },
      components: { lamp: { nodes: [{ id: 'l', x: 0, y: 0, widget: { type: 'element:lamp' }, states: { from: 'v', map: { values: { '1': 'on' } }, looks: { of: { blink: true } } } }] } },
      instances: [],
    });

  it('counts an element a component places as placed, so it cannot be removed and is not advised away', () => {
    const doc = lampBoard();
    expect(elementUses(doc).get('lamp')).toBe(1);
    expect(removeElement(doc, 'lamp')).toBe(doc);
    expect(lintViewDocument(doc).map(a => a.path)).not.toContain('/elements/lamp');
  });

  it('renames an element inside the components that place it too', () => {
    const renamed = renameElement(lampBoard(), 'lamp', 'light');
    expect(renamed.components?.lamp.nodes[0].widget.type).toBe('element:light');
    expect(validateViewDocument(renamed).filter(issue => !issue.path.includes('states'))).toEqual([]);
  });

  it('advises on a component node’s look at the component, and on a trigger waiting for a state an instance part never enters', () => {
    const doc = lampBoard();
    doc.instances = [{ id: 'a', component: 'lamp', x: 0, y: 0, anchored: false }];
    doc.triggers = [{ on: { event: 'enter', node: 'a/l', state: 'off' }, do: [{ action: 'emit', name: 'x' }] }];
    expect(lintViewDocument(doc).filter(a => !a.path.startsWith('/nodes'))).toEqual([
      { path: '/components/lamp/nodes/0/states/looks/of', message: 'its map never names "of" — it names: on; rename the look or add the state to the map' },
      { path: '/triggers/0/on/state', message: '"a/l" is never in "off" — its map names: on' },
    ]);
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
