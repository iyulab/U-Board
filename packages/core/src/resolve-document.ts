import type { ViewDocument, CanvasView, GridView, Placed, Node, GridItem, Connector, ConnectorDash } from './view-document.js';
import type { Adapter, ConnectionQuality, ResolvedWidget } from './adapter.js';
import { resolveBindings, resolveWidget } from './adapter.js';

/** A placed widget resolved against a set of adapters — everything a renderer needs to paint it without
 *  itself knowing how bindings are resolved. */
export type Resolved<T extends Placed> = Omit<T, 'widget'> & { widget: ResolvedWidget };

/** A canvas view's node, resolved. */
export type ResolvedNode = Resolved<Node>;

/** A grid view's item, resolved. */
export type ResolvedGridItem = Resolved<GridItem>;

/** A connector with its bound label and style read: the static values replaced where a binding read a value, and how
 *  each binding read, per path. A connector without bindings has an empty `quality`. */
export type ResolvedConnector = Connector & { quality: Record<string, ConnectionQuality> };

/** A canvas view with every node's widget and every connector's bindings resolved. The background passes through
 * unchanged — it carries no bindings. */
export interface ResolvedCanvasView extends Omit<CanvasView, 'nodes' | 'connectors'> {
  nodes: ResolvedNode[];
  connectors: ResolvedConnector[];
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
    ? { ...doc, nodes: await resolve(doc.nodes), connectors: await Promise.all(doc.connectors.map(c => resolveConnector(c, adapters))) }
    : { ...doc, items: await resolve(doc.items) };
}

const DASHES: readonly ConnectorDash[] = ['solid', 'dashed', 'dotted'];

/**
 * A connector's bindings read into its label and style. A value is taken only in the form its path draws — a label
 * as text (a number shown as it reads), a width as a positive number, a dash as one of its three words, a colour as
 * text (an unreadable colour paints the default) — otherwise the static value stays, as for a disconnected binding.
 */
export async function resolveConnector(connector: Connector, adapters: readonly Adapter[]): Promise<ResolvedConnector> {
  if (!connector.bindings || Object.keys(connector.bindings).length === 0) return { ...connector, quality: {} };
  const { values, quality } = await resolveBindings(
    { label: connector.label, style: { ...connector.style } },
    connector.bindings,
    adapters,
    (path, value) => {
      if (path === 'label') return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
      if (path === 'style.strokeWidth') return typeof value === 'number' && value > 0 ? value : undefined;
      if (path === 'style.dash') return DASHES.includes(value as ConnectorDash) ? value : undefined;
      if (path === 'style.stroke') return typeof value === 'string' ? value : undefined;
      return undefined;
    }
  );
  const { label, style } = values as Pick<Connector, 'label' | 'style'>;
  return { ...connector, ...(label !== undefined && { label }), ...(style && Object.keys(style).length > 0 && { style }), quality };
}
