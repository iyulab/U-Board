import type { CanvasView } from '../view-document.js';
import { expandComponents, instancePartId } from '../components.js';
import { widgetTypeName } from './widget-catalog.js';

/**
 * How the editor names a node of `doc` to an author — by its caption, else by its widget's type and its place among the
 * board's nodes ("Status 2"); a part a component instance draws by the instance and the part as drawn ("press-2 ›
 * Temp", its caption — a parameter filled in — else its widget's type). Anything else by its id.
 */
export function partNamer(doc: CanvasView, locale?: string): (id: string) => string {
  const named = new Map(doc.nodes.map((node, i) => [node.id, node.caption || `${widgetTypeName(node.widget.type, locale)} ${i + 1}`]));
  const instanceOf = new Map(
    (doc.instances ?? []).flatMap(instance => (doc.components?.[instance.component]?.nodes ?? []).map(node => [instancePartId(instance.id, node.id), instance.id] as const))
  );
  for (const node of expandComponents(doc).nodes) {
    const instance = instanceOf.get(node.id);
    if (instance !== undefined) named.set(node.id, `${instance} › ${node.caption || widgetTypeName(node.widget.type, locale)}`);
  }
  return id => named.get(id) ?? id;
}
