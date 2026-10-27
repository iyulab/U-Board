import type { CanvasView } from '@iyulab/u-board/picture';
import { widgetTypeName } from './widget-catalog.js';

/**
 * How the editor names a node of `doc` to an author — by its caption, else by its widget's type and its place among the
 * board's nodes ("Status 2"). Anything else by its id.
 */
export function partNamer(doc: CanvasView, locale?: string): (id: string) => string {
  const named = new Map(doc.nodes.map((node, i) => [node.id, node.caption || `${widgetTypeName(node.widget.type, locale)} ${i + 1}`]));
  return id => named.get(id) ?? id;
}
