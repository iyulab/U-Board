import { describe, it, expect } from 'vitest';
import { resolveDocument } from './resolve-document';
import type { Adapter, ResolvedBinding } from './adapter';
import type { ViewDocument } from './view-document';

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
    const doc: ViewDocument = {
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

  it('passes background and connectors through unchanged', async () => {
    const doc: ViewDocument = {
      kind: 'canvas',
      background: { image: { src: 'plan.png', width: 800, height: 600 } },
      nodes: [],
      connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
    };

    const resolved = await resolveDocument(doc, []);

    expect(resolved.background).toEqual(doc.background);
    expect(resolved.connectors).toEqual(doc.connectors);
    expect(resolved.kind).toBe('canvas');
  });

  it('reports a disconnected binding per node without dropping the node', async () => {
    const doc: ViewDocument = {
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

    expect(resolved.nodes[0].widget.props.value).toBe('stopped');
    expect(resolved.nodes[0].widget.quality.value).toBe('disconnected');
  });

  it('resolves an empty document to an empty node list', async () => {
    const doc: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    const resolved = await resolveDocument(doc, []);
    expect(resolved.nodes).toEqual([]);
  });
});
