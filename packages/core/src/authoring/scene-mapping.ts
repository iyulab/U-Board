import { Scene, getObjectBounds } from '@canvas-kit/core';
import type { CanvasView, ComponentInstance, Connector, Node, Shape, Widget } from '../view-document.js';
import { DEFAULT_DECORATION_WIDTH, DEFAULT_DECORATION_HEIGHT } from '../layout-defaults.js';
import { sizedNodes } from '../node-size.js';
import { seedWidget } from './widget-catalog.js';
import { decorationObjects } from '../renderer/decoration-drawing.js';
import { captionObjects, connectorObjects } from '../renderer/connector-drawing.js';
import { triggersWithout, withTriggers } from './trigger-editing.js';
import { expandComponents, instancePartId } from '../components.js';

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

/** The box an instance is selected and moved by in the designer — over the parts it draws, which are locked: a press
 *  anywhere on them is a press on the instance. Filled so its whole area takes the press. */
const INSTANCE_PLACEHOLDER_FILL = 'rgba(124, 58, 237, 0.06)';
const INSTANCE_PLACEHOLDER_STROKE = '#7c3aed';

/**
 * Projects a ViewDocument into a canvas-kit Scene the designer can render and let the author
 * drag: the background image (locked, drawn but not editable), the connectors (fixed: selected to edit
 * them, never dragged — they follow their nodes), and one `rect` per node, id'd by node id, standing in
 * for its widget's footprint. A scene object's id names its document part, after a `#` for a part's
 * pieces (`partOf`). A component instance's parts are drawn where they land, locked: they are edited in the
 * component, not where an instance draws them.
 */
export function documentToScene(saved: CanvasView): Scene {
  const scene = new Scene();
  const doc = expandComponents(saved);
  const own = new Set([...saved.nodes, ...saved.connectors, ...(saved.decorations ?? [])].map(part => part.id));
  // A part an instance draws, and every piece of it: drawn, never selected or moved.
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
    const [drawn, ...name] = decorationObjects(shape, doc.appearance);
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

  // Each instance, as one: a box over what it draws (its parts are locked, so a press there is the box's), named by the
  // instance's id, selected and dragged as a part — under the lines, so a line of the board's own to one of its parts is
  // still picked where it runs over the instance.
  for (const instance of saved.instances ?? []) {
    const box = instanceBox(saved, instance);
    // Moved, never resized or rotated: an instance has a place, its size is its component's.
    if (box) scene.add({ type: 'rect', id: instance.id, ...box, fill: INSTANCE_PLACEHOLDER_FILL, stroke: INSTANCE_PLACEHOLDER_STROKE, strokeWidth: 1, fixedSize: true });
  }

  // Follows its two nodes: selected to be edited, never dragged — moving a line or its label would move nothing.
  const nodes = sizedNodes(doc);
  for (const object of connectorObjects(nodes, doc.connectors, doc.appearance, { fixed: true })) add(object);
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

/** The box around what `instance` draws on the board — its nodes and decorations where they land — or `null` when it
 *  draws nothing (a component the board does not define, or one without parts). */
export function instanceBox(doc: CanvasView, instance: ComponentInstance): { x: number; y: number; width: number; height: number } | null {
  const alone: CanvasView = { kind: 'canvas', background: {}, nodes: [], connectors: [], components: doc.components, instances: [instance] };
  const drawn = expandComponents(alone);
  const boxes = [
    ...sizedNodes(drawn).map(node => ({ x: node.x, y: node.y, width: node.width, height: node.height })),
    ...(drawn.decorations ?? []).flatMap(shape => decorationObjects(shape, doc.appearance).map(getObjectBounds)),
  ];
  if (boxes.length === 0) return null;
  const x = Math.min(...boxes.map(b => b.x));
  const y = Math.min(...boxes.map(b => b.y));
  return { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y };
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

  // An instance moves by its box: where the box landed, less where the box sits from the instance's origin.
  const instances = doc.instances?.map(instance => {
    const obj = objectsById.get(instance.id);
    const box = obj && obj.type === 'rect' ? instanceBox(doc, instance) : null;
    if (!obj || !box || (obj.x === box.x && obj.y === box.y)) return instance;
    return { ...instance, x: instance.x + obj.x - box.x, y: instance.y + obj.y - box.y };
  });

  return { ...doc, nodes, ...(decorations ? { decorations } : {}), ...(instances ? { instances } : {}) };
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
  // An instance takes the parts it draws with it, and so the lines and triggers that name them.
  const goneInstances = (doc.instances ?? []).filter(instance => gone.has(instance.id));
  for (const instance of goneInstances) {
    for (const node of doc.components?.[instance.component]?.nodes ?? []) gone.add(instancePartId(instance.id, node.id));
  }
  const nodes = doc.nodes.filter(n => !gone.has(n.id));
  const kept = new Set([...nodes.map(n => n.id), ...expandComponents(doc).nodes.map(n => n.id).filter(id => !gone.has(id))]);
  const connectors = doc.connectors.filter(c => !gone.has(c.id) && kept.has(c.fromNodeId) && kept.has(c.toNodeId));
  const decorations = doc.decorations?.filter(d => !gone.has(d.id));
  const instances = doc.instances?.filter(instance => !gone.has(instance.id));
  return withTriggers({ ...doc, nodes, connectors, ...(decorations && { decorations }), ...(instances && { instances }) }, triggersWithout(doc.triggers, gone));
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

/** `doc` with instance `id`'s parameter `name` set to `value` — or taken out, when `value` is `undefined`, so the
 *  parameter's default applies. */
export function setInstanceParam(doc: CanvasView, id: string, name: string, value: unknown): CanvasView {
  const instances = doc.instances?.map(instance => {
    if (instance.id !== id) return instance;
    const { [name]: _old, ...rest } = instance.params ?? {};
    const params = value === undefined ? rest : { ...rest, [name]: value };
    const { params: _params, ...bare } = instance;
    return Object.keys(params).length > 0 ? { ...bare, params } : bare;
  });
  return instances ? { ...doc, instances } : doc;
}
