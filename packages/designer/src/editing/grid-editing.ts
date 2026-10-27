import { isCanvasItem, type CanvasView, type CellCanvas, type GridCanvasItem, type GridItem, type GridLayout, type GridView, type GridWidgetItem } from '@iyulab/u-board/picture';
import { triggersWithout, withTriggers } from './trigger-editing.js';

/** What can change on a grid item: its room, and its widget and states or its canvas — whichever it holds. */
export type GridItemChange = Partial<GridLayout & Pick<GridWidgetItem, 'widget' | 'states'> & Pick<GridCanvasItem, 'canvas'>>;

/** The item with `id` changed by `change` — a field set to `undefined` is left out, so the document says only what
 *  differs from the default. */
export function updateGridItem(doc: GridView, id: string, change: GridItemChange): GridView {
  return {
    ...doc,
    items: doc.items.map(item => {
      if (item.id !== id) return item;
      const next: Record<string, unknown> = { ...item, ...change };
      for (const key of Object.keys(change)) if (next[key] === undefined) delete next[key];
      return next as unknown as GridItem;
    }),
  };
}

/** Moves the item with `id` to place `to` in the order, the others closing up behind it — one place earlier or later
 *  (a button, a key), or wherever it is dropped. A place past either end, or the one it is in, leaves the order as it is. */
export function moveGridItem(doc: GridView, id: string, to: number): GridView {
  const from = doc.items.findIndex(item => item.id === id);
  if (from < 0 || from === to || to < 0 || to >= doc.items.length) return doc;
  const items = [...doc.items];
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved);
  return { ...doc, items };
}

/** The place of the item with `id` in the order, or -1. */
export function gridItemIndex(doc: GridView, id: string): number {
  return doc.items.findIndex(item => item.id === id);
}

/** Removes the item with `id` — and, for a canvas, the triggers that name its nodes along with those naming it. */
export function removeGridItem(doc: GridView, id: string): GridView {
  const item = doc.items.find(existing => existing.id === id);
  const gone = new Set([id, ...(item && isCanvasItem(item) ? item.canvas.nodes.map(node => node.id) : [])]);
  return withTriggers({ ...doc, items: doc.items.filter(existing => existing.id !== id) }, triggersWithout(doc.triggers, gone));
}

/** The canvas cell with `id` as a canvas board of its own — its spatial layer with what the board defines once —
 *  for the canvas editor to edit; `withCellCanvas` writes what it made back. */
export function cellAsCanvas(doc: GridView, id: string): CanvasView | null {
  const item = doc.items.find(existing => existing.id === id);
  if (!item || !isCanvasItem(item)) return null;
  const board = Object.fromEntries(Object.entries(boardOf(doc)).filter(([, value]) => value !== undefined));
  return { kind: 'canvas', ...item.canvas, ...board };
}

/** `doc` with the canvas cell `id` made `canvas`: the spatial layer goes to the cell, and what the board defines once
 *  — its elements, symbols, triggers, appearance and accent — to the board. */
export function withCellCanvas(doc: GridView, id: string, canvas: CanvasView): GridView {
  const { background, nodes, connectors, decorations } = canvas;
  const cell: CellCanvas = { background, nodes, connectors, ...(decorations && { decorations }) };
  const items = doc.items.map(item => (item.id === id && isCanvasItem(item) ? { ...item, canvas: cell } : item));
  const next: Record<string, unknown> = { ...doc, items };
  for (const [key, value] of Object.entries(boardOf(canvas))) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  return next as unknown as GridView;
}

/** What a board defines once, whichever its kind. */
function boardOf(doc: GridView | CanvasView): Pick<GridView, 'appearance' | 'accent' | 'elements' | 'symbols' | 'triggers'> {
  const { appearance, accent, elements, symbols, triggers } = doc;
  return { appearance, accent, elements, symbols, triggers };
}
