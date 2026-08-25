import { describe, it, expect } from 'vitest';
import type { ViewDocument } from './view-document';

// A Walking-Skeleton-shaped example (docs/../kickoff §9): a background image, one anchored node
// carrying a status widget bound to an external value, one freely-placed node with no binding,
// and a connector between them. Exercises every field the type declares.
const example: ViewDocument = {
  kind: 'canvas',
  background: {
    image: { src: 'https://example.com/floor-plan.png', width: 1200, height: 800 },
  },
  nodes: [
    {
      id: 'node-1',
      x: 320,
      y: 140,
      anchored: true,
      widget: {
        type: 'uw-status',
        props: { label: 'Pump A' },
        bindings: {
          value: { adapter: 'cmms', ref: { assetId: 'pump-a', field: 'runningState' } },
        },
      },
    },
    {
      id: 'node-2',
      x: 40,
      y: 40,
      anchored: false,
      widget: { type: 'uw-metric', props: { label: 'Note' } },
    },
  ],
  connectors: [{ id: 'conn-1', fromNodeId: 'node-1', toNodeId: 'node-2' }],
  decorations: [
    { id: 'deco-1', type: 'rect', x: 0, y: 0, width: 400, height: 300, stroke: '#334155' },
    { id: 'deco-2', type: 'text', x: 8, y: 8, text: 'Core Banking' },
  ],
};

describe('ViewDocument', () => {
  it('accepts a fully-populated example document', () => {
    expect(example.kind).toBe('canvas');
    expect(example.nodes).toHaveLength(2);
  });

  it('accepts a minimal document with no background, no bindings, and no decorations', () => {
    const minimal: ViewDocument = {
      kind: 'canvas',
      background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'uw-metric' } }],
      connectors: [],
    };
    expect(minimal.background.image).toBeUndefined();
    expect(minimal.decorations).toBeUndefined();
  });

  it('round-trips through JSON without losing or changing data', () => {
    const roundTripped = JSON.parse(JSON.stringify(example));
    expect(roundTripped).toEqual(example);
  });
});
