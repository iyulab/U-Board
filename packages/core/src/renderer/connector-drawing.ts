import { measureTextWidth, type DrawingObject } from '@canvas-kit/core';
import { CAPTION_SIZE, captionBox } from '../caption-geometry.js';
import { LABEL_SIZE, chipOf, placeConnectors } from '../connector-geometry.js';
import type { BoardAppearance, Connector, ConnectorDash, Node } from '../view-document.js';

/** A connector's look when its style leaves it out. */
export const CONNECTOR_STROKE = '#94a3b8';
export const CONNECTOR_WIDTH = 2;
type Line = Extract<DrawingObject, { type: 'line' }>;

const DASHES: Record<ConnectorDash, number[]> = { solid: [], dashed: [6, 4], dotted: [2, 3] };

/** A label sits on a chip of the board's paper, so it reads across the line under it. */
const LABEL_CHIP: Record<BoardAppearance, { fill: string; ink: string }> = {
  light: { fill: '#ffffff', ink: '#475569' },
  dark: { fill: '#1e293b', ink: '#cbd5e1' },
};

/** A node's name reads stronger than a link's label. */
const CAPTION_INK: Record<BoardAppearance, string> = { light: '#1e293b', dark: '#e5e7eb' };

/** A text's width as the canvas draws it. */
const measure = (text: string, size: number) => measureTextWidth({ type: 'text', x: 0, y: 0, text, fontSize: size });

/**
 * What a canvas board's connectors draw — the same for the viewer and the editor, placed by `placeConnectors`: each
 * line edge to edge, connectors of the same two nodes side by side, and a label on a chip at its line's middle, over
 * every line.
 */
export function connectorObjects(nodes: readonly Node[], connectors: readonly Connector[], appearance: BoardAppearance = 'light', extra: Partial<Line> = {}): DrawingObject[] {
  const lines: DrawingObject[] = [];
  const labels: DrawingObject[] = [];
  for (const { connector, segment, label } of placeConnectors(nodes, connectors, measure)) {
    const { stroke = CONNECTOR_STROKE, strokeWidth = CONNECTOR_WIDTH, dash = 'solid' } = connector.style ?? {};
    lines.push({ type: 'line', id: connector.id, x: 0, y: 0, points: segment, stroke, strokeWidth, ...(DASHES[dash].length > 0 && { dash: DASHES[dash] }), ...extra });
    if (label) {
      labels.push(
        { type: 'rect', id: `${connector.id}#chip`, ...chipOf(label), fill: LABEL_CHIP[appearance].fill, ...(extra.locked && { locked: true }) },
        { type: 'text', id: `${connector.id}#label`, x: label.x, y: label.y, text: connector.label!, fontSize: LABEL_SIZE, fill: LABEL_CHIP[appearance].ink, ...(extra.locked && { locked: true }) }
      );
    }
  }
  return [...lines, ...labels];
}

/**
 * What nodes' captions draw: each name centred under its node's box on a chip of the paper — over every connector,
 * so a line passing under a name never runs through it.
 */
export function captionObjects(nodes: readonly Node[], appearance: BoardAppearance = 'light', locked?: boolean): DrawingObject[] {
  const objects: DrawingObject[] = [];
  for (const node of nodes) {
    if (!node.caption) continue;
    const at = captionBox(node, measure);
    objects.push({ type: 'rect', id: `${node.id}#caption-chip`, ...chipOf(at), fill: LABEL_CHIP[appearance].fill, ...(locked && { locked }) });
    objects.push({ type: 'text', id: `${node.id}#caption`, x: at.x, y: at.y, text: node.caption, fontSize: CAPTION_SIZE, fill: CAPTION_INK[appearance], ...(locked && { locked }) });
  }
  return objects;
}
