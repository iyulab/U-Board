// Where the parts of a board in the language's second version are, written back from its picture. The editor draws the
// picture and the author moves, sizes, orders and deletes what it draws; a node's or an item's id is its part's
// (`<part>/<key>` for one of an `each` part's items), so what changed is said again in the board's layout — and nothing
// else of the board changes.

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import { GRID_DEFAULT_SPAN, type GridView, type Node, type ViewDocument } from '../view-document.js';
import type { BoardV2, CanvasLayout, GridItem, Place, Shape, Trigger } from '../board-v2/types.js';

/**
 * Whether the editor lays this board out: a canvas, or a grid of parts alone — a grid holding a grid or a canvas of
 * its own is laid out across rows its picture flattens, which the editor does not say back yet.
 */
export function layoutEditable(board: BoardV2): boolean {
  return board.layout.kind === 'canvas' || board.layout.items.every(entry => typeof entry === 'string' || Array.isArray(entry));
}

/** The id the picture draws a board's own link with — `link.<id>`. */
export const LINK = 'link.';

/** The link of a canvas board a picture connector `id` draws, if it is one of the board's own (not a group's). */
export function linkOf(board: BoardV2, id: string): string | undefined {
  if (board.layout.kind !== 'canvas' || !id.startsWith(LINK)) return undefined;
  const link = id.slice(LINK.length);
  return board.layout.links?.[link] !== undefined ? link : undefined;
}

/** The id the picture draws a board's own shape with — `shape.<id>`. */
export const SHAPE = 'shape.';

/** The shape of a canvas board a picture piece `id` draws, if it is one of the board's own — a box or a text (drawn as a
 *  decoration), or a line or a path (drawn as a node of its own). */
export function shapeOf(board: BoardV2, id: string): string | undefined {
  if (board.layout.kind !== 'canvas' || !id.startsWith(SHAPE)) return undefined;
  return board.layout.shapes?.[id.slice(SHAPE.length)] !== undefined ? id.slice(SHAPE.length) : undefined;
}

/** The line or path of a canvas board a picture node `id` draws, if it is one. */
export function lineOf(board: BoardV2, id: string): string | undefined {
  const shape = shapeOf(board, id);
  const drawn = shape !== undefined && board.layout.kind === 'canvas' ? board.layout.shapes![shape]! : undefined;
  return drawn && (drawn.line !== undefined || drawn.path !== undefined) ? shape : undefined;
}

/** A line or path moved and sized as its node was, from box `from` to box `to`: each point where it stands in the box. */
export function shapeIn(shape: Shape, from: { x: number; y: number; width: number; height: number }, to: { x: number; y: number; width: number; height: number }): Shape {
  const sx = from.width === 0 ? 1 : to.width / from.width;
  const sy = from.height === 0 ? 1 : to.height / from.height;
  const px = (x: number) => Math.round(to.x + (x - from.x) * sx);
  const py = (y: number) => Math.round(to.y + (y - from.y) * sy);
  let k = 0;
  if (shape.line !== undefined) return { ...shape, line: shape.line.map(([x, y]) => [px(x), py(y)]) };
  if (shape.path !== undefined) return { ...shape, path: shape.path.replace(/-?\d*\.?\d+/g, n => String(k++ % 2 === 0 ? px(Number(n)) : py(Number(n)))) };
  return shape;
}

/** The board with a new shape — a box, a text, or a line — at the canvas's top left, stepped from the shapes it has, and its
 *  id. */
export function withNewShape(board: BoardV2, kind: 'box' | 'text' | 'line', text: string): { board: BoardV2; id: string } {
  if (board.layout.kind !== 'canvas') return { board, id: '' };
  const shapes = board.layout.shapes ?? {};
  let n = Object.keys(shapes).length + 1;
  while (`shape-${n}` in shapes) n++;
  const id = `shape-${n}`;
  const step = 24 * (n - 1);
  const shape: Shape =
    kind === 'box' ? { box: [20 + step, 20 + step, 240, 160] } : kind === 'line' ? { line: [[20 + step, 20 + step], [220 + step, 20 + step]] } : { text, at: [20 + step, 20 + step] };
  return { board: { ...board, layout: { ...board.layout, shapes: { ...shapes, [id]: shape } } }, id };
}

/** The board with a new link from part `from` to part `to` — drawn with an arrowhead, as a flow is — and its id. */
export function withNewLink(board: BoardV2, from: string, to: string): { board: BoardV2; id: string } {
  if (board.layout.kind !== 'canvas') return { board, id: '' };
  const links = board.layout.links ?? {};
  let n = Object.keys(links).length + 1;
  while (`link-${n}` in links) n++;
  const id = `link-${n}`;
  return { board: { ...board, layout: { ...board.layout, links: { ...links, [id]: { from, to, arrow: true } } } }, id };
}

