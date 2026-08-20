import type { ViewDocument, Node } from './view-document.js';
import type { Adapter, ResolvedWidget } from './adapter.js';
import { resolveWidget } from './adapter.js';

/** A Node whose widget has been resolved against a set of adapters — everything a renderer
 * needs to paint one node without itself knowing how bindings are resolved. */
export interface ResolvedNode extends Omit<Node, 'widget'> {
  widget: ResolvedWidget;
}

/** A ViewDocument with every node's widget resolved. Background and connectors pass through
 * unchanged — they carry no bindings (docs/architecture.md — only widget content is bound). */
export interface ResolvedViewDocument extends Omit<ViewDocument, 'nodes'> {
  nodes: ResolvedNode[];
}

/**
 * Resolves every node's widget bindings in a ViewDocument against the given adapters. This is
 * the single entry point a renderer calls to go from a saved document to something paintable —
 * it has no opinion on canvas-kit, u-widgets, or any other rendering concern.
 */
export async function resolveDocument(
  doc: ViewDocument,
  adapters: readonly Adapter[]
): Promise<ResolvedViewDocument> {
  const nodes = await Promise.all(
    doc.nodes.map(async (node): Promise<ResolvedNode> => ({
      ...node,
      widget: await resolveWidget(node.widget, adapters),
    }))
  );

  return { ...doc, nodes };
}
