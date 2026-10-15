/**
 * The saved output of authoring a view: layout, bindings, and widget references, in a format
 * the renderer can read without the editor present (docs/concepts.md — "View document").
 *
 * This type is renderer-agnostic by design (docs/architecture.md — the renderer only reads the
 * document format, it never depends on the authoring tool). It does not reference the canvas
 * engine or widget library's own internal types; those are implementation details a renderer
 * translates this document into at render time.
 *
 * A view has a kind (docs/concepts.md — "Kind"), told apart by `kind`: a canvas places widgets on
 * a background by position, a grid lays them out in order. Both carry widgets the same way — a
 * `Placed` — and only how they are placed differs. Narrow on `kind` before reading a kind's fields.
 */
export type ViewDocument = CanvasView | GridView;

/** The kinds a view can be — `ViewDocument['kind']`. */
export type ViewKind = ViewDocument['kind'];

/** A widget with an identity, the unit every kind places. The id is unique in its document. */
export interface Placed {
  id: string;
  widget: Widget;
}

/** A canvas view: widgets placed by position over a background, optionally joined by connectors. */
export interface CanvasView {
  kind: 'canvas';
  background: Background;
  nodes: Node[];
  connectors: Connector[];
  /** Purely visual structure — a labeled frame/group border expressing hierarchy among nodes,
   * with no widget and no binding (docs/concepts.md — "Decoration"). Absent/omitted means none;
   * older saved documents predate this field. Domain-neutral like `Background`: U-Board does not
   * interpret what a decoration's border or label groups. */
  decorations?: Shape[];
  /** How the board itself looks — its paper and the widgets on it. `light` (the default; absent means
   * it) for a light drawing or none; `dark` for a dark one, where the widgets take their dark palette
   * so their text reads on it. Like `Background`, it says the background's tone, not what it depicts. */
  appearance?: BoardAppearance;
}

/** A grid view: widgets laid out in order, in rows of `columns` columns — no position, so the same
 *  document reads at any width (docs/concepts.md — "Grid view"). */
export interface GridView {
  kind: 'grid';
  /** In the order they are shown: left to right, then top to bottom. */
  items: GridItem[];
  /** Columns at full width. Only 12 for now; absent means 12. */
  columns?: 12;
  /** As a canvas view's — the tone the board is drawn in. */
  appearance?: BoardAppearance;
}

/** A widget in a grid view and the room it takes. */
export interface GridItem extends Placed {
  /** Columns it spans at full width, 1–12. Absent means 4. */
  span?: number;
  /** Columns it spans at medium width, where the grid has 6 — 1–6. Absent means half of `span`, rounded up. */
  spanMedium?: number;
  /** Its height in pixels. Absent means the widget's own height. */
  height?: number;
}

/** The number of columns a grid view has at full width and at medium width. */
export const GRID_COLUMNS = 12;
export const GRID_COLUMNS_MEDIUM = 6;
/** The span an item takes when it names none. */
export const GRID_DEFAULT_SPAN = 4;

/** A document of `kind` with nothing on it yet — what a new board starts as. */
export function emptyViewDocument(kind: ViewKind): ViewDocument {
  return kind === 'grid' ? { kind: 'grid', items: [] } : { kind: 'canvas', background: {}, nodes: [], connectors: [] };
}

/** Every widget a document places, in document order — a canvas view's nodes or a grid view's items. The one walk
 *  over a document's widgets, so code that looks at every binding does not depend on which kind it reads. Takes a
 *  resolved document as well. */
export function placedIn<D extends PlacingView>(doc: D): readonly PlacedOf<D>[] {
  return (doc.kind === 'canvas' ? doc.nodes : doc.items) as readonly PlacedOf<D>[];
}

/** A view of either kind, resolved or not — what `placedIn` walks. */
type PlacingView = { kind: 'canvas'; nodes: readonly { id: string }[] } | { kind: 'grid'; items: readonly { id: string }[] };

/** What a view of type `D` places: a canvas view's node type, a grid view's item type. */
type PlacedOf<D> = D extends { kind: 'canvas'; nodes: readonly (infer N)[] } ? N : D extends { kind: 'grid'; items: readonly (infer I)[] } ? I : never;

export type BoardAppearance = 'light' | 'dark';

/** A purely visual drawing primitive placed on the canvas. Deliberately its own type rather than
 * a re-export of canvas-kit's `Shape`/`Rect`/`Text` — the renderer-agnostic principle above means
 * this document format cannot reference the canvas engine's types (a renderer translates this
 * into canvas-kit primitives at render time, `renderer/to-canvas-kit.tsx`, the same way it
 * already does for `Background`/`Connector`). Only the two variants the known use case
 * (labeled group frames) needs — extend when a real one shows up, not ahead of it. */
