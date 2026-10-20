import { describe, it, expect } from 'vitest';
import { isCanvasItem, placedAt, placedIn, type GridView } from './view-document';
import { validateViewDocument } from './validate-view-document';
import { bindingsIn } from './document-bindings';
import { resolveDocument } from './resolve-document';
import { lintViewDocument } from './lint-view-document';
import { applyEditCommands } from './edit-commands';
import type { Adapter, ResolvedBinding } from './adapter';
import { cellAsCanvas, duplicateGridItem, idsIn, removeGridItem, withCellCanvas } from './editing/grid-editing';

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
  it('is a valid document, its nodes nameable by the board’s triggers', () => {
    expect(validateViewDocument(mixed(), { strict: true })).toEqual([]);
    expect(isCanvasItem(mixed().items[1])).toBe(true);
    expect(isCanvasItem(mixed().items[0])).toBe(false);
  });

  it('holds a widget or a canvas, not both, and only the spatial layer', () => {
    const doc = mixed() as any;
    doc.items[1].widget = { type: 'gauge' };
    doc.items[1].canvas.components = {};
    expect(validateViewDocument(doc, { strict: true }).map(issue => issue.path)).toEqual(['/items/1/widget', '/items/1/canvas/components']);
  });

  it('keeps ids unique across the document, and a connector within its cell', () => {
    const doc = mixed() as any;
    doc.items[0].id = 'tank';
    doc.items.push({ id: 'other', canvas: { background: {}, nodes: [node('valve', 'v')], connectors: [{ id: 'c2', fromNodeId: 'valve', toNodeId: 'pump' }] } });
    const issues = validateViewDocument(doc);
    expect(issues.map(issue => issue.path)).toEqual(['/items/1/canvas/nodes/1/id', '/items/2/canvas/connectors/0/toNodeId']);
    expect(issues[1].message).toBe('no node has the id "pump" — a connector joins two nodes of /items/2/canvas/nodes — the same cell');
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

  it('duplicates under fresh ids for every part, and its removal takes the triggers naming its nodes', () => {
    const copy = duplicateGridItem(mixed(), 'plan', 'plan-2');
    expect(copy.items.map(item => item.id)).toEqual(['kpi', 'plan', 'plan-2']);
    const cell = copy.items[2];
    if (!isCanvasItem(cell)) throw new Error('expected the canvas cell');
    expect(cell.canvas.nodes.map(n => n.id)).toEqual(['pump-2', 'tank-2']);
    expect(cell.canvas.connectors[0]).toMatchObject({ id: 'line-2', fromNodeId: 'pump-2', toNodeId: 'tank-2' });
    expect(cell.canvas.decorations![0].id).toBe('hall-2');
    expect(validateViewDocument(copy, { strict: true })).toEqual([]);
    expect(duplicateGridItem(mixed(), 'plan', 'tank')).toEqual(mixed());
    expect([...idsIn(mixed())].sort()).toEqual(['hall', 'kpi', 'line', 'plan', 'pump', 'tank']);

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

  it('takes a cell’s parts in the remove command — a node with its lines and the triggers naming it', () => {
    const after = applyEditCommands(mixed(), [{ command: 'remove', ids: ['pump', 'hall'] }]);
    const cell = after.items[1];
    if (after.kind !== 'grid' || !isCanvasItem(cell)) throw new Error('expected the grid and its canvas cell');
    expect(cell.canvas.nodes.map(n => n.id)).toEqual(['tank']);
    expect(cell.canvas.connectors).toEqual([]);
    expect(cell.canvas.decorations).toEqual([]);
    expect(after.triggers).toBeUndefined();
    expect(validateViewDocument(after, { strict: true })).toEqual([]);
    expect(() => applyEditCommands(mixed(), [{ command: 'remove', ids: ['nope'] }])).toThrow('no item, and no node, connector or decoration of a canvas cell, has the id "nope"');
  });
});

