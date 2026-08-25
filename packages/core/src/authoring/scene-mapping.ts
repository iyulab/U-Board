import { Scene } from '@canvas-kit/core';
import type { ViewDocument, Node, Shape } from '../view-document.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, DEFAULT_DECORATION_WIDTH, DEFAULT_DECORATION_HEIGHT } from '../layout-defaults.js';
import { seedWidget } from './widget-catalog.js';

/** A newly-added rect decoration's default border — distinct from a node placeholder's blue
 * (`NODE_PLACEHOLDER_STROKE` below) so an author can tell a structural frame apart from a widget
 * footprint at a glance. Also the fallback stroke a designer-mapped rect decoration uses below
 * when the document doesn't set its own. */
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
 * drag: the background image, connector lines (following current node positions), and one
 * `rect` per node — id'd by node id — standing in for its widget's footprint.
 */
export function documentToScene(doc: ViewDocument): Scene {
  const scene = new Scene();

  if (doc.background.image) {
    scene.add({
      type: 'image',
      x: 0,
      y: 0,
      width: doc.background.image.width,
      height: doc.background.image.height,
      src: doc.background.image.src,
    });
  }

  for (const shape of doc.decorations ?? []) {
    if (shape.type === 'rect') {
      // Konva's Text hit-tests its full bounding box regardless of fill, so a text decoration is
      // added as-is below; a rect decoration needs the designer-only placeholder fill above to
      // stay clickable across its interior, not just its stroke.
      scene.add({ ...shape, fill: DECORATION_PLACEHOLDER_FILL, stroke: shape.stroke ?? DECORATION_STROKE });
    } else {
      scene.add(shape);
    }
  }

  const nodesById = new Map(doc.nodes.map(node => [node.id, node]));
  for (const connector of doc.connectors) {
    const from = nodesById.get(connector.fromNodeId);
    const to = nodesById.get(connector.toNodeId);
    if (!from || !to) continue; // a dangling reference is a malformed document, not a crash
    scene.add({
      type: 'line',
      id: connector.id,
      x: 0,
      y: 0,
      points: [
        from.x + (from.width ?? DEFAULT_NODE_WIDTH) / 2,
        from.y + (from.height ?? DEFAULT_NODE_HEIGHT) / 2,
        to.x + (to.width ?? DEFAULT_NODE_WIDTH) / 2,
        to.y + (to.height ?? DEFAULT_NODE_HEIGHT) / 2,
      ],
      stroke: '#94a3b8',
      strokeWidth: 2,
    });
  }

  for (const node of doc.nodes) {
    scene.add({
      type: 'rect',
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
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
export function applySceneToDocument(doc: ViewDocument, scene: Scene): ViewDocument {
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

/** Appends a new node at `position` with a placeholder widget. Bindings are deliberately absent
 * — a newly added node starts unbound and is wired up afterward via the property panel. `value`
 * is included even though it's static and unbound: u-widgets' status widget renders nothing at
 * all when `data.value` is absent (it treats a valueless item as not an item), so a new node
 * needs a placeholder value to be visible before it's ever bound. */
const NEW_NODE_BASE_OFFSET = 40;
const NEW_NODE_CASCADE_STEP = 24;
const NEW_NODE_CASCADE_WRAP = 8; // after this many nodes, the cascade wraps back to the base offset

/** Where to place the next node the author adds, so repeated "Add node" clicks don't stack every
 * node exactly on top of the last one. Cascades diagonally by node count, wrapping so positions
 * stay on-canvas even after many additions — the author can still drag it wherever they want. */
export function nextNodePosition(doc: ViewDocument): { x: number; y: number } {
  const offset = (doc.nodes.length % NEW_NODE_CASCADE_WRAP) * NEW_NODE_CASCADE_STEP;
  return { x: NEW_NODE_BASE_OFFSET + offset, y: NEW_NODE_BASE_OFFSET + offset };
}

export function addNode(doc: ViewDocument, position: { x: number; y: number }): ViewDocument {
  const node: Node = {
    id: `node-${crypto.randomUUID()}`,
    x: position.x,
    y: position.y,
    anchored: false,
    widget: seedWidget('status'),
  };
  return { ...doc, nodes: [...doc.nodes, node] };
}

/** Where to place the next decoration the author adds — same cascading-offset reasoning as
 * `nextNodePosition`, kept as its own function (rather than sharing a counter with nodes) so
 * adding several decorations in a row doesn't stack them on top of unrelated nodes placed at the
 * same cascade step. */
export function nextDecorationPosition(doc: ViewDocument): { x: number; y: number } {
  const count = doc.decorations?.length ?? 0;
  const offset = (count % NEW_NODE_CASCADE_WRAP) * NEW_NODE_CASCADE_STEP;
  return { x: NEW_NODE_BASE_OFFSET + offset, y: NEW_NODE_BASE_OFFSET + offset };
}

/** Appends a new decoration at `position` with a default size/placeholder label — the "draw" step
 * of the authoring tool is just this plus the designer's existing drag/resize (`documentToScene`/
 * `applySceneToDocument` above), the same click-to-add-then-adjust pattern `addNode` already
 * establishes for widget nodes (docs/concepts.md — "Decoration"). The `decoration-` id prefix
 * (vs. `node-` for nodes) is cosmetic only — `applySceneToDocument` tells the two apart by
 * membership in `doc.nodes`/`doc.decorations`, not by parsing the id. */
export function addDecoration(doc: ViewDocument, type: Shape['type'], position: { x: number; y: number }): ViewDocument {
  const id = `decoration-${crypto.randomUUID()}`;
  const shape: Shape =
    type === 'rect'
      ? { id, type: 'rect', x: position.x, y: position.y, width: DEFAULT_DECORATION_WIDTH, height: DEFAULT_DECORATION_HEIGHT, stroke: DECORATION_STROKE }
      : { id, type: 'text', x: position.x, y: position.y, text: 'Label' };
  return { ...doc, decorations: [...(doc.decorations ?? []), shape] };
}
