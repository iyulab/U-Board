import { describe, it, expect } from 'vitest';
import { bindingsIn, isCanvasItem, lintViewDocument, placedAt, placedIn, resolveDocument, type GridView } from '@iyulab/u-board/picture';
import type { Adapter, ResolvedBinding } from '@iyulab/u-board/domain';
import { cellAsCanvas, removeGridItem, withCellCanvas } from './editing/grid-editing';

// A grid whose cell holds a canvas — a mixed board: the spatial panel in one cell, cards around it.
const bound = (ref: string) => ({ type: 'status', bindings: { 'data.value': { adapter: 'plant', ref } } });
const node = (id: string, ref: string, x = 0) => ({ id, x, y: 0, width: 100, height: 60, anchored: false, widget: bound(ref) });
const mixed = (): GridView => ({
  kind: 'grid',
  items: [
    { id: 'kpi', span: 3, widget: bound('kpi') },
    {
      id: 'plan',
      span: 9,
      canvas: {
        background: {},
        nodes: [node('pump', 'p1'), node('tank', 'p2', 200)],
        connectors: [{ id: 'line', fromNodeId: 'pump', toNodeId: 'tank', label: '{{value}} m³/h', bindings: { label: { adapter: 'plant', ref: 'flow' } } }],
        decorations: [{ id: 'hall', type: 'rect', x: -10, y: -10, width: 330, height: 90, label: 'Hall' }],
      },
    },
  ],
  triggers: [{ on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'pump' }] }],
});

describe('a grid cell holding a canvas', () => {
  it('tells a canvas cell from a widget cell', () => {
    expect(isCanvasItem(mixed().items[1])).toBe(true);
    expect(isCanvasItem(mixed().items[0])).toBe(false);
  });

  it('is walked with the rest: its nodes placed, each binding at its path', () => {
    const doc = mixed();
    expect(placedIn(doc).map(placed => placed.id)).toEqual(['kpi', 'pump', 'tank']);
    expect(placedAt(doc).map(({ at }) => at)).toEqual(['/items/0', '/items/1/canvas/nodes/0', '/items/1/canvas/nodes/1']);
    expect([...bindingsIn(doc)].map(({ at }) => at)).toEqual([
      '/items/0/widget/bindings/data.value',
      '/items/1/canvas/nodes/0/widget/bindings/data.value',
      '/items/1/canvas/nodes/1/widget/bindings/data.value',
      '/items/1/canvas/connectors/0/bindings/label',
    ]);
  });

  it('resolves its nodes and connectors as a canvas board’s', async () => {
    const reads: Record<string, ResolvedBinding> = { kpi: { value: 98, quality: 'live' }, p1: { value: 'Running', quality: 'live' }, flow: { value: 12, quality: 'stale' } };
    const plant: Adapter = { id: 'plant', resolve: async ref => reads[ref as string] ?? { value: undefined, quality: 'disconnected' } };
    const resolved = await resolveDocument(mixed(), [plant]);
    const cell = resolved.items[1];
    if (!isCanvasItem(cell)) throw new Error('expected the canvas cell');
    expect(cell.canvas.nodes.map(n => n.widget.quality)).toEqual([{ 'data.value': 'live' }, { 'data.value': 'disconnected' }]);
    expect(cell.canvas.connectors[0]).toMatchObject({ label: '12 m³/h', quality: { label: 'stale' } });
    expect(cell.canvas.decorations?.map(shape => shape.id)).toEqual(['hall']);
  });

  it('is laid out as a canvas board is checked — the advice at its path', () => {
    const doc = mixed() as any;
    doc.items[1].canvas.nodes[1].x = 50;
    const advice = lintViewDocument(doc);
    const overlap = advice.find(a => a.path === '/items/1/canvas/nodes/0');
    expect(overlap?.message).toContain('/items/1/canvas/nodes/1');
  });

  it('is removed with the triggers naming its nodes', () => {
    const removed = removeGridItem(mixed(), 'plan');
    expect(removed.items.map(item => item.id)).toEqual(['kpi']);
    expect(removed.triggers).toBeUndefined();
  });

  it('is edited as a canvas board of its own: the spatial layer back to the cell, what the board defines to the board', () => {
    const board = cellAsCanvas(mixed(), 'plan')!;
    expect(board).toMatchObject({ kind: 'canvas', nodes: [{ id: 'pump' }, { id: 'tank' }], triggers: mixed().triggers });
    expect(cellAsCanvas(mixed(), 'kpi')).toBeNull();
    const edited = withCellCanvas(mixed(), 'plan', { ...board, nodes: board.nodes.slice(0, 1), connectors: [], appearance: 'dark', triggers: undefined });
    const cell = edited.items[1];
    if (!isCanvasItem(cell)) throw new Error('expected the canvas cell');
    expect(cell.canvas).toEqual({ background: {}, nodes: [board.nodes[0]], connectors: [], decorations: board.decorations });
    expect(edited.appearance).toBe('dark');
    expect('triggers' in edited).toBe(false);
    expect(edited.items[0]).toEqual(mixed().items[0]);
  });

});
