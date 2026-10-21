import type { CSSProperties } from 'react';
import type { ViewerOverlayItem } from '@canvas-kit/viewer';
import type { ConnectorPlacement } from '../connector-geometry.js';
import { labelChipOf } from '../connector-geometry.js';
import type { ConnectionQuality } from '../adapter.js';
import { describeQuality, worstQuality, type QualityText } from '../quality-text.js';

// The same visually-hidden technique as a node frame's status region (node-frame.tsx).
const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const MARK_STYLE: CSSProperties = { position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' };

type Placed = ConnectorPlacement & { connector: { quality?: Record<string, ConnectionQuality> } };

/**
 * A connector's place on the page, over the box its line, heads and label take: a canvas draws the line, so without
 * this a connector's text and how current its values are reach neither assistive technology nor a page reading the
 * board (a test, a tool taking a picture of one part). Display-only — the pointer passes through it — and nothing
 * shows: its label is text for a reader, its quality (`data-quality`, like a node frame's) announced as a node's is.
 */
export function connectorMark({ connector, points, label, arrows = [] }: Placed, qualityText: QualityText, now: number): ViewerOverlayItem {
  const xs = [...points.filter((_, i) => i % 2 === 0), ...arrows.flatMap(head => [head[0], head[2], head[4]])];
  const ys = [...points.filter((_, i) => i % 2 === 1), ...arrows.flatMap(head => [head[1], head[3], head[5]])];
  if (label) {
    const chip = labelChipOf(label);
    xs.push(chip.x, chip.x + chip.width);
    ys.push(chip.y, chip.y + chip.height);
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const quality = connector.quality ?? {};
  const worst = worstQuality(quality);
  const announced = describeQuality({ quality }, { text: qualityText, now });
  return {
    id: connector.id,
    x,
    y,
    width: Math.max(1, Math.max(...xs) - x),
    height: Math.max(1, Math.max(...ys) - y),
    interactive: false,
    content: (
      <div style={MARK_STYLE} data-connector-id={connector.id} {...(worst && worst !== 'live' && { 'data-quality': worst })}>
        {connector.label && <span style={VISUALLY_HIDDEN_STYLE}>{connector.label}</span>}
        <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>
          {announced ?? ''}
        </span>
      </div>
    ),
  };
}
