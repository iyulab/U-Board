import { measureTextWidth, type DrawingObject } from '@canvas-kit/core';
import { CAPTION_SIZE, captionBox } from '../caption-geometry.js';
import { CONNECTOR_WIDTH, LABEL_SIZE, chipOf, placeConnectors, type ConnectorPlacement } from '../connector-geometry.js';
import type { BoardAppearance, Connector } from '../view-document.js';
import type { SizedNode } from '../node-size.js';
import type { ConnectionQuality } from '../adapter.js';
import { worstQuality } from '../quality-text.js';
import { DASH_PATTERNS } from './decoration-drawing.js';

/** A connector's look when its style leaves it out. */
export const CONNECTOR_STROKE = '#94a3b8';
type Line = Extract<DrawingObject, { type: 'line' }>;

/** A label sits on a chip of the board's paper, so it reads across the line under it. */
const LABEL_CHIP: Record<BoardAppearance, { fill: string; ink: string }> = {
  light: { fill: '#ffffff', ink: '#475569' },
  dark: { fill: '#1e293b', ink: '#cbd5e1' },
};

/** A bound label not showing a current value is rimmed like a widget's frame in that state (`QUALITY_FRAME_STYLE`). */
const QUALITY_RIM: Partial<Record<ConnectionQuality, string>> = { stale: '#f59e0b', disconnected: '#6b7280' };

/** A node's name reads stronger than a link's label. */
const CAPTION_INK: Record<BoardAppearance, string> = { light: '#1e293b', dark: '#e5e7eb' };

/** A text's width as the canvas draws it. */
const measure = (text: string, size: number) => measureTextWidth({ type: 'text', x: 0, y: 0, text, fontSize: size });

/** Where connectors are drawn on this canvas — `placeConnectors` measuring text as the canvas draws it. */
export function placeOnCanvas<C extends Connector>(nodes: readonly SizedNode[], connectors: readonly C[]): Array<ConnectorPlacement & { connector: C }> {
  return placeConnectors(nodes, connectors, measure) as Array<ConnectorPlacement & { connector: C }>;
}

/**
 * What a canvas board's connectors draw — the same for the viewer and the editor, placed by `placeConnectors`: each
 * line edge to edge with its arrowheads in the line's colour, connectors of the same two nodes side by side, and a label
 * on a chip along its line, over every line. `extra` goes on each line; `locked` (drawn only) or `fixed` (selected,
 * never moved — an editor's lines) on its heads and chip too, and a label's text is then locked, so a press on it
 * reaches the chip.
 */
export function connectorObjects(nodes: readonly SizedNode[], connectors: ReadonlyArray<Connector & { quality?: Record<string, ConnectionQuality> }>, appearance: BoardAppearance = 'light', extra: Partial<Line> = {}): DrawingObject[] {
  const lines: DrawingObject[] = [];
  const labels: DrawingObject[] = [];
  const held = { ...(extra.locked && { locked: true }), ...(extra.fixed && { fixed: true }) };
  for (const { connector, points, label, arrows = [] } of placeOnCanvas(nodes, connectors)) {
    const { stroke = CONNECTOR_STROKE, strokeWidth = CONNECTOR_WIDTH, dash = 'solid' } = connector.style ?? {};
    lines.push({ type: 'line', id: connector.id, x: 0, y: 0, points, stroke, strokeWidth, ...(DASH_PATTERNS[dash].length > 0 && { dash: DASH_PATTERNS[dash] }), ...extra });
    // A head is filled, not stroked — a dashed line's head stays whole.
    arrows.forEach((points, i) => lines.push({ type: 'path', id: `${connector.id}#arrow${i}`, x: 0, y: 0, points, closed: true, fill: stroke, ...held }));
    if (label) {
      const worst = worstQuality((connector as { quality?: Record<string, ConnectionQuality> }).quality ?? {});
      const rim = worst ? QUALITY_RIM[worst] : undefined;
      labels.push(
        { type: 'rect', id: `${connector.id}#chip`, ...chipOf(label), fill: LABEL_CHIP[appearance].fill, ...(rim && { stroke: rim, strokeWidth: 1.5 }), ...held },
        { type: 'text', id: `${connector.id}#label`, x: label.x, y: label.y, text: connector.label!, fontSize: LABEL_SIZE, fill: LABEL_CHIP[appearance].ink, ...((extra.locked || extra.fixed) && { locked: true }) }
      );
    }
  }
  return [...lines, ...labels];
}

/**
 * What nodes' captions draw: each name centred under its node's box on a chip of the paper — over every connector,
 * so a line passing under a name never runs through it.
 */
export function captionObjects(nodes: readonly SizedNode[], appearance: BoardAppearance = 'light', locked?: boolean): DrawingObject[] {
  const objects: DrawingObject[] = [];
  for (const node of nodes) {
    if (!node.caption) continue;
    const at = captionBox(node, measure);
    objects.push({ type: 'rect', id: `${node.id}#caption-chip`, ...chipOf(at), fill: LABEL_CHIP[appearance].fill, ...(locked && { locked }) });
    objects.push({ type: 'text', id: `${node.id}#caption`, x: at.x, y: at.y, text: node.caption, fontSize: CAPTION_SIZE, fill: CAPTION_INK[appearance], ...(locked && { locked }) });
  }
  return objects;
}
