import { measureTextWidth, type DrawingObject } from '@canvas-kit/core';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import type { BoardAppearance, Connector, ConnectorDash, Node } from '../view-document.js';

/** A connector's look when its style leaves it out. */
export const CONNECTOR_STROKE = '#94a3b8';
export const CONNECTOR_WIDTH = 2;
/** How far apart connectors joining the same two nodes are drawn, so each shows. */
const PARALLEL_GAP = 8;
type Line = Extract<DrawingObject, { type: 'line' }>;
type Rect = Extract<DrawingObject, { type: 'rect' }>;
type Text = Extract<DrawingObject, { type: 'text' }>;

const DASHES: Record<ConnectorDash, number[]> = { solid: [], dashed: [6, 4], dotted: [2, 3] };

const LABEL_SIZE = 11;
const LABEL_PAD_X = 4;
const LABEL_PAD_Y = 2;
/** A label sits on a chip of the board's paper, so it reads across the line under it. */
const LABEL_CHIP: Record<BoardAppearance, { fill: string; ink: string }> = {
  light: { fill: '#ffffff', ink: '#475569' },
  dark: { fill: '#1e293b', ink: '#cbd5e1' },
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * What a canvas board's connectors draw — the same for the viewer and the editor: a line from the edge of one node's
 * box to the edge of the other's (along the line between their centres), connectors joining the same two nodes drawn
 * side by side, and a connector's label on a chip at its middle (connectors side by side take turns along it). A connector naming a node the document does not
 * have draws nothing (a malformed document, not a crash).
 */
export function connectorObjects(nodes: readonly Node[], connectors: readonly Connector[], appearance: BoardAppearance = 'light', extra: Partial<Line> = {}): DrawingObject[] {
  const boxes = new Map(nodes.map(node => [node.id, boxOf(node)]));
  const siblings = new Map<string, Connector[]>();
  for (const connector of connectors) {
    const key = [connector.fromNodeId, connector.toNodeId].sort().join('\u0000');
    siblings.set(key, [...(siblings.get(key) ?? []), connector]);
  }

  const lines: DrawingObject[] = [];
  const labels: DrawingObject[] = [];
  for (const group of siblings.values()) {
    group.forEach((connector, index) => {
      const from = boxes.get(connector.fromNodeId);
      const to = boxes.get(connector.toNodeId);
      if (!from || !to) return;
      const offset = (index - (group.length - 1) / 2) * PARALLEL_GAP;
      const segment = edgeToEdge(from, to, offset, connector.fromNodeId < connector.toNodeId);
      if (!segment) return;
      const { stroke = CONNECTOR_STROKE, strokeWidth = CONNECTOR_WIDTH, dash = 'solid' } = connector.style ?? {};
      lines.push({ type: 'line', id: connector.id, x: 0, y: 0, points: segment, stroke, strokeWidth, ...(DASHES[dash].length > 0 && { dash: DASHES[dash] }), ...extra });
      // Side-by-side lines are closer than a label is tall: their labels take turns along the line instead.
      const along = (index + 1) / (group.length + 1);
      if (connector.label) labels.push(...labelObjects(connector, segment, along, appearance, extra.locked));
    });
  }
  // Labels over every line, so a line drawn later never crosses another's label.
  return [...lines, ...labels];
}

function boxOf(node: Node): Box {
  return { x: node.x, y: node.y, width: node.width ?? DEFAULT_NODE_WIDTH, height: node.height ?? DEFAULT_NODE_HEIGHT };
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

function labelObjects(connector: Connector, segment: number[], along: number, appearance: BoardAppearance, locked?: boolean): DrawingObject[] {
  const [x1, y1, x2, y2] = segment;
  const text: Text = { type: 'text', id: `${connector.id}#label`, x: 0, y: 0, text: connector.label!, fontSize: LABEL_SIZE, fill: LABEL_CHIP[appearance].ink };
  const width = measureTextWidth(text);
  const cx = x1 + (x2 - x1) * along;
  const cy = y1 + (y2 - y1) * along;
  const chip: Rect = {
    type: 'rect',
    id: `${connector.id}#chip`,
    x: cx - width / 2 - LABEL_PAD_X,
    y: cy - LABEL_SIZE / 2 - LABEL_PAD_Y,
    width: width + 2 * LABEL_PAD_X,
    height: LABEL_SIZE + 2 * LABEL_PAD_Y,
    fill: LABEL_CHIP[appearance].fill,
    ...(locked && { locked }),
  };
  return [chip, { ...text, x: cx - width / 2, y: cy - LABEL_SIZE / 2, ...(locked && { locked }) }];
}