/** Whether the picture node or item `id` is one the board places itself: a part, or an item of an `each` part — not a
 *  part inside a group, which moves with its group. */
export function placesItself(board: BoardV2, id: string): boolean {
  if (!layoutEditable(board)) return false;
  if (lineOf(board, id) !== undefined) return true;
  const [part, key, ...rest] = id.split('/');
  if (board.layout.kind === 'grid') {
    const each = board.parts[part!]?.each !== undefined;
    return rest.length === 0 && (key === undefined ? !each : each) && board.layout.items.some(entry => entryId(entry) === part);
  }
  const placed = board.layout.place[part!];
  if (placed === undefined || rest.length > 0) return false;
  return key === undefined ? Array.isArray(placed) : board.parts[part!]?.each !== undefined && !Array.isArray(placed);
}

/**
 * The board with its canvas layout as the picture `after` shows it, the picture having been `before`: each part (or
 * item) that moved or was sized placed where it is now, each part deleted gone — with the links and triggers that
 * named it. An item of an `each` part is there while its data has it, so deleting one deletes nothing.
 */
export function withPictureLayout(board: BoardV2, before: ViewDocument, after: ViewDocument): BoardV2 {
  if (board.layout.kind === 'grid') return before.kind === 'grid' && after.kind === 'grid' ? withGridLayout(board, before, after) : board;
  if (before.kind !== 'canvas' || after.kind !== 'canvas') return board;
  const layout: CanvasLayout = { ...board.layout, place: { ...board.layout.place } };
  const parts = { ...board.parts };
  const was = new Map(before.nodes.map(node => [node.id, node]));
  const now = new Map(after.nodes.map(node => [node.id, node]));
  let changed = false;

  for (const [id, node] of now) {
    const old = was.get(id);
    if (!old || !placesItself(board, id) || sameBox(old, node)) continue;
    const line = lineOf(board, id);
    if (line !== undefined) {
      const box = (n: Node) => ({ x: n.x, y: n.y, width: n.width ?? old.width ?? 0, height: n.height ?? old.height ?? 0 });
      layout.shapes = { ...layout.shapes, [line]: shapeIn(layout.shapes![line]!, box(old), box(node)) };
      changed = true;
      continue;
    }
    const [part, key] = id.split('/') as [string, string | undefined];
    const at = placeOf(old, node);
    layout.place[part] = key === undefined ? at : { ...(layout.place[part] as Record<string, Place>), [key]: at };
    changed = true;
  }

  // A shape of the board's own moved, sized or deleted on the canvas: its decoration (`shape.<id>`).
  const shapesNow = new Map((after.decorations ?? []).map(d => [d.id, d]));
  for (const old of before.decorations ?? []) {
    const id = shapeOf(board, old.id);
    if (id === undefined) continue;
    const now = shapesNow.get(old.id);
    const shapes = { ...layout.shapes };
    const size = (d: typeof old) => (d.type === 'rect' ? `${d.width}x${d.height}` : '');
    if (now === undefined) delete shapes[id];
    else if (now.x === old.x && now.y === old.y && size(now) === size(old)) continue;
    else if (now.type === 'rect' && shapes[id]!.box !== undefined) shapes[id] = { ...shapes[id]!, box: [Math.round(now.x), Math.round(now.y), Math.round(now.width), Math.round(now.height)] };
    else shapes[id] = { ...shapes[id]!, at: [Math.round(now.x), Math.round(now.y)] };
    layout.shapes = shapes;
    changed = true;
  }

  // A link deleted on the canvas: its connector (`link.<id>`, the board's own links) gone from the picture.
  const nowLinks = new Set(after.connectors.map(c => c.id));
  const linksGone = before.connectors.map(c => c.id).filter(id => !nowLinks.has(id) && id.startsWith(LINK) && layout.links?.[id.slice(LINK.length)] !== undefined);
  if (linksGone.length > 0) {
    layout.links = Object.fromEntries(Object.entries(layout.links!).filter(([id]) => !linksGone.includes(`${LINK}${id}`)));
    changed = true;
  }

  const removed = [...was.keys()].filter(id => !now.has(id) && placesItself(board, id));
  for (const line of removed.flatMap(id => lineOf(board, id) ?? [])) {
    const { [line]: _gone, ...rest } = layout.shapes!;
    layout.shapes = rest;
    changed = true;
  }
  const gone = removed.filter(id => !id.includes('/') && lineOf(board, id) === undefined);
  for (const part of gone) {
    delete parts[part];
    delete layout.place[part];
    changed = true;
  }
  if (!changed) return board;
  const names = named(gone);
  if (gone.length > 0 && layout.links) {
    layout.links = Object.fromEntries(Object.entries(layout.links).filter(([, link]) => !names(link.from) && !names(link.to)));
  }
  const triggers = gone.length > 0 ? board.triggers?.filter(t => !mentions(t, names)) : board.triggers;
  return { ...board, parts, layout, ...(triggers !== undefined ? { triggers } : {}) };
}

