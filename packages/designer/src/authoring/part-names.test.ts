import { describe, it, expect, vi } from 'vitest';
import { partNamer } from './part-names';
import { triggerEditing } from './TriggersEditor';
import type { CanvasView } from '@iyulab/u-board/picture';

const board: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: [
    { id: 'hall', x: 0, y: 0, anchored: false, caption: 'Hall', widget: { type: 'status' } },
    { id: 'n2', x: 0, y: 0, anchored: false, widget: { type: 'gauge' }, states: { from: 'v', map: { otherwise: 'ok' } } },
  ],
  connectors: [],
};

describe('partNamer', () => {
  it('names a node by its caption, else by its widget type and place, and anything else by its id', () => {
    const name = partNamer(board);
    expect(name('hall')).toBe('Hall');
    expect(name('n2')).toBe('Gauge 2');
    expect(name('nowhere')).toBe('nowhere');
  });
});

describe('triggerEditing', () => {
  it('offers the parts the board places, with their states, to name in a trigger', () => {
    const editing = triggerEditing(board, vi.fn());
    expect(editing.parts).toEqual(['hall', 'n2']);
    expect(editing.stateNamesOf('n2')).toEqual(['ok']);
    expect(editing.nameOf?.('n2')).toBe('Gauge 2');
  });
});
