import { describe, it, expect } from 'vitest';
import { resolveDocument } from './resolve-document';
import type { Adapter, ResolvedBinding } from './adapter';
import { placedIn, type CanvasView, type GridView } from './view-document';

class InMemoryAdapter implements Adapter {
  readonly id: string;
  private data: Map<string, ResolvedBinding>;

  constructor(id: string, data: Record<string, ResolvedBinding>) {
    this.id = id;
    this.data = new Map(Object.entries(data));
  }

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    return this.data.get(key) ?? { value: undefined, quality: 'disconnected' };
  }
}

const cmms = new InMemoryAdapter('cmms', {
  'pump-a.state': { value: 'running', quality: 'live' },
  'pump-b.state': { value: 'stopped', quality: 'disconnected' },
});

describe('resolveDocument', () => {
  it('resolves every node in a multi-node document, mixing bound and unbound widgets', async () => {
    const doc: CanvasView = {
      kind: 'canvas',
      background: { image: { src: 'plan.png', width: 800, height: 600 } },
      nodes: [
        {
          id: 'n1',
          x: 10,
          y: 20,
          anchored: true,
          widget: {
            type: 'uw-status',
            bindings: { value: { adapter: 'cmms', ref: 'pump-a.state' } },
          },
        },
        {
          id: 'n2',
          x: 100,
          y: 200,
          anchored: false,
          widget: { type: 'uw-metric', props: { label: 'note' } },
        },
      ],
      connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
    };

    const resolved = await resolveDocument(doc, [cmms]);

    expect(resolved.nodes).toHaveLength(2);
    expect(resolved.nodes[0]).toMatchObject({
      id: 'n1',
      x: 10,
      y: 20,
      anchored: true,
      widget: { props: { value: 'running' }, quality: { value: 'live' } },
    });
    expect(resolved.nodes[1]).toMatchObject({
      id: 'n2',
      widget: { props: { label: 'note' }, quality: {} },
    });
  });

  it('marks a node highlighted while its highlight reading says yes, and leaves it unmarked otherwise', async () => {
    const source = new InMemoryAdapter('cmms', {
      yes: { value: true, quality: 'live' }, text: { value: 'true', quality: 'live' }, one: { value: 1, quality: 'live' },
      no: { value: false, quality: 'live' }, zero: { value: 0, quality: 'live' }, word: { value: 'running', quality: 'live' },
    });
    const node = (id: string, ref: string) => ({
      id, x: 0, y: 0, width: 10, height: 10, anchored: false,
      widget: { type: 'status', props: {}, bindings: { $highlight: { adapter: 'cmms', ref } } },
      highlight: { from: '$highlight' },
    });
    const refs = ['yes', 'text', 'one', 'no', 'zero', 'word', 'missing'];
    const doc: CanvasView = { kind: 'canvas', background: {}, connectors: [], nodes: refs.map(ref => node(ref, ref)) };
    const resolved = await resolveDocument(doc, [source]);
    expect(resolved.nodes.filter(n => n.highlighted).map(n => n.id)).toEqual(['yes', 'text', 'one']);
    // A node without a highlight rule is never marked, whatever it reads.
    const plain = await resolveDocument({ ...doc, nodes: [{ ...node('yes', 'yes'), highlight: undefined }] }, [source]);
    expect(plain.nodes[0]!.highlighted).toBeUndefined();
  });

  it('fades a node while its dim reading says yes — the opposite of a highlight, read the same way', async () => {
    const source = new InMemoryAdapter('cmms', { yes: { value: true, quality: 'live' }, no: { value: false, quality: 'live' } });
    const node = (id: string, ref: string) => ({
      id, x: 0, y: 0, width: 10, height: 10, anchored: false,
      widget: { type: 'status', props: {}, bindings: { $dim: { adapter: 'cmms', ref } } },
      dim: { from: '$dim' },
    });
    const doc: CanvasView = { kind: 'canvas', background: {}, connectors: [], nodes: [node('a', 'yes'), node('b', 'no'), node('c', 'missing')] };
    const resolved = await resolveDocument(doc, [source]);
    expect(resolved.nodes.filter(n => n.dimmed).map(n => n.id)).toEqual(['a']);
    expect(resolved.nodes.some(n => n.highlighted)).toBe(false);
  });

  it('measures a state read against the clock from the moment it is given, the current time when it is not', async () => {
    const source = new InMemoryAdapter('cmms', { start: { value: '2026-10-23T03:30:00Z', quality: 'live' } });
    const rule = { from: 'when', map: { relativeTo: 'now' as const, ranges: [{ max: 0, value: 'past' }, { min: 0, max: 3600, value: 'soon' }], otherwise: 'later' } };
    const doc: CanvasView = {
      kind: 'canvas',
      background: {},
      connectors: [],
      nodes: [{ id: 'n1', x: 0, y: 0, width: 10, height: 10, anchored: false, widget: { type: 'status', props: {}, bindings: { when: { adapter: 'cmms', ref: 'start' } } }, states: rule }],
    };
    const at = Date.parse('2026-10-23T03:00:00Z');
    expect((await resolveDocument(doc, [source], at)).nodes[0]!.state).toBe('soon');
    // A screen whose own clock runs an hour behind the source's passes the corrected one.
    expect((await resolveDocument(doc, [source], at + 3_600_000)).nodes[0]!.state).toBe('past');
    // Without one the document is read now, which is long past that time.
    expect((await resolveDocument(doc, [source])).nodes[0]!.state).toBe('past');
  });

  it('passes the background through, and an unbound connector as it is', async () => {
    const doc: CanvasView = {
      kind: 'canvas',
      background: { image: { src: 'plan.png', width: 800, height: 600 } },
      nodes: [],
      connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
    };

    const resolved = await resolveDocument(doc, []);

    expect(resolved.background).toEqual(doc.background);
    expect(resolved.connectors).toEqual([{ ...doc.connectors[0], quality: {} }]);
    expect(resolved.kind).toBe('canvas');
  });

  it('reads a connector’s bound label and style, in the form each draws, keeping the static value otherwise', async () => {
    const readings: Record<string, ResolvedBinding> = {
      '/bps': { value: 26.78, quality: 'live' },
      '/load': { value: 85, quality: 'live' },
      '/state': { value: 'blinking', quality: 'live' },
      '/gone': { value: undefined, quality: 'disconnected' },
    };
    const link: Adapter = { id: 'nms', resolve: async ref => readings[ref as string] };
    const doc: CanvasView = {
      kind: 'canvas', background: {}, nodes: [],
      connectors: [{
        id: 'c', fromNodeId: 'a', toNodeId: 'b', label: 'N/A', style: { stroke: '#94a3b8', dash: 'solid' },
        bindings: {
          label: { adapter: 'nms', ref: '/bps' },
          'style.strokeWidth': { adapter: 'nms', ref: '/load', map: { ranges: [{ max: 50, value: 2 }, { min: 50, value: 5 }] } },
          'style.dash': { adapter: 'nms', ref: '/state' }, // not one of the three words: static stays
          'style.stroke': { adapter: 'nms', ref: '/gone' },
        },
      }],
    };
    const [resolved] = (await resolveDocument(doc, [link])).connectors;
    expect(resolved.label).toBe('26.78');
    expect(resolved.style).toEqual({ stroke: '#94a3b8', dash: 'solid', strokeWidth: 5 });
    expect(resolved.quality).toEqual({ label: 'live', 'style.strokeWidth': 'live', 'style.dash': 'live', 'style.stroke': 'disconnected' });
  });

  it('fills a bound label’s {{value}} with the reading — its unit and digits stay — and a dash while there is none', async () => {
    const readings: Record<string, ResolvedBinding> = { '/up': { value: 820.44, quality: 'live' }, '/down': { value: '96', quality: 'stale' }, '/gone': { value: undefined, quality: 'disconnected' } };
    const nms: Adapter = { id: 'nms', resolve: async ref => readings[ref as string] };
    const link = (id: string, ref: string, label: string): CanvasView['connectors'][number] => ({ id, fromNodeId: 'a', toNodeId: 'b', label, bindings: { label: { adapter: 'nms', ref } } });
    const doc: CanvasView = {
      kind: 'canvas', background: {}, nodes: [],
      connectors: [link('up', '/up', '{{value | fixed:1}} Mbps'), link('down', '/down', '↓ {{value}} Mbps'), link('gone', '/gone', '{{value | fixed:1}} Mbps'), link('plain', '/up', 'N/A')],
    };
    expect((await resolveDocument(doc, [nms])).connectors.map(c => c.label)).toEqual(['820.4 Mbps', '↓ 96 Mbps', '— Mbps', '820.44']);
  });

  it('turns a connector’s arrow by a value’s sign — a value map from ranges to arrows — and keeps the static one for a word it does not know', async () => {
    const flows: Record<string, ResolvedBinding> = { '/in': { value: 12.5, quality: 'live' }, '/out': { value: -3, quality: 'live' }, '/odd': { value: 'up', quality: 'live' } };
    const ems: Adapter = { id: 'ems', resolve: async ref => flows[ref as string] };
    const bySign = { ranges: [{ max: 0, value: 'start' }, { min: 0, value: 'end' }] };
    const connector = (ref: string, map?: typeof bySign): CanvasView['connectors'][number] => ({
      id: ref, fromNodeId: 'grid', toNodeId: 'ess', style: { arrow: 'none' }, bindings: { 'style.arrow': { adapter: 'ems', ref, ...(map && { map }) } },
    });
    const doc: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [connector('/in', bySign), connector('/out', bySign), connector('/odd')] };
    expect((await resolveDocument(doc, [ems])).connectors.map(c => c.style?.arrow)).toEqual(['end', 'start', 'none']);
  });

  it('reports a disconnected binding per node without dropping the node', async () => {
    const doc: CanvasView = {
      kind: 'canvas',
      background: {},
      nodes: [
        {
          id: 'n1',
          x: 0,
          y: 0,
          anchored: false,
          widget: {
            type: 'uw-status',
            bindings: { value: { adapter: 'cmms', ref: 'pump-b.state' } },
          },
        },
      ],
      connectors: [],
    };

    const resolved = await resolveDocument(doc, [cmms]);

    // The node stays; a disconnected reading's value is not shown, even though the adapter sent one.
    expect(resolved.nodes).toHaveLength(1);
    expect(resolved.nodes[0].widget.props).not.toHaveProperty('value');
    expect(resolved.nodes[0].widget.quality.value).toBe('disconnected');
  });

  it('resolves an empty document to an empty node list', async () => {
    const doc: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    const resolved = await resolveDocument(doc, []);
    expect(resolved.nodes).toEqual([]);
  });

  it('resolves a grid view item by item, keeping the order and the room each takes', async () => {
    const doc: GridView = {
      kind: 'grid',
      items: [
        { id: 'a', span: 6, widget: { type: 'status', bindings: { value: { adapter: 'cmms', ref: 'pump-a.state' } } } },
        { id: 'b', widget: { type: 'markdown', props: { content: 'note' } } },
      ],
      appearance: 'dark',
    };
    const resolved = await resolveDocument(doc, [cmms]);
    expect(resolved.kind).toBe('grid');
    expect(resolved.appearance).toBe('dark');
    expect(resolved.items.map(item => [item.id, item.span])).toEqual([['a', 6], ['b', undefined]]);
    const [a, b] = placedIn(resolved);
    expect(a.widget.props.value).toBe('running');
    expect(a.widget.quality).toEqual({ value: 'live' });
    expect(b.widget.props).toEqual({ content: 'note' });
  });

  it('names each part’s state from the source’s reading — before the prop’s own map — on both kinds', async () => {
    const pumps = new InMemoryAdapter('plant', {
      'p1': { value: 'Fault', quality: 'live' },
      'p2': { value: 'Running', quality: 'stale' },
      'p3': { value: undefined, quality: 'disconnected' },
    });
    const states = { from: 'data.value', map: { values: { Fault: 'fault', Running: 'running' } } };
    const part = (id: string, ref: string) => ({
      id,
      widget: { type: 'status', bindings: { 'data.value': { adapter: 'plant', ref, map: { values: { Fault: 'error' } } } } },
      states,
    });
    const canvas: CanvasView = {
      kind: 'canvas', background: {}, connectors: [],
      nodes: [{ ...part('a', 'p1'), x: 0, y: 0, anchored: false }, { ...part('b', 'p2'), x: 0, y: 0, anchored: false }, { ...part('c', 'p3'), x: 0, y: 0, anchored: false }],
    };
    const resolved = await resolveDocument(canvas, [pumps]);
    expect(resolved.nodes.map(n => n.state)).toEqual(['fault', 'running', undefined]);
    // The prop still takes its own map; the state read the source’s word.
    expect(resolved.nodes[0].widget.props).toEqual({ data: { value: 'error' } });
    expect('state' in resolved.nodes[2]).toBe(false);

    const grid: GridView = { kind: 'grid', items: [part('a', 'p1')] };
    expect(placedIn(await resolveDocument(grid, [pumps]))[0].state).toBe('fault');
  });
});

