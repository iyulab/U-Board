import { describe, it, expect, vi } from 'vitest';
import { partNamer } from './part-names';
import { triggerEditing } from './TriggersEditor';
import type { CanvasView } from '../view-document';

const board: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: [
    { id: 'hall', x: 0, y: 0, anchored: false, caption: 'Hall', widget: { type: 'status' } },
    { id: 'n2', x: 0, y: 0, anchored: false, widget: { type: 'gauge' } },
  ],
  connectors: [],
  components: {
    card: {
      params: { type: 'object', properties: { machine: { type: 'string' } } },
      nodes: [
        { id: 'temp', x: 0, y: 0, caption: '{{machine}} temp', widget: { type: 'gauge' }, states: { from: 'v', map: { otherwise: 'ok' } } },
        { id: 'speed', x: 0, y: 100, widget: { type: 'status' } },
      ],
    },
  },
  instances: [{ id: 'p1', component: 'card', x: 300, y: 0, anchored: false, params: { machine: 'Press 1' } }],
};

describe('partNamer', () => {
  it('names the board’s nodes as ever, and an instance’s parts by the instance and the part as drawn', () => {
    const name = partNamer(board);
    expect(name('hall')).toBe('Hall');
    expect(name('n2')).toBe('Gauge 2');
    expect(name('p1/temp')).toBe('p1 › Press 1 temp');
    expect(name('p1/speed')).toBe('p1 › Status');
    expect(name('nowhere')).toBe('nowhere');
  });
});

describe('triggerEditing on a board with instances', () => {
  it('offers the parts instances draw, with their states, to name in a trigger', () => {
    const editing = triggerEditing(board, vi.fn());
    expect(editing.parts).toEqual(['hall', 'n2', 'p1/temp', 'p1/speed']);
    expect(editing.stateNamesOf('p1/temp')).toEqual(['ok']);
    expect(editing.nameOf?.('p1/temp')).toBe('p1 › Press 1 temp');
  });
});
