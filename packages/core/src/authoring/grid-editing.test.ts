import { describe, it, expect } from 'vitest';
import { addGridItem, moveGridItem, newGridItemId, removeGridItem, updateGridItem } from './grid-editing';
import type { GridView } from '../view-document';

const widget = { type: 'gauge' };
const grid = (): GridView => ({ kind: 'grid', items: [{ id: 'a', widget }, { id: 'b', span: 6, widget }, { id: 'c', widget }] });
const ids = (doc: GridView) => doc.items.map(item => item.id);

describe('grid editing', () => {
  it('adds an item after the selected one, or at the end', () => {
    const item = { id: 'new', widget: { type: 'status' } };
    expect(ids(addGridItem(grid(), item, 'a'))).toEqual(['a', 'new', 'b', 'c']);
    expect(ids(addGridItem(grid(), item))).toEqual(['a', 'b', 'c', 'new']);
    expect(ids(addGridItem(grid(), item, 'gone'))).toEqual(['a', 'b', 'c', 'new']);
    expect(newGridItemId()).not.toBe(newGridItemId());
  });

  it('moves an item one place earlier or later, and leaves it at either end', () => {
    expect(ids(moveGridItem(grid(), 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(ids(moveGridItem(grid(), 'b', 1))).toEqual(['a', 'c', 'b']);
    const doc = grid();
    expect(moveGridItem(doc, 'a', -1)).toBe(doc);
    expect(moveGridItem(doc, 'c', 1)).toBe(doc);
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
