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

/** Moves the item with `id` one place earlier (`-1`) or later (`1`) in the order; at either end, unchanged. */
export function moveGridItem(doc: GridView, id: string, by: -1 | 1): GridView {
  const from = doc.items.findIndex(item => item.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= doc.items.length) return doc;
  const items = [...doc.items];
  [items[from], items[to]] = [items[to], items[from]];
  return { ...doc, items };
}

export function removeGridItem(doc: GridView, id: string): GridView {
  return { ...doc, items: doc.items.filter(item => item.id !== id) };
}
