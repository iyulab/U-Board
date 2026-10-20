import { estimateTextWidth } from './caption-geometry.js';
import { shownLabel } from './connector-label.js';
import type { Connector, ConnectorArrow, Node } from './view-document.js';
import type { BoxSize } from './node-size.js';

/** A connector label's font size, and the chip of paper around it. */
export const LABEL_SIZE = 11;
export const LABEL_PAD_X = 4;
export const LABEL_PAD_Y = 2;
/** How far apart connectors joining the same two nodes are drawn, so each shows. */
const PARALLEL_GAP = 8;
/** A connector's width when its style leaves it out. */
export const CONNECTOR_WIDTH = 2;
/** An arrowhead's length grows with the line's width, never shorter than this; its base is three quarters of it. */
const ARROW_MIN_LENGTH = 8;
const ARROW_PER_WIDTH = 4;

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
  /** The line, `[x1, y1, x2, y2, …]` — from the edge of the `fromNodeId` node's box to the edge of the `toNodeId`
   *  node's: two points straight, four when `route` is `orthogonal` and it bends. Drawn short of an end that carries
   *  an arrowhead, so the line stops inside the head instead of poking past its tip. */
  points: number[];
  label?: Box;
  /** Its arrowheads, each a triangle `[tipX, tipY, x2, y2, x3, y3]` whose tip touches the box it points at. */
  arrows?: number[][];
}

/**
 * Where a canvas board's connectors are drawn — one geometry for the renderer and the layout advice, so the advice
 * talks about what is on screen. A straight line runs along the line between the two boxes' centres, from where it
 * leaves one box to where it enters the other. An `orthogonal` one leaves the side of one box facing the other (left
 * or right where the boxes are further apart across than down, else top or bottom), turns at the middle of the gap and
 * enters the facing side of the other — straight when the two centres line up, and straight as before when the boxes
 * overlap and leave no gap to turn in. Connectors joining the same two nodes are shifted side by side; a label sits
 * where its `labelAt` says along the line's length, else at its middle, side-by-side labels taking turns along it; an
 * arrowhead's tip touches the box it points at. `measure` gives a text's width (the canvas's own where there is one).
 * A connector naming a node the document does not have is not placed.
 */
export function placeConnectors(nodes: ReadonlyArray<Pick<Node, 'id' | 'x' | 'y'> & BoxSize>, connectors: readonly Connector[], measure: (text: string, size: number) => number = estimateTextWidth): ConnectorPlacement[] {
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
      const offset = (i - (group.length - 1) / 2) * PARALLEL_GAP;
      const points =
        (connector.style?.route === 'orthogonal' ? elbow(from, to, offset) : undefined) ?? edgeToEdge(from, to, offset, connector.fromNodeId < connector.toNodeId);
      if (!points) return;
      // Side-by-side lines are closer than a label is tall: their labels take turns along the line instead.
      const label = connector.label ? labelBox(shownLabel(connector.label), points, connector.labelAt ?? (i + 1) / (group.length + 1), measure) : undefined;
      const heads = arrowheads(points, connector.style?.arrow, connector.style?.strokeWidth ?? CONNECTOR_WIDTH);
      placed.push({ connector, index, points: heads?.points ?? points, ...(label && { label }), ...(heads && { arrows: heads.arrows }) });
    });
  }
  return placed;
}

/** A label's chip — its text box with the paper around it. */
export function chipOf(text: Box): Box {
  return { x: text.x - LABEL_PAD_X, y: text.y - LABEL_PAD_Y, width: text.width + 2 * LABEL_PAD_X, height: text.height + 2 * LABEL_PAD_Y };
}

