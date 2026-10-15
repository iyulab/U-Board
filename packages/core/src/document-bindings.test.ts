import { describe, it, expect } from 'vitest';
import { bindingsIn } from './document-bindings';
import type { ViewDocument } from './view-document';

describe('bindingsIn', () => {
  it('walks every widget’s bindings and, on a canvas board, every connector’s — with where each sits', () => {
    const doc: ViewDocument = {
      kind: 'canvas', background: {},
      nodes: [{ id: 'n', x: 0, y: 0, anchored: false, widget: { type: 'gauge', bindings: { 'data.value': { adapter: 'a', ref: 1 } } } }],
      connectors: [{ id: 'c', fromNodeId: 'n', toNodeId: 'n', bindings: { label: { adapter: 'b', ref: 2 } } }],
    };
    expect([...bindingsIn(doc)]).toEqual([
      { binding: { adapter: 'a', ref: 1 }, at: '/nodes/0/widget/bindings/data.value' },
      { binding: { adapter: 'b', ref: 2 }, at: '/connectors/0/bindings/label' },
    ]);
  });

  it('walks a grid board’s items', () => {
    const doc: ViewDocument = { kind: 'grid', items: [{ id: 'i', widget: { type: 'metric', bindings: { 'data.value': { adapter: 'a', ref: 1 } } } }] };
    expect([...bindingsIn(doc)].map(b => b.at)).toEqual(['/items/0/widget/bindings/data.value']);
  });
});
