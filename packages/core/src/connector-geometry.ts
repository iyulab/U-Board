import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './layout-defaults.js';
import { estimateTextWidth } from './caption-geometry.js';
import type { Connector, Node } from './view-document.js';

/** A connector label's font size, and the chip of paper around it. */
export const LABEL_SIZE = 11;
export const LABEL_PAD_X = 4;
export const LABEL_PAD_Y = 2;
/** How far apart connectors joining the same two nodes are drawn, so each shows. */
const PARALLEL_GAP = 8;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where one connector is drawn: its line, and — when it has a label — the label's text box. */
export interface ConnectorPlacement {
  connector: Connector;
  /** Its index in the document's `connectors`. */
  index: number;
  /** `[x1, y1, x2, y2]` — from the edge of one node's box to the edge of the other's. */
  segment: number[];
  label?: Box;
}

/**
 * Where a canvas board's connectors are drawn — one geometry for the renderer and the layout advice, so the advice
 * talks about what is on screen. A line runs along the line between the two boxes' centres, from where it leaves one
 * box to where it enters the other; connectors joining the same two nodes are shifted side by side; a label sits at
 * the line's middle, side-by-side labels taking turns along it. `measure` gives a text's width (the canvas's own
 * where there is one). A connector naming a node the document does not have is not placed.
 */
export function placeConnectors(nodes: readonly Node[], connectors: readonly Connector[], measure: (text: string, size: number) => number = estimateTextWidth): ConnectorPlacement[] {
  const boxes = new Map(nodes.map(node => [node.id, boxOf(node)]));
  const siblings = new Map<string, Array<{ connector: Connector; index: number }>>();
  connectors.forEach((connector, index) => {
    const key = [connector.fromNodeId, connector.toNodeId].sort().join('\u0000');
    siblings.set(key, [...(siblings.get(key) ?? []), { connector, index }]);
  });

  const placed: ConnectorPlacement[] = [];
  for (const group of siblings.values()) {
    group.forEach(({ connector, index }, i) => {
      const from = boxes.get(connector.fromNodeId);
      const to = boxes.get(connector.toNodeId);
      if (!from || !to) return;
      const segment = edgeToEdge(from, to, (i - (group.length - 1) / 2) * PARALLEL_GAP, connector.fromNodeId < connector.toNodeId);
      if (!segment) return;
      // Side-by-side lines are closer than a label is tall: their labels take turns along the line instead.
      const label = connector.label ? labelBox(connector.label, segment, (i + 1) / (group.length + 1), measure) : undefined;
      placed.push({ connector, index, segment, ...(label && { label }) });
    });
  }
  return placed;
}

/** A label's chip — its text box with the paper around it. */
export function chipOf(text: Box): Box {
  return { x: text.x - LABEL_PAD_X, y: text.y - LABEL_PAD_Y, width: text.width + 2 * LABEL_PAD_X, height: text.height + 2 * LABEL_PAD_Y };
}

export function boxOf(node: Node): Box {
  return { x: node.x, y: node.y, width: node.width ?? DEFAULT_NODE_WIDTH, height: node.height ?? DEFAULT_NODE_HEIGHT };
}

function labelBox(text: string, [x1, y1, x2, y2]: number[], along: number, measure: (text: string, size: number) => number): Box {
  const width = measure(text, LABEL_SIZE);
  const cx = x1 + (x2 - x1) * along;
  const cy = y1 + (y2 - y1) * along;
  return { x: cx - width / 2, y: cy - LABEL_SIZE / 2, width, height: LABEL_SIZE };
}

/** The part of the line between the two boxes' centres (shifted sideways by `offset`) that lies outside both boxes. */
function edgeToEdge(a: Box, b: Box, offset: number, forward: boolean): number[] | undefined {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  const length = Math.hypot(bx - ax, by - ay);
  if (length === 0) return undefined;
  // The sideways shift is measured the same way whichever end the connector starts at, so siblings never coincide.
  const sign = forward ? 1 : -1;
  const nx = (-(by - ay) / length) * offset * sign;
  const ny = ((bx - ax) / length) * offset * sign;
  const start = { x: ax + nx, y: ay + ny };
  const end = { x: bx + nx, y: by + ny };
  const leave = exitAt(a, start, end);
  const arrive = exitAt(b, end, start);
  if (leave === undefined || arrive === undefined || leave + arrive >= 1) return [start.x, start.y, end.x, end.y];
  const at = (t: number) => [start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t];
  return [...at(leave), ...at(1 - arrive)];
}

/** Where (0–1 along p→q) the segment leaves `box`, which holds p — or undefined when p lies outside it. */
function exitAt(box: Box, p: { x: number; y: number }, q: { x: number; y: number }): number | undefined {
  if (p.x < box.x || p.x > box.x + box.width || p.y < box.y || p.y > box.y + box.height) return undefined;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (box.x + box.width - p.x) / dx);
  if (dx < 0) t = Math.min(t, (box.x - p.x) / dx);
  if (dy > 0) t = Math.min(t, (box.y + box.height - p.y) / dy);
  if (dy < 0) t = Math.min(t, (box.y - p.y) / dy);
  return Number.isFinite(t) ? t : undefined;
}