describe('a box shape that shows a state', () => {
  const plant = new InMemoryAdapter('plant', { '/zone/a': { value: 'alarm', quality: 'live' }, '/zone/b': { value: true, quality: 'live' }, '/zone/gone': { value: undefined, quality: 'disconnected' } });
  const box = { id: 'zone', type: 'rect' as const, x: 0, y: 0, width: 100, height: 60, fill: 'none', stroke: 'idle' };

  it('reads its outline, its fill and its hatch from its bindings — a value of another form, or none, leaves the static one', async () => {
    const doc: CanvasView = {
      kind: 'canvas', background: {}, nodes: [], connectors: [],
      decorations: [
        { ...box, bindings: { stroke: { adapter: 'plant', ref: '/zone/a' }, fill: { adapter: 'plant', ref: '/zone/a' }, hatch: { adapter: 'plant', ref: '/zone/b' } } },
        { ...box, id: 'other', bindings: { stroke: { adapter: 'plant', ref: '/zone/b' }, fill: { adapter: 'plant', ref: '/zone/gone' }, hatch: { adapter: 'plant', ref: '/zone/a' } } },
        { id: 'plain', type: 'rect', x: 0, y: 0, width: 5, height: 5 },
        { id: 'note', type: 'text', x: 0, y: 0, text: 'North' },
      ],
    };
    const resolved = await resolveDocument(doc, [plant]);
    expect(resolved.decorations![0]).toMatchObject({ stroke: 'alarm', fill: 'alarm', hatch: true });
    // a boolean is no colour, a disconnected reading has no value, a word is no hatch: the static values stay
    expect(resolved.decorations![1]).toMatchObject({ stroke: 'idle', fill: 'none' });
    expect(resolved.decorations![1]).not.toHaveProperty('hatch');
    expect(resolved.decorations![2]).toEqual(doc.decorations![2]);
    expect(resolved.decorations![3]).toEqual(doc.decorations![3]);
    // a canvas cell of a grid reads its shapes too
    const grid: GridView = { kind: 'grid', items: [{ id: 'cell', span: 12, canvas: { size: [200, 100], nodes: [], connectors: [], decorations: [doc.decorations![0]] } } as never] };
    const cell = (await resolveDocument(grid, [plant])).items[0] as { canvas: { decorations: unknown[] } };
    expect(cell.canvas.decorations[0]).toMatchObject({ stroke: 'alarm', hatch: true });
  });

  it("reads its outline's line style and width — a word of the line styles and a positive number; anything else leaves the static one", async () => {
    const form = new InMemoryAdapter('form', {
      '/dash/ok': { value: 'flowing', quality: 'live' }, '/dash/bad': { value: 'wavy', quality: 'live' },
      '/width/ok': { value: 3, quality: 'live' }, '/width/zero': { value: 0, quality: 'live' }, '/width/text': { value: 'thick', quality: 'live' },
    });
    const doc: CanvasView = {
      kind: 'canvas', background: {}, nodes: [], connectors: [],
      decorations: [
        { ...box, dash: 'dashed', strokeWidth: 1.5, bindings: { dash: { adapter: 'form', ref: '/dash/ok' }, strokeWidth: { adapter: 'form', ref: '/width/ok' } } },
        { ...box, id: 'other', dash: 'dashed', strokeWidth: 1.5, bindings: { dash: { adapter: 'form', ref: '/dash/bad' }, strokeWidth: { adapter: 'form', ref: '/width/zero' } } },
        { ...box, id: 'third', strokeWidth: 1.5, bindings: { strokeWidth: { adapter: 'form', ref: '/width/text' } } },
      ],
    };
    const resolved = await resolveDocument(doc, [form]);
    expect(resolved.decorations![0]).toMatchObject({ dash: 'flowing', strokeWidth: 3 });
    expect(resolved.decorations![1]).toMatchObject({ dash: 'dashed', strokeWidth: 1.5 });
    expect(resolved.decorations![2]).toMatchObject({ strokeWidth: 1.5 });
    expect(resolved.decorations![2]).not.toHaveProperty('dash');
  });

  it('leaves a document without decorations as it was', async () => {
    const doc: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    expect(await resolveDocument(doc, [plant])).not.toHaveProperty('decorations');
  });
});

describe('placedIn', () => {
  const widget = { type: 'gauge' };
  it("walks a canvas view's nodes and a grid view's items, resolved or not", async () => {
    const canvas: CanvasView = { kind: 'canvas', background: {}, connectors: [], nodes: [{ id: 'n', x: 0, y: 0, anchored: false, widget }] };
    const grid: GridView = { kind: 'grid', items: [{ id: 'i', widget }, { id: 'j', widget }] };
    expect(placedIn(canvas).map(p => p.id)).toEqual(['n']);
    expect(placedIn(grid).map(p => p.id)).toEqual(['i', 'j']);
    expect(placedIn(await resolveDocument(grid, [])).map(p => p.widget.quality)).toEqual([{}, {}]);
  });
});
