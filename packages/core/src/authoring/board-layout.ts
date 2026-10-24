// Where the parts of a board in the language's second version are, written back from its picture. The editor draws the
// picture and the author moves, sizes and deletes what it draws; a node's id is its part's (`<part>/<key>` for one of an
// `each` part's items), so what moved is said again in the board's layout — and nothing else of the board changes.

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import type { CanvasView, Node } from '../view-document.js';
import type { BoardV2, CanvasLayout, Place, Trigger } from '../board-v2/types.js';

/** Whether the picture node `id` is one the board places itself: a part on the canvas, or an item of an `each` part —
 *  not a part inside a group, which moves with its group. */
export function placesItself(board: BoardV2, id: string): boolean {
  if (board.layout.kind !== 'canvas') return false;
  const [part, key, ...rest] = id.split('/');
  const placed = board.layout.place[part!];
  if (placed === undefined || rest.length > 0) return false;
  return key === undefined ? Array.isArray(placed) : board.parts[part!]?.each !== undefined && !Array.isArray(placed);
}

/**
 * The board with its canvas layout as the picture `after` shows it, the picture having been `before`: each part (or
 * item) that moved or was sized placed where it is now, each part deleted gone — with the links and triggers that
 * named it. An item of an `each` part is there while its data has it, so deleting one deletes nothing.
 */
export function withPictureLayout(board: BoardV2, before: CanvasView, after: CanvasView): BoardV2 {
  if (board.layout.kind !== 'canvas') return board;
  const layout: CanvasLayout = { ...board.layout, place: { ...board.layout.place } };
  const parts = { ...board.parts };
  const was = new Map(before.nodes.map(node => [node.id, node]));
  const now = new Map(after.nodes.map(node => [node.id, node]));
  let changed = false;

  for (const [id, node] of now) {
    const old = was.get(id);
    if (!old || !placesItself(board, id) || sameBox(old, node)) continue;
    const [part, key] = id.split('/') as [string, string | undefined];
    const at = placeOf(old, node);
    layout.place[part] = key === undefined ? at : { ...(layout.place[part] as Record<string, Place>), [key]: at };
    changed = true;
  }

  const gone = [...was.keys()].filter(id => !now.has(id) && !id.includes('/') && placesItself(board, id));
  for (const part of gone) {
    delete parts[part];
    delete layout.place[part];
    changed = true;
  }
  if (!changed) return board;
  const names = (id: string | undefined) => id !== undefined && gone.some(part => id === part || id.startsWith(`${part}/`));
  if (gone.length > 0 && layout.links) {
    layout.links = Object.fromEntries(Object.entries(layout.links).filter(([, link]) => !names(link.from) && !names(link.to)));
  }
  const triggers = gone.length > 0 ? board.triggers?.filter(t => !mentions(t, names)) : board.triggers;
  return { ...board, parts, layout, ...(triggers !== undefined ? { triggers } : {}) };
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
