import { Scene } from '@canvas-kit/core';
import type { CanvasView, Shape } from '@iyulab/u-board/picture';
import { sizedNodes } from '@iyulab/u-board/toolkit';
import { decorationObjects } from '@iyulab/u-board/toolkit';
import { captionObjects, connectorObjects } from '@iyulab/u-board/toolkit';

/** The stroke a rect decoration is drawn with in the designer when the document does not set its own — distinct
 * from a node placeholder's blue (`NODE_PLACEHOLDER_STROKE` below) so a structural frame reads apart from a widget
 * footprint at a glance. */
const DECORATION_STROKE = '#f59e0b';

/** A node's placeholder fill/stroke in the designer canvas — the box being positioned, not the
 * widget itself. The real widget renders in the live preview pane (`resolveDocument` +
 * `toCanvasKit`), which is the render path the renderer/editor separation already owns; the
 * designer only needs a draggable, identifiable footprint (docs/principles.md). */
const NODE_PLACEHOLDER_FILL = 'rgba(59, 130, 246, 0.15)';
const NODE_PLACEHOLDER_STROKE = '#3b82f6';

/** A rect decoration's placeholder fill in the designer canvas only — Konva hit-tests a shape by
 * what it actually draws, so an unfilled rect (the usual authored look for a "frame" that
 * shouldn't obscure the nodes it groups) is only clickable along its thin stroke line, not its
 * interior. This translucent fill exists purely to make the whole footprint selectable/draggable
 * in the designer; it is never written back to the document (`applySceneToDocument` below only
 * folds back position/size) — the live preview pane and the real renderer still draw the
 * decoration's own authored `fill` (or none), same as `NODE_PLACEHOLDER_FILL` never leaks into a
 * node's actual widget appearance. */
const DECORATION_PLACEHOLDER_FILL = 'rgba(245, 158, 11, 0.08)';

/**
 * Projects a ViewDocument into a canvas-kit Scene the designer can render and let the author
 * drag: the background image (locked, drawn but not editable), the connectors (fixed: selected to edit
 * them, never dragged — they follow their nodes), and one `rect` per node, id'd by node id, standing in
 * for its widget's footprint. A scene object's id names its document part, after a `#` for a part's
 * pieces (`partOf`).
 */
export function documentToScene(doc: CanvasView, movable?: (id: string) => boolean, selectable?: (id: string) => boolean): Scene {
  const scene = new Scene();
  // Only the nodes `movable` names — and the connectors and decorations `selectable` names — when a layout is all that
  // is edited; else every part of the board's own.
  const own = new Set(
    (movable
      ? [...doc.nodes.filter(node => movable(node.id)), ...[...doc.connectors, ...(doc.decorations ?? [])].filter(piece => selectable?.(piece.id))]
      : [...doc.nodes, ...doc.connectors, ...(doc.decorations ?? [])]
    ).map(part => part.id)
  );
  // A part not edited here, and every piece of it: drawn, never selected or moved.
  const add = (object: Parameters<Scene['add']>[0]) => scene.add(object.id && !own.has(partOf(object.id)) ? { ...object, locked: true } : object);

  if (doc.background.image) {
    add({
      type: 'image',
      x: 0,
      y: 0,
      width: doc.background.image.width,
      height: doc.background.image.height,
      src: doc.background.image.src,
      // The picture the board is built on: drawn under the nodes, never grabbed and moved with them.
      locked: true,
    });
  }

  for (const shape of doc.decorations ?? []) {
    const [drawn, ...name] = decorationObjects(shape, doc.appearance, doc.accent);
    if (drawn.type === 'rect') {
      // Konva's Text hit-tests its full bounding box regardless of fill, so a text decoration is
      // added as drawn below; a rect decoration needs the designer-only placeholder fill above to
      // stay clickable across its interior, not just its stroke.
      add({ ...drawn, fill: DECORATION_PLACEHOLDER_FILL, stroke: drawn.stroke ?? DECORATION_STROKE });
      // Its name follows the frame — drawn again where the frame lands — and a press on it reaches the frame.
      for (const object of name) add({ ...object, locked: true });
    } else {
      add(drawn);
    }
  }

  // Follows its two nodes: selected to be edited, never dragged — moving a line or its label would move nothing.
  const nodes = sizedNodes(doc);
  for (const object of connectorObjects(nodes, doc.connectors, doc.appearance, { fixed: true }, doc.accent)) add(object);
  for (const object of captionObjects(nodes, doc.appearance, true)) add(object);

  for (const node of nodes) {
    add({
      type: 'rect',
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      fill: NODE_PLACEHOLDER_FILL,
      stroke: NODE_PLACEHOLDER_STROKE,
      strokeWidth: 1,
    });
  }

  return scene;
}

/**
 * Folds a designer Scene's node-rect and decoration-shape positions back into a ViewDocument.
 * Reads every scene object whose id matches a node or decoration — not just the one the author
 * just dragged — so it stays correct regardless of how the designer reports the change (single
 * move, batched drag, resize). A node and a decoration can both be scene `rect`s with the same
 * shape; they're told apart by id membership in `doc.nodes`/`doc.decorations`, not by scanning
 * order, so a decoration id never gets folded onto a node or vice versa.
 */
export function applySceneToDocument(doc: CanvasView, scene: Scene): CanvasView {
  const objectsById = new Map(scene.getObjects().filter(obj => !!obj.id).map(obj => [obj.id as string, obj]));

  const nodes = doc.nodes.map(node => {
    const obj = objectsById.get(node.id);
    if (!obj || obj.type !== 'rect') return node;
    return { ...node, x: obj.x, y: obj.y, width: obj.width, height: obj.height };
  });

  const decorations = doc.decorations?.map((shape): Shape => {
    const obj = objectsById.get(shape.id);
    if (!obj) return shape;
    if (shape.type === 'rect' && obj.type === 'rect') {
      return { ...shape, x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    }
    if (shape.type === 'text' && obj.type === 'text') {
      return { ...shape, x: obj.x, y: obj.y };
    }
    return shape;
  });

  return { ...doc, nodes, ...(decorations ? { decorations } : {}) };
}

/** The document part a scene object draws: its id, or a part's own id before the `#` of one of its pieces (a
 * connector's `#chip`, `#arrow0`). */
export function partOf(objectId: string): string {
  const at = objectId.indexOf('#');
  return at === -1 ? objectId : objectId.slice(0, at);
}