/**
 * A grid of parts as its picture `after` lays it out: the parts in the order they now come (an `each` part where its
 * first item is), each taking the columns its item was given — one of an `each` part's items setting them all — and
 * a part deleted gone with the triggers that named it. A part the picture did not draw (an `each` part whose data has
 * no items now) keeps its place.
 */
function withGridLayout(board: BoardV2, before: GridView, after: GridView): BoardV2 {
  if (board.layout.kind !== 'grid' || !layoutEditable(board)) return board;
  const partOf = (id: string) => id.split('/')[0]!;
  const spanWas = new Map(before.items.map(item => [item.id, item.span ?? GRID_DEFAULT_SPAN]));
  const span = new Map<string, number>();
  for (const item of after.items) {
    const part = partOf(item.id);
    const now = item.span ?? GRID_DEFAULT_SPAN;
    if (!span.has(part) || now !== spanWas.get(item.id)) span.set(part, now);
  }
  const drawn = new Set(before.items.map(item => partOf(item.id)));
  const order = [...new Set(after.items.map(item => partOf(item.id)))];
  const gone = [...drawn].filter(part => !span.has(part));
  // A part not drawn now keeps its place among the others: it goes back after the drawn part it followed, or first.
  const entries = board.layout.items;
  const entryOf = (part: string): GridItem => (span.get(part) === GRID_DEFAULT_SPAN ? part : [part, span.get(part)!]);
  /** The entries of parts not drawn that come straight after entry `at` (-1: before the first). */
  const following = (at: number): GridItem[] => {
    const out: GridItem[] = [];
    for (let i = at + 1; i < entries.length && !drawn.has(entryId(entries[i]!)); i++) out.push(entries[i]!);
    return out;
  };
  const items: GridItem[] = [...following(-1)];
  for (const part of order) items.push(entryOf(part), ...following(entries.findIndex(entry => entryId(entry) === part)));
  if (gone.length === 0 && JSON.stringify(items) === JSON.stringify(board.layout.items)) return board;
  const parts = { ...board.parts };
  for (const part of gone) delete parts[part];
  const triggers = gone.length > 0 ? board.triggers?.filter(t => !mentions(t, named(gone))) : board.triggers;
  return { ...board, parts, layout: { ...board.layout, items }, ...(triggers !== undefined ? { triggers } : {}) };
}

/** The part a grid entry places. */
function entryId(entry: GridItem): string {
  return typeof entry === 'string' ? entry : Array.isArray(entry) ? entry[0] : (entry.id ?? '');
}

/** Whether an id names one of `gone` — the part, or something in it. */
function named(gone: readonly string[]): (id: string | undefined) => boolean {
  return id => id !== undefined && gone.some(part => id === part || id.startsWith(`${part}/`));
}

/** Where a node is now, as a place: with its size when it was sized, or is now another size than it was drawn. */
function placeOf(old: Node, node: Node): Place {
  const width = node.width ?? old.width ?? DEFAULT_NODE_WIDTH;
  const height = node.height ?? old.height ?? DEFAULT_NODE_HEIGHT;
  const sized = old.width !== undefined || old.height !== undefined || width !== DEFAULT_NODE_WIDTH || height !== DEFAULT_NODE_HEIGHT;
  return sized ? [node.x, node.y, width, height] : [node.x, node.y];
}

function sameBox(a: Node, b: Node): boolean {
  return a.x === b.x && a.y === b.y && (b.width === undefined || b.width === (a.width ?? DEFAULT_NODE_WIDTH)) && (b.height === undefined || b.height === (a.height ?? DEFAULT_NODE_HEIGHT));
}

/** Whether a trigger names a part `names` says is gone — what it reacts to, waits on or acts on. */
function mentions(t: Trigger, names: (id: string | undefined) => boolean): boolean {
  return ('part' in t.on && names(t.on.part)) || names(t.when?.part) || t.do.some(a => a.action === 'focus' && names(a.part));
}
