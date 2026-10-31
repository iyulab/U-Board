import type { ViewDocument, CanvasView, GridView, Placed, Node, GridWidgetItem, GridCanvasItem, CellCanvas, Connector, ConnectorArrow, StrokeDash } from './view-document.js';
import { CONNECTOR_ARROWS, STROKE_DASHES, isCanvasItem } from './view-document.js';
import type { Adapter, ConnectionQuality, ResolvedWidget } from './adapter.js';
import { resolveBindings, resolveWidgetReadings } from './adapter.js';
import { stateOf } from './states.js';
import { fillLabel, isLabelPattern } from './connector-label.js';

/** A placed widget resolved against a set of adapters — everything a renderer needs to paint it without
 *  itself knowing how bindings are resolved — and, when it has states, the one it is in now (`stateOf`). */
export type Resolved<T extends Placed> = Omit<T, 'widget'> & { widget: ResolvedWidget; state?: string; highlighted?: true };

/** A canvas view's node, resolved. */
export type ResolvedNode = Resolved<Node>;

/** A grid view's item, resolved: a widget item's widget, or every node and connector of a canvas cell. */
export type ResolvedGridItem = Resolved<GridWidgetItem> | ResolvedCanvasItem;

/** A grid view's canvas cell, its canvas resolved. */
export type ResolvedCanvasItem = Omit<GridCanvasItem, 'canvas'> & { canvas: ResolvedCellCanvas };

/** A canvas cell with every node's widget and every connector's bindings resolved. */
export interface ResolvedCellCanvas extends Omit<CellCanvas, 'nodes' | 'connectors'> {
  nodes: ResolvedNode[];
  connectors: ResolvedConnector[];
}

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

/**
 * Whether a placed widget's highlight is on: the reading it names says yes — `true`, the text `true`, or a number other than 0.
 * A reading that is not there (the source did not answer, or has no such field) switches nothing on.
 */
function isHighlighted(rule: Placed['highlight'], readings: Readonly<Record<string, unknown>>): boolean {
  if (!rule || typeof rule.from !== 'string' || !Object.hasOwn(readings, rule.from)) return false;
  const read = readings[rule.from];
  return read === true || read === 'true' || (typeof read === 'number' && Number.isFinite(read) && read !== 0);
}

/** A ViewDocument with every widget resolved — of the same kind as the document it came from. */
export type ResolvedViewDocument = ResolvedCanvasView | ResolvedGridView;

/** The resolved form of a document type: a canvas view resolves to a resolved canvas view, and so on. */
export type ResolvedOf<D extends ViewDocument> = D extends CanvasView ? ResolvedCanvasView : D extends GridView ? ResolvedGridView : ResolvedViewDocument;

/**
 * Resolves every widget's bindings in a ViewDocument against the given adapters. This is the single entry point a renderer calls to go from a saved document to something
 * paintable — it has no opinion on canvas-kit, u-widgets, or any other rendering concern.
 */
export async function resolveDocument(doc: CanvasView, adapters: readonly Adapter[]): Promise<ResolvedCanvasView>;
export async function resolveDocument(doc: GridView, adapters: readonly Adapter[]): Promise<ResolvedGridView>;
export async function resolveDocument(doc: ViewDocument, adapters: readonly Adapter[]): Promise<ResolvedViewDocument>;
export async function resolveDocument(doc: ViewDocument, adapters: readonly Adapter[]): Promise<ResolvedViewDocument> {
  const resolve = <T extends Placed>(placed: readonly T[]) =>
    Promise.all(
      placed.map(async (p): Promise<Resolved<T>> => {
        const { widget, readings } = await resolveWidgetReadings(p.widget, adapters);
        const state = stateOf(p.states, readings, widget.quality);
        return { ...p, widget, ...(state !== undefined && { state }), ...(isHighlighted(p.highlight, readings) && { highlighted: true as const }) };
      })
    );
  const connectors = (list: readonly Connector[]) => Promise.all(list.map(c => resolveConnector(c, adapters)));
  if (doc.kind === 'canvas') return { ...doc, nodes: await resolve(doc.nodes), connectors: await connectors(doc.connectors) };
  const items = await Promise.all(
    doc.items.map(async (item): Promise<ResolvedGridItem> =>
      isCanvasItem(item)
        ? { ...item, canvas: { ...item.canvas, nodes: await resolve(item.canvas.nodes), connectors: await connectors(item.canvas.connectors) } }
        : (await resolve([item]))[0]
    )
  );
  return { ...doc, items };
}

/**
 * A connector's bindings read into its label and style. A value is taken only in the form its path draws — a label
 * as text (a number shown as it reads), a width as a positive number, a dash or an arrow as one of its words, a colour
 * as text (an unreadable colour paints the default) — otherwise the static value stays, as for a disconnected binding.
 * A label whose text names `{{value}}` is a pattern: the value fills that place, and `—` does while there is none.
 */
export async function resolveConnector(connector: Connector, adapters: readonly Adapter[]): Promise<ResolvedConnector> {
  if (!connector.bindings || Object.keys(connector.bindings).length === 0) return { ...connector, quality: {} };
  const pattern = connector.bindings.label && isLabelPattern(connector.label) ? connector.label : undefined;
  const { values, quality } = await resolveBindings(
    { label: connector.label, style: { ...connector.style } },
    connector.bindings,
    adapters,
    (path, value) => {
      if (path === 'label') return typeof value === 'string' || typeof value === 'number' ? (pattern ? fillLabel(pattern, value) : String(value)) : undefined;
      if (path === 'style.strokeWidth') return typeof value === 'number' && value > 0 ? value : undefined;
      if (path === 'style.dash') return STROKE_DASHES.includes(value as StrokeDash) ? value : undefined;
      if (path === 'style.arrow') return CONNECTOR_ARROWS.includes(value as ConnectorArrow) ? value : undefined;
      if (path === 'style.stroke') return typeof value === 'string' ? value : undefined;
      return undefined;
    }
  );
  const { style } = values as Pick<Connector, 'label' | 'style'>;
  // A pattern whose value did not come keeps its text around a dash, never its `{{value}}`.
  const label = pattern && (values as Pick<Connector, 'label'>).label === pattern ? fillLabel(pattern, undefined) : (values as Pick<Connector, 'label'>).label;
  return { ...connector, ...(label !== undefined && { label }), ...(style && Object.keys(style).length > 0 && { style }), quality };
}
