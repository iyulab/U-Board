import type { GridItem, GridView } from '../view-document.js';

/** An id for a new grid item. */
export const newGridItemId = (): string => `item-${crypto.randomUUID()}`;

/** Adds `item` after the one with `afterId`, or at the end when there is none. */
export function addGridItem(doc: GridView, item: GridItem, afterId?: string | null): GridView {
  const at = afterId ? doc.items.findIndex(existing => existing.id === afterId) + 1 : 0;
  const index = at > 0 ? at : doc.items.length;
  return { ...doc, items: [...doc.items.slice(0, index), item, ...doc.items.slice(index)] };
}

/** The item with `id` changed by `change` — a field set to `undefined` is left out, so the document says only what
 *  differs from the default. */
export function updateGridItem(doc: GridView, id: string, change: Partial<Omit<GridItem, 'id'>>): GridView {
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

export function removeGridItem(doc: GridView, id: string): GridView {
  return { ...doc, items: doc.items.filter(item => item.id !== id) };
}
