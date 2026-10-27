import { describe, it, expect } from 'vitest';
import { gridItemIndex, moveGridItem, removeGridItem, updateGridItem } from './grid-editing';
import type { GridView } from '@iyulab/u-board/picture';

const widget = { type: 'gauge' };
const grid = (): GridView => ({ kind: 'grid', items: [{ id: 'a', widget }, { id: 'b', span: 6, widget }, { id: 'c', widget }] });
const ids = (doc: GridView) => doc.items.map(item => item.id);

describe('grid editing', () => {
  it('moves an item to a place — one earlier or later, or where it is dropped — and leaves it past either end', () => {
    expect(ids(moveGridItem(grid(), 'b', 0))).toEqual(['b', 'a', 'c']);
    expect(ids(moveGridItem(grid(), 'b', 2))).toEqual(['a', 'c', 'b']);
    // Dropped further away, the others close up behind it.
    expect(ids(moveGridItem(grid(), 'a', 2))).toEqual(['b', 'c', 'a']);
    expect(ids(moveGridItem(grid(), 'c', 0))).toEqual(['c', 'a', 'b']);
    const doc = grid();
    expect(moveGridItem(doc, 'a', -1)).toBe(doc);
    expect(moveGridItem(doc, 'c', 3)).toBe(doc);
    expect(moveGridItem(doc, 'b', 1)).toBe(doc);
    expect(gridItemIndex(doc, 'c')).toBe(2);
  });

  it('sets an item’s room, and leaves out a field set back to its default', () => {
    const wider = updateGridItem(grid(), 'a', { span: 8, height: 200 });
    expect(wider.items[0]).toEqual({ id: 'a', widget, span: 8, height: 200 });
    expect(updateGridItem(wider, 'a', { height: undefined }).items[0]).toEqual({ id: 'a', widget, span: 8 });
    expect(updateGridItem(grid(), 'b', { widget: { type: 'status' } }).items[1]).toEqual({ id: 'b', span: 6, widget: { type: 'status' } });
  });

  it('removes an item', () => {
    expect(ids(removeGridItem(grid(), 'b'))).toEqual(['a', 'c']);
  });
});
