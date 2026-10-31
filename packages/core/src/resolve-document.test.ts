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
