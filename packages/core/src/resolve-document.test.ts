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
    expect(resolved.items[0].widget.props.value).toBe('running');
    expect(resolved.items[0].widget.quality).toEqual({ value: 'live' });
    expect(resolved.items[1].widget.props).toEqual({ content: 'note' });
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
