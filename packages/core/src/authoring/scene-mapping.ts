import { Scene } from '@canvas-kit/core';
import type { CanvasView, Connector, Node, Shape, Widget } from '../view-document.js';
import { DEFAULT_DECORATION_WIDTH, DEFAULT_DECORATION_HEIGHT } from '../layout-defaults.js';
import { sizedNodes } from '../node-size.js';
import { seedWidget } from './widget-catalog.js';
import { decorationObjects } from '../renderer/decoration-drawing.js';
import { captionObjects, connectorObjects } from '../renderer/connector-drawing.js';

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
 * drag: the background image (locked, drawn but not editable), the connectors (fixed: selected to edit
 * them, never dragged — they follow their nodes), and one `rect` per node, id'd by node id, standing in
 * for its widget's footprint. A scene object's id names its document part, after a `#` for a part's
 * pieces (`partOf`).
 */
export function documentToScene(doc: CanvasView): Scene {
  const scene = new Scene();

  if (doc.background.image) {
    scene.add({
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
    const [drawn, ...name] = decorationObjects(shape, doc.appearance);
    if (drawn.type === 'rect') {
      // Konva's Text hit-tests its full bounding box regardless of fill, so a text decoration is
      // added as drawn below; a rect decoration needs the designer-only placeholder fill above to
      // stay clickable across its interior, not just its stroke.
      scene.add({ ...drawn, fill: DECORATION_PLACEHOLDER_FILL, stroke: drawn.stroke ?? DECORATION_STROKE });
      // Its name follows the frame — drawn again where the frame lands — and a press on it reaches the frame.
      for (const object of name) scene.add({ ...object, locked: true });
    } else {
      scene.add(drawn);
    }
  }

  // Follows its two nodes: selected to be edited, never dragged — moving a line or its label would move nothing.
  const nodes = sizedNodes(doc);
  for (const object of connectorObjects(nodes, doc.connectors, doc.appearance, { fixed: true })) scene.add(object);
  for (const object of captionObjects(nodes, doc.appearance, true)) scene.add(object);

  for (const node of nodes) {
    scene.add({
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

/** Appends a new node at `position` with a placeholder widget. Bindings are deliberately absent
 * — a newly added node starts unbound and is wired up afterward via the property panel. `value`
 * is included even though it's static and unbound: u-widgets' status widget renders nothing at
 * all when `data.value` is absent (it treats a valueless item as not an item), so a new node
 * needs a placeholder value to be visible before it's ever bound. */
const NEW_NODE_BASE_OFFSET = 40;
const NEW_NODE_CASCADE_STEP = 24;
const NEW_NODE_CASCADE_WRAP = 8; // after this many nodes, the cascade wraps back to the base offset

/** Where to place the next node the author adds, so repeated "Add node" clicks don't stack every
 * node exactly on top of the last one. Cascades diagonally by node count from `origin` — the scene
 * point at the top-left of what the author currently sees, so a node added while panned or zoomed
 * into part of a large background lands in view — wrapping so positions stay near it even after
 * many additions. The author can still drag it wherever they want. */
export function nextNodePosition(doc: CanvasView, origin: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } {
  const offset = (doc.nodes.length % NEW_NODE_CASCADE_WRAP) * NEW_NODE_CASCADE_STEP;
  return { x: origin.x + NEW_NODE_BASE_OFFSET + offset, y: origin.y + NEW_NODE_BASE_OFFSET + offset };
}

/** Appends a new freely placed (not anchored) node at `position`. The id is the caller's, so it can select what it added (`newNodeId`) — as
 * with every part the editor adds. */
export function addNode(doc: CanvasView, id: string, position: { x: number; y: number }, widget: Widget = seedWidget('status')): CanvasView {
  const node: Node = {
    id,
    x: position.x,
    y: position.y,
    anchored: false,
    widget,
  };
  return { ...doc, nodes: [...doc.nodes, node] };
}

export function newNodeId(): string {
  return `node-${crypto.randomUUID()}`;
}

/** The document part a scene object draws: its id, or a part's own id before the `#` of one of its pieces (a
 * connector's `#chip`, `#arrow0`). */
export function partOf(objectId: string): string {
  const at = objectId.indexOf('#');
  return at === -1 ? objectId : objectId.slice(0, at);
}

/** Joins two nodes with a new connector, `from` to `to`, drawn the board's way until styled. The id is the caller's,
 * so it can select what it added (`newConnectorId`). */
export function addConnector(doc: CanvasView, id: string, fromNodeId: string, toNodeId: string): CanvasView {
  const connector: Connector = { id, fromNodeId, toNodeId };
  return { ...doc, connectors: [...doc.connectors, connector] };
}

export function newConnectorId(): string {
  return `connector-${crypto.randomUUID()}`;
}

/** The document without these parts — nodes, decorations or connectors by id. A node takes the connectors that join
 * it along: a line to nothing is not a board. */
export function removeParts(doc: CanvasView, ids: readonly string[]): CanvasView {
  const gone = new Set(ids);
  const nodes = doc.nodes.filter(n => !gone.has(n.id));
  const kept = new Set(nodes.map(n => n.id));
  const connectors = doc.connectors.filter(c => !gone.has(c.id) && kept.has(c.fromNodeId) && kept.has(c.toNodeId));
  const decorations = doc.decorations?.filter(d => !gone.has(d.id));
  return { ...doc, nodes, connectors, ...(decorations && { decorations }) };
}

/** Where to place the next decoration the author adds — same cascading-offset reasoning as
 * `nextNodePosition`, kept as its own function (rather than sharing a counter with nodes) so
 * adding several decorations in a row doesn't stack them on top of unrelated nodes placed at the
 * same cascade step. */
export function nextDecorationPosition(doc: CanvasView, origin: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } {
  const count = doc.decorations?.length ?? 0;
  const offset = (count % NEW_NODE_CASCADE_WRAP) * NEW_NODE_CASCADE_STEP;
  return { x: origin.x + NEW_NODE_BASE_OFFSET + offset, y: origin.y + NEW_NODE_BASE_OFFSET + offset };
}

/** Appends a new decoration at `position` with a default size/placeholder label — the "draw" step
 * of the authoring tool is just this plus the designer's existing drag/resize (`documentToScene`/
 * `applySceneToDocument` above), the same click-to-add-then-adjust pattern `addNode` already
 * establishes for widget nodes (docs/concepts.md — "Decoration"). The `decoration-` id prefix
 * (vs. `node-` for nodes) is cosmetic only — `applySceneToDocument` tells the two apart by
 * membership in `doc.nodes`/`doc.decorations`, not by parsing the id. The id is the caller's (`newDecorationId`). */
export function addDecoration(doc: CanvasView, id: string, type: Shape['type'], position: { x: number; y: number }, text = 'Label'): CanvasView {
  const shape: Shape =
    type === 'rect'
      ? { id, type: 'rect', x: position.x, y: position.y, width: DEFAULT_DECORATION_WIDTH, height: DEFAULT_DECORATION_HEIGHT, stroke: DECORATION_STROKE }
      : { id, type: 'text', x: position.x, y: position.y, text };
  return { ...doc, decorations: [...(doc.decorations ?? []), shape] };
}

export function newDecorationId(): string {
  return `decoration-${crypto.randomUUID()}`;
}
