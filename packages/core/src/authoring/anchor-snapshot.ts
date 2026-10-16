import { coordinateOf, placeAt, type Coordinate } from '../anchor.js';
import type { CanvasView } from '../view-document.js';
import { nodeSize, sizedNodes } from '../node-size.js';

/** Where the anchored nodes stood, by coordinate, before the background's reference points changed or went
 *  away — so that once the background has points again, the nodes can be put back at the same places. A node's
 *  place is stored as scene x/y and its coordinate derived (D250-2), so changing the points, or the image under
 *  them, would otherwise move every anchored node's coordinate without a word. */
export interface AnchorSnapshot {
  /** Each anchored node's coordinate then, by node id. Empty when no node was anchored. */
  at: Record<string, Coordinate>;
}

/** The anchored nodes' coordinates as the document reads them now, or `null` when its background has no
 *  reference points to read them by. */
export function snapshotAnchors(doc: CanvasView): AnchorSnapshot | null {
  if (!doc.background.image?.referencePoints) return null;
  const at: Record<string, Coordinate> = {};
  for (const node of sizedNodes(doc)) {
    if (!node.anchored) continue;
    const coordinate = coordinateOf(doc.background, node);
    if (coordinate) at[node.id] = coordinate;
  }
  return { at };
}

const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** The ids of the nodes in the snapshot, still anchored, that no longer read as the coordinate they had. Empty
 *  while the background has no reference points — there is nothing to read them by yet. */
export function movedAnchors(doc: CanvasView, snapshot: AnchorSnapshot): string[] {
  if (!doc.background.image?.referencePoints) return [];
  return sizedNodes(doc)
    .filter(node => node.anchored && snapshot.at[node.id])
    .filter(node => {
      const was = snapshot.at[node.id];
      const now = coordinateOf(doc.background, node);
      return !now || !near(now.x, was.x) || !near(now.y, was.y);
    })
    .map(node => node.id);
}

/** The document with each moved node put back at the coordinate it had (`placeAt`, its box's center). */
export function relocateAnchors(doc: CanvasView, snapshot: AnchorSnapshot): CanvasView {
  const moved = new Set(movedAnchors(doc, snapshot));
  if (moved.size === 0) return doc;
  return {
    ...doc,
    nodes: doc.nodes.map(node => {
      if (!moved.has(node.id)) return node;
      const at = placeAt(doc.background, nodeSize(node, doc.elements), snapshot.at[node.id]);
      return at ? { ...node, ...at } : node;
    }),
  };
}

/** The snapshot without the nodes the author moved or resized between two versions of the document — where
 *  the author put a node is where it is meant to be, not a place the points' change took it to. */
export function forgetMoved(snapshot: AnchorSnapshot, before: CanvasView, after: CanvasView): AnchorSnapshot {
  const was = new Map(before.nodes.map(node => [node.id, node]));
  const moved = new Set(
    after.nodes
      .filter(node => {
        const old = was.get(node.id);
        return old && (old.x !== node.x || old.y !== node.y || old.width !== node.width || old.height !== node.height);
      })
      .map(node => node.id)
  );
  if (![...moved].some(id => id in snapshot.at)) return snapshot;
  return { at: Object.fromEntries(Object.entries(snapshot.at).filter(([id]) => !moved.has(id))) };
}
