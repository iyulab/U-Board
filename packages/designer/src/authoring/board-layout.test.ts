import { describe, expect, it } from 'vitest';
import { toViewDocument } from '@iyulab/u-board/toolkit';
import type { Board, CanvasLayout } from '@iyulab/u-board/toolkit';
import type { CanvasView, GridView } from '@iyulab/u-board/picture';
import { LINK, SHAPE, cellBoard, cellIndex, gridCellOf, layoutEditable, lineOf, linkOf, placesItself, shapeIn, shapeOf, withCell, withNewLink, withNewShape, withPictureLayout } from './board-layout.js';

const board: Board = {
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
const picture = (b: Board) => toViewDocument(b) as CanvasView;
/** The picture with node `id` moved by `change`. */
const moved = (b: Board, id: string, change: Partial<CanvasView['nodes'][number]>): CanvasView => {
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

describe('the links of a canvas board', () => {
  it('are drawn as connectors the editor can name back, and deleting one on the canvas deletes the link', () => {
    const before = picture(board);
    expect(before.connectors.map(c => c.id)).toEqual(['link.l1', 'link.l2']);
    expect(linkOf(board, 'link.l1')).toBe('l1');
    expect(linkOf(board, 'link.nope')).toBeUndefined();
    const after = { ...before, connectors: before.connectors.filter(c => c.id !== 'link.l1') };
    const next = withPictureLayout(board, before, after);
    expect(next.layout.kind === 'canvas' && next.layout.links).toEqual({ l2: { from: 'title', to: 'unit' } });
    expect(next.parts).toEqual(board.parts);
  });

  it('gains a link from one part to another, with an arrowhead, under a new id', () => {
    const { board: next, id } = withNewLink(board, 'title', 'count');
    expect(id).toBe('link-3');
    expect(next.layout.kind === 'canvas' && next.layout.links?.[id]).toEqual({ from: 'title', to: 'count', arrow: 'end' });
    expect(picture(next).connectors.map(c => c.id)).toContain(`${LINK}${id}`);
  });
});

describe('the shapes of a canvas board', () => {
  const framed: Board = { ...board, layout: { ...(board.layout as CanvasLayout), shapes: { zone: { box: [0, 0, 300, 200], label: 'Zone' }, note: { text: 'Hi', at: [10, 400] }, pipe: { line: [[0, 0], [100, 0]] } } } };

  it('are the frames, texts and lines — a line drawn as a node of its own, which the board places itself', () => {
    expect(shapeOf(framed, `${SHAPE}zone`)).toBe('zone');
    expect(shapeOf(framed, `${SHAPE}note`)).toBe('note');
    expect(shapeOf(framed, `${SHAPE}pipe`)).toBe('pipe');
    expect(lineOf(framed, `${SHAPE}pipe`)).toBe('pipe');
    expect(lineOf(framed, `${SHAPE}zone`)).toBeUndefined();
    expect(placesItself(framed, `${SHAPE}pipe`)).toBe(true);
  });

  it('move and size a line as its node is — each point where it stands in the box — and delete it with its node', () => {
    const before = picture(framed);
    const node = before.nodes.find(n => n.id === `${SHAPE}pipe`)!;
    const moved: CanvasView = { ...before, nodes: before.nodes.map(n => (n === node ? { ...n, x: n.x + 50, y: n.y + 10, width: n.width! * 2 } : n)) };
    const next = withPictureLayout(framed, before, moved);
    const pipe = next.layout.kind === 'canvas' ? next.layout.shapes!.pipe! : undefined;
    expect(pipe!.line![0]).toEqual([50 + (0 - node.x) * 2 + node.x, 10]);
    expect(pipe!.line![1]![0] - pipe!.line![0]![0]).toBe(200);
    const deleted = withPictureLayout(framed, before, { ...before, nodes: before.nodes.filter(n => n !== node) });
    expect(deleted.layout.kind === 'canvas' && deleted.layout.shapes).toEqual({ zone: framed.layout.kind === 'canvas' && framed.layout.shapes!.zone, note: { text: 'Hi', at: [10, 400] } });
    expect(deleted.parts).toEqual(framed.parts);
    expect(shapeIn({ path: 'M0 0 L10 20' }, { x: 0, y: 0, width: 10, height: 20 }, { x: 5, y: 5, width: 20, height: 20 })).toEqual({ path: 'M5 5 L25 25' });
  });

  it('move, size and go as the canvas says, nothing else of the board changing', () => {
    const before = picture(framed);
    const after: CanvasView = {
      ...before,
      decorations: before.decorations!.flatMap(d => (d.id === `${SHAPE}note` ? [] : d.id === `${SHAPE}zone` && d.type === 'rect' ? [{ ...d, x: 20.4, y: 30, width: 320 }] : [d])),
    };
    const next = withPictureLayout(framed, before, after);
    expect(next.layout.kind === 'canvas' && next.layout.shapes).toEqual({ zone: { box: [20, 30, 320, 200], label: 'Zone' }, pipe: { line: [[0, 0], [100, 0]] } });
    expect(next.parts).toEqual(framed.parts);
  });

  it('gains a frame, a text or a line at the top left, each under a new id', () => {
    const line = withNewShape(board, 'line', 'Text');
    expect(line.board.layout.kind === 'canvas' && line.board.layout.shapes?.[line.id]).toEqual({ line: [[20, 20], [220, 20]] });
    const box = withNewShape(board, 'box', 'Text');
    expect(box.board.layout.kind === 'canvas' && box.board.layout.shapes?.[box.id]).toEqual({ box: [20, 20, 240, 160] });
    const text = withNewShape(box.board, 'text', 'Text');
    expect(text.board.layout.kind === 'canvas' && text.board.layout.shapes?.[text.id]).toEqual({ text: 'Text', at: [44, 44] });
  });
});

describe('withPictureLayout — a grid', () => {
  const grid: Board = {
    ...board,
    parts: { title: board.parts.title!, count: board.parts.count!, pump: board.parts.pump! },
    layout: { kind: 'grid', items: ['title', ['pump', 6], ['count', 3]] },
    triggers: [{ on: { event: 'click', part: 'count' }, do: [{ action: 'emit', name: 'count' }] }],
  };
  const drawn = (b: Board, keys: string[] = ['P1', 'P2']) => toViewDocument(b, { keysOf: () => keys }) as GridView;
  const items = (p: GridView) => p.items.map(i => [i.id, i.span]);

  it('draws a grid of parts with one item per item of an each part', () => {
    expect(items(drawn(grid))).toEqual([['title', undefined], ['pump/P1', 6], ['pump/P2', 6], ['count', 3]]);
    expect([layoutEditable(grid), placesItself(grid, 'pump/P2'), placesItself(grid, 'pump'), placesItself(grid, 'count')]).toEqual([true, true, false, true]);
  });

  it('orders the parts as the picture now does, an each part where its first item is', () => {
    const p = drawn(grid);
    const reordered = { ...p, items: [p.items[3]!, p.items[0]!, p.items[1]!, p.items[2]!] };
    expect(withPictureLayout(grid, p, reordered).layout).toEqual({ kind: 'grid', items: [['count', 3], 'title', ['pump', 6]] });
  });

  it('gives a part the columns one of its items was given', () => {
    const p = drawn(grid);
    const wider = { ...p, items: p.items.map(i => (i.id === 'pump/P2' ? { ...i, span: 12 } : i.id === 'count' ? { ...i, span: 4 } : i)) };
    expect(withPictureLayout(grid, p, wider).layout).toEqual({ kind: 'grid', items: ['title', ['pump', 12], 'count'] });
    expect(withPictureLayout(grid, p, p)).toBe(grid);
  });

  it('deletes a part with its triggers, and keeps the place of a part the picture did not draw', () => {
    const p = drawn(grid, []);
    expect(items(p)).toEqual([['title', undefined], ['count', 3]]);
    const next = withPictureLayout(grid, p, { ...p, items: [p.items[0]!] });
    expect(next.layout).toEqual({ kind: 'grid', items: ['title', ['pump', 6]] });
    expect(Object.keys(next.parts)).toEqual(['title', 'pump']);
    expect(next.triggers).toEqual([]);
  });

  describe('with a canvas in a cell', () => {
    const plan: Board = {
      ...grid,
      parts: { ...grid.parts, valve: { as: 'label', title: 'V1' } },
      layout: { kind: 'grid', items: ['title', { canvas: { size: [400, 200], place: { valve: [20, 30, 100, 40] }, links: { v: { from: 'valve', to: 'valve' } } }, span: 8, height: 240 }, ['count', 3]] },
    };

    it('lays the grid out, the canvas an entry the picture draws as `cell-<i>` keeping its form', () => {
      const p = drawn(plan);
      expect(items(p)).toEqual([['title', undefined], ['cell-1', 8], ['count', 3]]);
      expect([layoutEditable(plan), placesItself(plan, 'cell-1'), cellIndex(plan, 'cell-1'), cellIndex(plan, 'cell-0')]).toEqual([true, true, 1, undefined]);
      const moved = withPictureLayout(plan, p, { ...p, items: [p.items[1]!, { ...p.items[0]!, span: 4 }, { ...p.items[2]!, span: 12 }].map(i => (i.id === 'cell-1' ? { ...i, span: 12 } : i)) });
      expect(moved.layout).toEqual({ kind: 'grid', items: [{ ...(plan.layout as { items: object[] }).items[1], span: 12 }, 'title', ['count', 12]] });
    });

    it('deletes a canvas with the parts placed on it', () => {
      const p = drawn(plan);
      const next = withPictureLayout(plan, p, { ...p, items: [p.items[0]!, p.items[2]!] });
      expect(next.layout).toEqual({ kind: 'grid', items: ['title', ['count', 3]] });
      expect(Object.keys(next.parts)).toEqual(['title', 'count', 'pump']);
    });

    it('opens as a canvas board of its own, what moves in it written back into the cell', () => {
      const cell = cellBoard(plan, 1)!;
      // Drawn as the editor draws a cell: without the board's triggers, which name parts outside it.
      const before = picture({ ...cell, triggers: [] });
      expect(before.nodes.map(n => n.id)).toEqual(['valve']);
      expect(before.connectors.map(c => [c.id, c.fromNodeId])).toEqual([[`${LINK}v`, 'valve']]);
      const after = { ...before, nodes: before.nodes.map(n => ({ ...n, x: 60 })) };
      const next = withCell(plan, 1, withPictureLayout(cell, before, after));
      expect(next.layout.kind === 'grid' && next.layout.items[1]).toEqual({ canvas: { size: [400, 200], place: { valve: [60, 30, 100, 40] }, links: { v: { from: 'valve', to: 'valve' } } }, span: 8, height: 240 });
      expect(cellBoard(plan, 0)).toBeUndefined();
    });
  });

  describe('with a grid in a cell', () => {
    const stacked: Board = {
      ...grid,
      parts: { ...grid.parts, a: { as: 'label', title: 'A' }, b: { as: 'label', title: 'B' } },
      layout: { kind: 'grid', items: [['title', 8], { grid: [['a', 6], ['b', 6], 'count'], span: 4 }] },
    };

    it('lays the outer grid out, the cell’s items standing for it — moved with it, not one by one', () => {
      const p = drawn(stacked);
      expect(items(p)).toEqual([['title', 8], ['a', 2], ['b', 2], ['count', 4]]);
      expect([layoutEditable(stacked), placesItself(stacked, 'title'), placesItself(stacked, 'a'), gridCellOf(stacked, 'count'), gridCellOf(stacked, 'title')]).toEqual([true, true, false, 1, undefined]);
      const moved = withPictureLayout(stacked, p, { ...p, items: [p.items[1]!, p.items[2]!, p.items[3]!, { ...p.items[0]!, span: 12 }] });
      expect(moved.layout).toEqual({ kind: 'grid', items: [{ grid: [['a', 6], ['b', 6], 'count'], span: 4 }, ['title', 12]] });
    });

    it('opens as a grid board of its own — its items ordered, widened and deleted there — written back into the cell', () => {
      const cell = cellBoard(stacked, 1)!;
      const before = drawn({ ...cell, triggers: [] });
      expect(items(before)).toEqual([['a', 6], ['b', 6], ['count', undefined]]);
      const after = { ...before, items: [before.items[1]!, { ...before.items[0]!, span: 12 }] };
      const next = withCell(stacked, 1, withPictureLayout(cell, before, after));
      expect(next.layout).toEqual({ kind: 'grid', items: [['title', 8], { grid: [['b', 6], ['a', 12]], span: 4 }] });
      expect(Object.keys(next.parts)).toEqual(['title', 'pump', 'a', 'b']);
      expect(next.triggers).toEqual([]);
    });

    it('does not lay out a grid in a grid in a cell, which the picture does not draw', () => {
      const deeper: Board = { ...stacked, layout: { kind: 'grid', items: [{ grid: [{ grid: ['a'] }], span: 4 }] } };
      expect(layoutEditable(deeper)).toBe(false);
    });
  });

});
