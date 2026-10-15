import type { ViewDocument, CanvasView, GridView, Placed, Node, GridItem } from './view-document.js';
import type { Adapter, ResolvedWidget } from './adapter.js';
import { resolveWidget } from './adapter.js';

/** A placed widget resolved against a set of adapters — everything a renderer needs to paint it without
 *  itself knowing how bindings are resolved. */
export type Resolved<T extends Placed> = Omit<T, 'widget'> & { widget: ResolvedWidget };

/** A canvas view's node, resolved. */
export type ResolvedNode = Resolved<Node>;

/** A grid view's item, resolved. */
export type ResolvedGridItem = Resolved<GridItem>;

/** A canvas view with every node's widget resolved. Background and connectors pass through
 * unchanged — they carry no bindings (docs/architecture.md — only widget content is bound). */
export interface ResolvedCanvasView extends Omit<CanvasView, 'nodes'> {
  nodes: ResolvedNode[];
}

/** A grid view with every item's widget resolved. */
export interface ResolvedGridView extends Omit<GridView, 'items'> {
  items: ResolvedGridItem[];
}

/** A ViewDocument with every widget resolved — of the same kind as the document it came from. */
export type ResolvedViewDocument = ResolvedCanvasView | ResolvedGridView;

/** The resolved form of a document type: a canvas view resolves to a resolved canvas view, and so on. */
export type ResolvedOf<D extends ViewDocument> = D extends CanvasView ? ResolvedCanvasView : D extends GridView ? ResolvedGridView : ResolvedViewDocument;

/**
 * Resolves every widget's bindings in a ViewDocument against the given adapters. This is
 * the single entry point a renderer calls to go from a saved document to something paintable —
 * it has no opinion on canvas-kit, u-widgets, or any other rendering concern.
 */
export async function resolveDocument(doc: CanvasView, adapters: readonly Adapter[]): Promise<ResolvedCanvasView>;
export async function resolveDocument(doc: GridView, adapters: readonly Adapter[]): Promise<ResolvedGridView>;
export async function resolveDocument(doc: ViewDocument, adapters: readonly Adapter[]): Promise<ResolvedViewDocument>;
export async function resolveDocument(doc: ViewDocument, adapters: readonly Adapter[]): Promise<ResolvedViewDocument> {
  const resolve = <T extends Placed>(placed: readonly T[]) =>
    Promise.all(placed.map(async (p): Promise<Resolved<T>> => ({ ...p, widget: await resolveWidget(p.widget, adapters) })));
  return doc.kind === 'canvas'
    ? { ...doc, nodes: await resolve(doc.nodes) }
    : { ...doc, items: await resolve(doc.items) };
}
