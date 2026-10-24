import { describe, expect, it } from 'vitest';
import { toViewDocument } from '../board-v2/picture.js';
import type { BoardV2 } from '../board-v2/types.js';
import type { CanvasView } from '../view-document.js';
import { placesItself, withPictureLayout } from './board-layout.js';

const board: BoardV2 = {
  version: 2,
  data: {
    pumps: { from: 'plant', path: '/pumps', list: '/value', key: 'id', fields: { state: { state: { run: 'ok', '*': 'off' } } } },
    totals: { from: 'plant', path: '/totals' },
  },
  parts: {
    title: { as: 'label', title: 'Plant' },
    count: { as: 'stat', of: 'totals', show: 'count' },
    pump: { as: 'status-card', each: 'pumps', show: 'state' },
    unit: { as: 'group', size: [200, 100], parts: { a: { as: 'label', title: 'A' } }, place: { a: [0, 0, 100, 40] } },
  },
  layout: {
    kind: 'canvas', size: [800, 600],
    place: { title: [10, 10], count: [10, 60, 200, 100], pump: { P1: [300, 10, 200, 100], P2: [300, 120, 200, 100] }, unit: [10, 300] },
    links: { l1: { from: 'count', to: 'pump/P1' }, l2: { from: 'title', to: 'unit' } },
  },
  triggers: [
    { on: { event: 'click', part: 'count' }, do: [{ action: 'emit', name: 'count' }] },
    { on: { event: 'click', part: 'title' }, do: [{ action: 'focus', part: 'pump/P1' }] },
  ],
};
const picture = (b: BoardV2) => toViewDocument(b) as CanvasView;
/** The picture with node `id` moved by `change`. */
const moved = (b: BoardV2, id: string, change: Partial<CanvasView['nodes'][number]>): CanvasView => {
  const p = picture(b);
  return { ...p, nodes: p.nodes.map(n => (n.id === id ? { ...n, ...change } : n)) };
};

describe('withPictureLayout', () => {
  it('draws each part where the layout places it, so a node is where its place says', () => {
    const p = picture(board);
    expect(p.nodes.find(n => n.id === 'count')).toMatchObject({ x: 10, y: 60, width: 200, height: 100 });
    expect(p.nodes.find(n => n.id === 'pump/P2')).toMatchObject({ x: 300, y: 120 });
  });

  it('places a moved part where it is now — keeping a size-less place without a size, unless it was sized', () => {
    expect(withPictureLayout(board, picture(board), moved(board, 'title', { x: 40, y: 20 })).layout).toMatchObject({ place: { title: [40, 20] } });
    expect(withPictureLayout(board, picture(board), moved(board, 'title', { x: 40, y: 20, width: 160, height: 100 })).layout).toMatchObject({ place: { title: [40, 20] } });
    expect(withPictureLayout(board, picture(board), moved(board, 'title', { x: 40, y: 20, width: 240, height: 60 })).layout).toMatchObject({ place: { title: [40, 20, 240, 60] } });
    expect(withPictureLayout(board, picture(board), moved(board, 'count', { width: 260 })).layout).toMatchObject({ place: { count: [10, 60, 260, 100] } });
  });

  it('places a moved item of an each part inside the part’s entry, and nothing inside a group', () => {
    const next = withPictureLayout(board, picture(board), moved(board, 'pump/P2', { x: 520 }));
    expect(next.layout).toMatchObject({ place: { pump: { P1: [300, 10, 200, 100], P2: [520, 120, 200, 100] } } });
    expect(withPictureLayout(board, picture(board), moved(board, 'unit/a', { x: 99 }))).toBe(board);
    expect([placesItself(board, 'count'), placesItself(board, 'pump/P1'), placesItself(board, 'pump'), placesItself(board, 'unit/a')]).toEqual([true, true, false, false]);
  });

  it('leaves the board as it is when nothing moved', () => {
    expect(withPictureLayout(board, picture(board), picture(board))).toBe(board);
  });

  it('deletes a part with the links and triggers that name it; an item of an each part is not deleted', () => {
    const p = picture(board);
    const without = (ids: string[]) => ({ ...p, nodes: p.nodes.filter(n => !ids.includes(n.id)) });
    const next = withPictureLayout(board, p, without(['count']));
    expect(Object.keys(next.parts)).toEqual(['title', 'pump', 'unit']);
    expect(Object.keys((next.layout as { place: object }).place)).toEqual(['title', 'pump', 'unit']);
    expect(Object.keys((next.layout as { links: object }).links)).toEqual(['l2']);
    expect(next.triggers).toEqual([board.triggers![1]]);
    expect(withPictureLayout(board, p, without(['pump/P1']))).toBe(board);
  });
});
