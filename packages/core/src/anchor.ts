import type { Background, Node } from './view-document.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './layout-defaults.js';

/** A coordinate in the space a background depicts (`BackgroundImage.referencePoints`). */
export interface Coordinate {
  x: number;
  y: number;
}

/** The point of a node its anchor is at: the center of its box, sized by default when it has no size of its
 *  own — a marker's place, wherever the box grows to around it. */
export function anchorPoint(node: Pick<Node, 'x' | 'y' | 'width' | 'height'>): { x: number; y: number } {
  return { x: node.x + (node.width ?? DEFAULT_NODE_WIDTH) / 2, y: node.y + (node.height ?? DEFAULT_NODE_HEIGHT) / 2 };
}

/** The coordinate a point of the background stands for, or `null` when the background declares none. */
export function coordinateAt(background: Background, point: { x: number; y: number }): Coordinate | null {
  const points = background.image?.referencePoints;
  if (!points) return null;
  const [a, b] = points;
  return { x: along(point.x, a.x, b.x, a.coordinate.x, b.coordinate.x), y: along(point.y, a.y, b.y, a.coordinate.y, b.coordinate.y) };
}

/** The point of the background a coordinate stands at, or `null` when the background declares none. */
export function pointAt(background: Background, coordinate: Coordinate): { x: number; y: number } | null {
  const points = background.image?.referencePoints;
  if (!points) return null;
  const [a, b] = points;
  return { x: along(coordinate.x, a.coordinate.x, b.coordinate.x, a.x, b.x), y: along(coordinate.y, a.coordinate.y, b.coordinate.y, a.y, b.y) };
}

/** The coordinate a node is anchored at — its box's center, read through the background's reference points —
 *  or `null` when the background declares none. Meaningful for an anchored node (`Node.anchored`). */
export function coordinateOf(background: Background, node: Pick<Node, 'x' | 'y' | 'width' | 'height'>): Coordinate | null {
  return coordinateAt(background, anchorPoint(node));
}

/** Where a node goes (`x`/`y`, its box's top-left) for its anchor to be at `coordinate`, or `null` when the
 *  background declares no reference points. */
export function placeAt(background: Background, node: Pick<Node, 'width' | 'height'>, coordinate: Coordinate): { x: number; y: number } | null {
  const point = pointAt(background, coordinate);
  if (!point) return null;
  return { x: point.x - (node.width ?? DEFAULT_NODE_WIDTH) / 2, y: point.y - (node.height ?? DEFAULT_NODE_HEIGHT) / 2 };
}

/** `value` on the axis from `from0`–`from1` mapped linearly onto `to0`–`to1`. */
function along(value: number, from0: number, from1: number, to0: number, to1: number): number {
  return to0 + ((value - from0) / (from1 - from0)) * (to1 - to0);
}

