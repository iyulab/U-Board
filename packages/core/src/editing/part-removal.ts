import type { CanvasView } from '../view-document.js';
import { expandComponents, instancePartId } from '../components.js';
import { triggersWithout, withTriggers } from './trigger-editing.js';

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