export function boxOf(node: Pick<Node, 'x' | 'y'> & BoxSize): Box {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

function labelBox(text: string, points: number[], along: number, measure: (text: string, size: number) => number): Box {
  const width = measure(text, LABEL_SIZE);
  const { x, y } = pointAlong(points, along);
  return { x: x - width / 2, y: y - LABEL_SIZE / 2, width, height: LABEL_SIZE };
}

/** The point `along` (0–1) of a polyline's length from its first point. */
export function pointAlong(points: number[], along: number): { x: number; y: number } {
  const lengths = segmentsOf(points).map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  let left = lengths.reduce((sum, length) => sum + length, 0) * along;
  for (const [i, length] of lengths.entries()) {
    if (left <= length || i === lengths.length - 1) {
      const t = length === 0 ? 0 : Math.min(1, left / length);
      return { x: points[2 * i] + (points[2 * i + 2] - points[2 * i]) * t, y: points[2 * i + 1] + (points[2 * i + 3] - points[2 * i + 1]) * t };
    }
    left -= length;
  }
  return { x: points[0], y: points[1] };
}

/** A polyline's straight runs, each `[x1, y1, x2, y2]`. */
export function segmentsOf(points: number[]): number[][] {
  const segments: number[][] = [];
  for (let i = 0; i + 3 < points.length; i += 2) segments.push(points.slice(i, i + 4));
  return segments;
}

/**
 * The heads an `arrow` asks for on a line, and the line drawn short under them (to the middle of each head, so the
 * line meets it whatever its cap). Each head points along the run it ends; a run too short for its heads gets heads
 * that share it.
 */
function arrowheads(points: number[], arrow: ConnectorArrow | undefined, width: number): { points: number[]; arrows: number[][] } | undefined {
  const ends = arrow === 'both' ? (['start', 'end'] as const) : arrow === 'start' || arrow === 'end' ? [arrow] : [];
  const n = points.length;
  // The run each end finishes, toward its tip.
  const runs = { start: [points[2], points[3], points[0], points[1]], end: [points[n - 4], points[n - 3], points[n - 2], points[n - 1]] };
  if (ends.length === 0 || ends.some(end => Math.hypot(runs[end][2] - runs[end][0], runs[end][3] - runs[end][1]) === 0)) return undefined;
  const drawn = [...points];
  const arrows = ends.map(end => {
    const [fx, fy, tx, ty] = runs[end];
    const length = Math.hypot(tx - fx, ty - fy);
    // Two heads on one run share it.
    const head = Math.min(Math.max(ARROW_MIN_LENGTH, width * ARROW_PER_WIDTH), length / (n === 4 ? ends.length : 1));
    const dx = (tx - fx) / length;
    const dy = (ty - fy) / length;
    const bx = tx - dx * head;
    const by = ty - dy * head;
    const half = (head * 0.75) / 2;
    const at = end === 'end' ? n - 2 : 0;
    [drawn[at], drawn[at + 1]] = [tx - (dx * head) / 2, ty - (dy * head) / 2];
    return [tx, ty, bx - dy * half, by + dx * half, bx + dy * half, by - dx * half];
  });
  return { points: drawn, arrows };
}

/**
 * An orthogonal line from `a` to `b`: out of the side of `a` facing `b`, a turn at the middle of the gap between
 * them, into the facing side of `b` — undefined when the boxes overlap and leave no gap to turn in. Side-by-side
 * siblings are shifted by `offset` both where they run and where they turn, so they stay apart without crossing.
 */
function elbow(a: Box, b: Box, offset: number): number[] | undefined {
  const gapX = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const gapY = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  if (gapX <= 0 && gapY <= 0) return undefined;
  const [acx, acy, bcx, bcy] = [a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2];
  if (gapX >= gapY) {
    const [x1, x2] = bcx > acx ? [a.x + a.width, b.x] : [a.x, b.x + b.width];
    const [y1, y2] = [acy + offset, bcy + offset];
    if (Math.abs(y1 - y2) < 0.5) return [x1, y1, x2, y1];
    const turn = (x1 + x2) / 2 + offset;
    return [x1, y1, turn, y1, turn, y2, x2, y2];
  }
  const [y1, y2] = bcy > acy ? [a.y + a.height, b.y] : [a.y, b.y + b.height];
  const [x1, x2] = [acx + offset, bcx + offset];
  if (Math.abs(x1 - x2) < 0.5) return [x1, y1, x1, y2];
  const turn = (y1 + y2) / 2 + offset;
  return [x1, y1, x1, turn, x2, turn, x2, y2];
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
