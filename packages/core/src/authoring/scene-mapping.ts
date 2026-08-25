import { Scene } from '@canvas-kit/core';
import type { ViewDocument, Node } from '../view-document.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';
import { seedWidget } from './widget-catalog.js';

/** A node's placeholder fill/stroke in the designer canvas — the box being positioned, not the
 * widget itself. The real widget renders in the live preview pane (`resolveDocument` +
 * `toCanvasKit`), which is the render path the renderer/editor separation already owns; the
 * designer only needs a draggable, identifiable footprint (docs/principles.md). */
const NODE_PLACEHOLDER_FILL = 'rgba(59, 130, 246, 0.15)';
const NODE_PLACEHOLDER_STROKE = '#3b82f6';

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
 * Folds a designer Scene's node-rect positions back into a ViewDocument. Reads every `rect`
 * whose id matches a node — not just the one the author just dragged — so it stays correct
 * regardless of how the designer reports the change (single move, batched drag, resize).
 */
export function applySceneToDocument(doc: ViewDocument, scene: Scene): ViewDocument {
  const rectsById = new Map(
    scene
      .getObjects()
      .filter((obj): obj is Extract<typeof obj, { type: 'rect' }> => obj.type === 'rect' && !!obj.id)
      .map(obj => [obj.id as string, obj])
  );

  return {
    ...doc,
    nodes: doc.nodes.map(node => {
      const rect = rectsById.get(node.id);
      return rect ? { ...node, x: rect.x, y: rect.y, width: rect.width, height: rect.height } : node;
    }),
  };
}

/** Appends a new node at `position` with a placeholder widget. Bindings are deliberately absent
 * — wiring a new node to a live source is the next scope (HANDOFF.md — CMMS binding), not this
 * one. `value` is included even though it's static and unbound: u-widgets' status widget renders
 * nothing at all when `data.value` is absent (it treats a valueless item as not an item), so a
 * new node needs a placeholder value to be visible before it's ever bound. */
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