export type Shape = RectShape | TextShape;

export interface RectShape {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextShape {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fill?: string;
}

/** The media a canvas view is drawn over. The system attaches no domain meaning to it — what it
 * depicts (a floor plan, a map) is left to the author's and viewer's interpretation. */
export interface Background {
  /** Absent means no background. */
  image?: BackgroundImage;
}

export interface BackgroundImage {
  src: string;
  width: number;
  height: number;
  /** Two points of the image and the coordinates they stand for in the space it depicts — a floor plan's
   *  metres, a map's longitude and latitude. They make an anchored node's place a coordinate
   *  (`coordinateOf`, `placeAt`). Each axis maps linearly between the two points, so the image must already
   *  be drawn in the projection its coordinates are read in; the two points differ on both axes, in the
   *  image and in their coordinates. Absent: the image's coordinates are its own. */
  referencePoints?: [ReferencePoint, ReferencePoint];
}

/** A point of a background image (`x`/`y` in scene units, as a node's) and the coordinate it stands for. */
export interface ReferencePoint {
  x: number;
  y: number;
  coordinate: { x: number; y: number };
}

/** A positioned point in a canvas view that carries a widget. */
export interface Node extends Placed {
  x: number;
  y: number;
  /** The widget's footprint in scene units. Absent means the renderer picks a default size —
   * a node doesn't have to specify one until an author actually resizes it. */
  width?: number;
  height?: number;
  /** Whether (x, y) is an anchor — a coordinate meaningful in the background's real space —
   * or a freely-placed position with no real-space meaning (docs/concepts.md — "Node", "Anchor").
   * Both cases store the same x/y shape; this flag only carries what that position means. */
  anchored: boolean;
}

/** A line drawn between two nodes, used when the relationship between them needs to be shown. */
export interface Connector {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

/** The visual content a node displays. Rendering is delegated to an external widget library
 * (docs/architecture.md) — `type` and `props` describe what that library should render and are
 * opaque to U-Board beyond that. `bindings` is U-Board's own layer on top: which `props` keys
 * should be replaced with a live resolved value before the widget is handed to the renderer. */
export interface Widget {
  /** Identifies which widget kind to render (e.g. a specific `u-widgets` element). Opaque to
   * U-Board — it does not interpret this string beyond passing it through. */
  type: string;
  /** Static configuration for the widget, in whatever shape that widget's library expects.
   * Opaque to U-Board (docs/principles.md — backgrounds and widget content are not U-Board's to
   * interpret). Keys listed in `bindings` are overwritten with a resolved value at render time. */
  props?: Record<string, unknown>;
  bindings?: Record<string, Binding>;
}

/** A reference from a widget to a value in an external system. U-Board reads through a binding;
 * it never stores the value it resolves to — only this reference (docs/concepts.md — "Binding"). */
export interface Binding {
  /** Identifies which adapter resolves this binding (docs/concepts.md — "Adapter"). */
  adapter: string;
  /** The adapter-specific reference to a value (e.g. an asset id and field name). Opaque to the
   * core binding surface — each adapter defines and interprets its own reference shape. */
  ref: unknown;
  /** Translates the source's value into the one the prop takes — a data source speaks its own
   * vocabulary (`"Fault"`, `3`), a widget prop its own (a status level). Applied to a value that is
   * shown (`live` or `stale`) before it reaches the prop. Omitted: the value is used as it comes. */
  map?: ValueMap;
}

/** A lookup from source values to the values a prop takes, tried in order:
 * 1. `values` — a source value is looked up by its text — `"Fault"`, `"3"`, `"true"`, `"null"` — so
 *    a JSON object key can name any of them.
 * 2. `ranges` — a number (or text that reads as one, `"92.5"`) takes the first range it falls in.
 * 3. `otherwise` — or, when there is none, the value passes through unchanged, the way the raw
 *    reading would have. */
export interface ValueMap {
  values?: Record<string, unknown>;
  ranges?: ValueRange[];
  otherwise?: unknown;
}

/** A band of numbers and the value a prop takes for it: from `min` up to but not including `max`,
 * so adjacent ranges meet without overlapping — `{ min: 70, max: 80 }` then `{ min: 80 }` reads
 * "70 or more" and "80 or more". A missing bound leaves that end open; at least one is given. */
export interface ValueRange {
  min?: number;
  max?: number;
  value: unknown;
}
