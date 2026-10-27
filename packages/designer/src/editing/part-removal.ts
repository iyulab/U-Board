import type { CanvasView } from '@iyulab/u-board/picture';
import { triggersWithout, withTriggers } from './trigger-editing.js';

/** The document without these parts — nodes, decorations or connectors by id. A node takes the connectors that join
 * it along: a line to nothing is not a board. */
export function removeParts(doc: CanvasView, ids: readonly string[]): CanvasView {
  const gone = new Set(ids);
  const nodes = doc.nodes.filter(n => !gone.has(n.id));
  const kept = new Set(nodes.map(n => n.id));
  const connectors = doc.connectors.filter(c => !gone.has(c.id) && kept.has(c.fromNodeId) && kept.has(c.toNodeId));
  const decorations = doc.decorations?.filter(d => !gone.has(d.id));
  return withTriggers({ ...doc, nodes, connectors, ...(decorations && { decorations }) }, triggersWithout(doc.triggers, gone));
}
