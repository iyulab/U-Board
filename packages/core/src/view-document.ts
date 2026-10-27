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
  /** The states it can be in, read from one of its widget’s bindings, and how each is shown — see `StateRule`.
   *  Absent: it has no states. */
  states?: StateRule;
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
  /** The board's accent — the colour its widgets and elements fill and highlight with (a gauge's arc, a series, a
   * tank's level: the theme's primary colour), in place of the theme's own. A colour in the forms a decoration takes.
   * Absent means the theme's. */
  accent?: string;
  /** The elements this board defines, by name — see `ElementDefinition`. */
  elements?: Record<string, ElementDefinition>;
  /** Drawings its template elements share, by name — see `SymbolDefinition`. */
  symbols?: Record<string, SymbolDefinition>;
  /** What the board does when something happens on it — see `Trigger`. Absent means nothing. */
  triggers?: Trigger[];
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
  /** As a canvas view's — the board's accent colour. */
  accent?: string;
  /** As a canvas view's — the elements this board defines. */
  elements?: Record<string, ElementDefinition>;
  /** As a canvas view's — the drawings its template elements share. */
  symbols?: Record<string, SymbolDefinition>;
  /** As a canvas view's — what the board does when something happens on it. */
  triggers?: Trigger[];
}

/** What a grid view holds in a cell, and the room it takes: a widget (`GridWidgetItem`), or a canvas of its own
 *  (`GridCanvasItem`) — the spatial panel of a mixed board, with the cards around it laid out by the grid. */
export type GridItem = GridWidgetItem | GridCanvasItem;

/** The room a grid item takes. */
export interface GridLayout {
  /** Columns it spans at full width, 1–12. Absent means 4. */
  span?: number;
  /** Columns it spans at medium width, where the grid has 6 — 1–6. Absent means its share of the row it sits on at
   *  full width, so a row that fills the twelve columns fills the six (`gridSpans`). */
  spanMedium?: number;
  /** Rows it spans at medium and full width, 1–6 — a map or a large panel beside a column of smaller cards, which
   *  the items after it fill in order. Absent means 1; a narrow grid, one item per row, ignores it. */
  rowSpan?: number;
  /** Its height in pixels. Absent means the widget's own height — for a canvas, the height that keeps its proportions. */
  height?: number;
}

/** A widget in a grid view and the room it takes. */
export interface GridWidgetItem extends Placed, GridLayout {}

/** A canvas in a grid view's cell and the room it takes (docs/concepts.md — "Composition"). */
export interface GridCanvasItem extends GridLayout {
  /** Unique in the document, like every id in it. */
  id: string;
  canvas: CellCanvas;
}

/**
 * A canvas inside a grid cell: the spatial layer of a canvas view — a background, the nodes placed on it, connectors
 * between them and decorations — drawn fitted to its cell. What the board defines once stays on the board: the cell's
 * nodes place the board's elements and symbols, the board's triggers name them by id, and they take its appearance
 * and accent. A connector joins two nodes of the same cell.
 */
export interface CellCanvas {
  background: Background;
  nodes: Node[];
  connectors: Connector[];
  decorations?: Shape[];
}

/** Whether a grid item holds a canvas rather than a widget. */
export function isCanvasItem<I extends { id: string }>(item: I): item is Extract<I, { canvas: unknown }> {
  return 'canvas' in item && (item as { canvas?: unknown }).canvas !== undefined;
}

/** The number of columns a grid view has at full width and at medium width. */
export const GRID_COLUMNS = 12;
export const GRID_COLUMNS_MEDIUM = 6;
/** The span an item takes when it names none. */
export const GRID_DEFAULT_SPAN = 4;
/** The most rows an item can span. */
export const GRID_MAX_ROW_SPAN = 6;

/** Every widget a document places, in document order — a canvas view's nodes, or a grid view's widget items and the
 *  nodes of its canvas cells. The one walk over a document's widgets, so code that looks at every binding does not
 *  depend on which kind it reads. Takes a resolved document as well. */
export function placedIn<D extends PlacingView>(doc: D): readonly PlacedOf<D>[] {
  return placedAt(doc).map(({ placed }) => placed);
}

/** `placedIn`, each with the JSON Pointer of where it sits in the document (`/nodes/0`, `/items/2`,
 *  `/items/3/canvas/nodes/1`) — for what has to name the place: a binding's path, an issue's. */
export function placedAt<D extends PlacingView>(doc: D): readonly { placed: PlacedOf<D>; at: string }[] {
  if (doc.kind === 'canvas') return doc.nodes.map((node, i) => ({ placed: node as PlacedOf<D>, at: `/nodes/${i}` }));
  return doc.items.flatMap((item, i) =>
    isCanvasItem(item)
      ? (item as { canvas: { nodes: readonly { id: string }[] } }).canvas.nodes.map((node, j) => ({ placed: node as PlacedOf<D>, at: `/items/${i}/canvas/nodes/${j}` }))
      : [{ placed: item as PlacedOf<D>, at: `/items/${i}` }]
  );
}

/** A view of either kind, resolved or not — what `placedIn` walks. */
type PlacingView =
  | { kind: 'canvas'; nodes: readonly { id: string }[] }
  | { kind: 'grid'; items: readonly ({ id: string } | { id: string; canvas: { nodes: readonly { id: string }[] } })[] };

/** What a view of type `D` places: a canvas view's node type; a grid view's widget item type and its cells' node type. */
type PlacedOf<D> = D extends { kind: 'canvas'; nodes: readonly (infer N)[] }
  ? N
  : D extends { kind: 'grid'; items: readonly (infer I)[] }
    ? Exclude<I, { canvas: unknown }> | (Extract<I, { canvas: unknown }> extends { canvas: { nodes: readonly (infer N)[] } } ? N : never)
    : never;

export type BoardAppearance = 'light' | 'dark';

/** A purely visual drawing primitive placed on the canvas. Deliberately its own type rather than
 * a re-export of canvas-kit's `Shape`/`Rect`/`Text` — the renderer-agnostic principle above means
 * this document format cannot reference the canvas engine's types (a renderer translates this
 * into canvas-kit primitives at render time, `renderer/to-canvas-kit.tsx`, the same way it
 * already does for `Background`/`Connector`). Only the two variants the known use case
 * (labeled group frames) needs — extend when a real one shows up, not ahead of it. */
export type Shape = RectShape | TextShape;

/** A point of a box, read as a reader of the page reads it: `start` is the left, `end` the right. */
export type Placement = 'top-start' | 'top' | 'top-end' | 'start' | 'center' | 'end' | 'bottom-start' | 'bottom' | 'bottom-end';
export const PLACEMENTS: readonly Placement[] = ['top-start', 'top', 'top-end', 'start', 'center', 'end', 'bottom-start', 'bottom', 'bottom-end'];

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
  /** Rounds the corners — the radius in scene units, at most half the shorter side. */
  radius?: number;
  /** The stroke's line style, as a connector's. */
  dash?: StrokeDash;
  /** The frame's name, drawn inside it at `labelAt` (`top-start` when left out). */
  label?: string;
  labelAt?: Placement;
  /** The name's font size. Default 13. */
  labelSize?: number;
  /** The name's colour — the stroke's when left out (a light frame line under a darker name sets it). */
  labelFill?: string;
}

export interface TextShape {
  id: string;
  type: 'text';
  /** The point of the text's box that `anchor` names — its top-left when left out. */
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fill?: string;
  /** Which point of the text's box `x`/`y` is: `top-start` (the default), `center`, `bottom-end`, … */
  anchor?: Placement;
  /** Fills a box around the text, so it reads over whatever lies under it. */
  background?: string;
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
  /** The widget's footprint in scene units. Left out, the box takes the `size` of the element it places, else
   * 160 × 100 (`nodeSize`) — a node doesn't have to give one until an author resizes it. */
  width?: number;
  height?: number;
  /** Whether (x, y) is an anchor — a coordinate meaningful in the background's real space —
   * or a freely-placed position with no real-space meaning (docs/concepts.md — "Node", "Anchor").
   * Both cases store the same x/y shape; this flag only carries what that position means. */
  anchored: boolean;
  /** A name drawn under the node's box, outside it — a device's name under its icon. Connectors end at the box, so
   * the box can stay the size of what the widget draws while its name is as long as it needs to be. */
  caption?: string;
}

/** A line drawn between two nodes, used when the relationship between them needs to be shown — from the edge of one
 * node's box to the edge of the other's. Connectors joining the same two nodes are drawn side by side. */
export interface Connector {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  /** Text on the line, on a chip of the board's paper — a link's throughput, a pipe's flow. */
  label?: string;
  /** Where along the line the label sits, from 0 (the `fromNodeId` end) to 1 (the `toNodeId` end). Left out, it sits at
   *  the middle — connectors joining the same two nodes take turns along their line, so their labels do not stack. */
  labelAt?: number;
  /** The label's font size in scene units — its chip grows with it. Default 11; a board drawn large (a kiosk, a wall)
   *  sets it so the label reads at the size the board is seen. */
  labelSize?: number;
  /** How the line is drawn; each part left out takes the board's connector look. */
  style?: ConnectorStyle;
  /** Live values for `label`, `style.stroke`, `style.strokeWidth`, `style.dash` or `style.arrow` (`CONNECTOR_BINDABLE`) —
   * a link's throughput as its label, its load as its width, which way power flows by its sign (a value map from ranges
   * to arrows). Same shape as a widget's bindings; a binding that cannot be read leaves the static value in place. */
  bindings?: Record<string, Binding>;
}

/** The parts of a connector a binding may fill. */
export const CONNECTOR_BINDABLE = ['label', 'style.stroke', 'style.strokeWidth', 'style.dash', 'style.arrow'] as const;

export interface ConnectorStyle {
  /** A colour in the forms a decoration takes. */
  stroke?: string;
  /** Line width in scene units. */
  strokeWidth?: number;
  dash?: StrokeDash;
  /** Which ends carry an arrowhead: `end` points at the `toNodeId` node, `start` at the `fromNodeId` node. `none` when
   *  left out. */
  arrow?: ConnectorArrow;
  /** The way the line runs: `straight` (when left out) from box to box, `orthogonal` — out of the side facing the
   *  other node, one turn at the middle of the gap, into the other's facing side, as pipes and wiring are drawn — or
   *  `curved`, bowing to the left of the way it runs (from `fromNodeId` toward `toNodeId`), as flows on a map are
   *  drawn. */
  route?: ConnectorRoute;
}

export type StrokeDash = 'solid' | 'dashed' | 'dotted';
export type ConnectorArrow = 'none' | 'end' | 'start' | 'both';
export const STROKE_DASHES: readonly StrokeDash[] = ['solid', 'dashed', 'dotted'];
export const CONNECTOR_ARROWS: readonly ConnectorArrow[] = ['none', 'end', 'start', 'both'];
export type ConnectorRoute = 'straight' | 'orthogonal' | 'curved';
export const CONNECTOR_ROUTES: readonly ConnectorRoute[] = ['straight', 'orthogonal', 'curved'];

/** The visual content a node displays. A prepared widget's rendering is delegated to an external
 * widget library (docs/architecture.md) — `type` and `props` describe what that library should render
 * and are opaque to U-Board beyond that. A `type` of `element:<name>` instead names an element the
 * document defines (`elements`), which U-Board renders itself and whose `props` its definition
 * describes. `bindings` is U-Board's own layer on top: which `props` keys should be replaced with a
 * live resolved value before the widget is handed to the renderer. */
export interface Widget {
  /** Identifies which widget kind to render: a prepared widget (e.g. a specific `u-widgets` element),
   * passed through as it is, or `element:<name>` for an element of this document. */
  type: string;
  /** Static configuration for the widget, in whatever shape that widget's library expects.
   * Opaque to U-Board (docs/principles.md — backgrounds and widget content are not U-Board's to
   * interpret). Keys listed in `bindings` are overwritten with a resolved value at render time. */
  props?: Record<string, unknown>;
  bindings?: Record<string, Binding>;
}

/** What a board defines once and places by reference: `{ type: "element:<name>", props }` on any number
 * of nodes or grid items draws it with those props (docs/concepts.md — "Element"). Beyond the prepared
 * widgets, an element is how a board draws what no widget does — a plant symbol, a custom gauge.
 *
 * A `template` element is markup — HTML or SVG — with `{{prop}}` values filled in, drawn in an isolated
 * part of the page: its `style` reaches only its own markup, and nothing outside reaches in. It runs no
 * script. A `script` element runs its `script` in a sandboxed frame that cannot reach the page, its
 * viewer's session or the network; its data arrives as its props, through bindings like any widget's. */
export interface ElementDefinition {
  render: ElementRender;
  /** The props it takes, as a JSON Schema object schema — the subset `PROPS_SCHEMA_KEYWORDS` names. A
   * placed element's static props are checked against it; bound props are filled at render time. */
  props?: PropsSchema;
  /** For `render: "template"`: HTML or SVG markup with `{{name}}` values, `{{#list}}…{{/list}}` sections
   * and `{{^flag}}…{{/flag}}` inverted sections, every value escaped. No script, no event handler. */
  template?: string;
  /** For `render: "script"`: the code run in its frame. It receives its props through `ub.onProps`. */
  script?: string;
  /** CSS for its own markup only. */
  style?: string;
  /** Its own size: a canvas node placing it without a box of its own takes this box, and a grid item placing it takes
   * this height when it gives none. A node's box is still the layout — the element fills the box it is given. */
  size?: { width: number; height: number };
  /** The `https://` origins it loads anything from — a font, an image, a script library. Nothing else
   * is reachable, and an instance reaches only the origins its operator allows as well. */
  resources?: string[];
}

export type ElementRender = 'template' | 'script';

/**
 * An SVG drawing a board defines once and its template elements place by name — `<svg><use href="#valve"/></svg>` —
 * a plant's symbol set drawn the same in every element. A template element's root receives the symbols its markup
 * places (and those they place); a value may choose one: `href="#state-{{state}}"`. Its markup is held to the
 * template policy and has no values of its own.
 */
export interface SymbolDefinition {
  /** Its own coordinates, as an SVG `viewBox`: `"0 0 24 24"`. */
  viewBox?: string;
  /** SVG markup — paths, shapes, groups; colour from the theme variables (`fill: var(--u-widget-primary)`) or
   *  `currentColor`. */
  markup: string;
}

/** A JSON Schema, in the subset an element's props are described with (`PROPS_SCHEMA_KEYWORDS`). */
export interface PropsSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, PropsSchema>;
  required?: string[];
  items?: PropsSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  title?: string;
  description?: string;
  default?: unknown;
}

/** A reference from a widget to a value in an external system. U-Board reads through a binding;
 * it never stores the value it resolves to — only this reference (docs/concepts.md — "Binding"). */
export interface Binding {
  /** Identifies which adapter resolves this binding (docs/concepts.md — "Adapter"). */
  adapter: string;
  /** The adapter-specific reference to a value (e.g. an asset id and field name). Opaque to the
   * core binding surface — each adapter defines and interprets its own reference shape. */
  ref: unknown;
  /** Where the value is inside what the adapter resolved, as a JSON Pointer (`/load`) — a field of an object an adapter
   * gives for one reference. Applied first, before `map`; a value with nothing there is not shown and reads
   * `disconnected` with reason `address`. Omitted: the whole value. */
  at?: string;
  /** Translates the source's value into the one the prop takes — a data source speaks its own
   * vocabulary (`"Fault"`, `3`), a widget prop its own (a status tone). Applied to a value that is
   * shown (`live` or `stale`) before it reaches the prop. Omitted: the value is used as it comes. */
  map?: ValueMap;
  /** For a value that is a list — rows a list or a table shows — the fields each item gains, by name (an object value
   * gains them as one item does): each the value of the item's `from` field, translated by `map` when there is one. A row's state in the source's words (`"trip"`)
   * becomes the tone the widget colours the row by, beside the words themselves; a field the widget reads by another
   * name (`label`) is the source's field under that name. Applied after `map`; an item that is not an object is left as
   * it is. */
  itemFields?: Record<string, ItemField>;
  /** The value written into a text: each `{{field}}` a field of the value — the item it read, an object — in the value
   * grammar of a template element (`{{flow | fixed:1}}`, `{{.}}` the value itself). A title of words and readings —
   * `"Berth 1 · {{vessel}}"` — read from one item. Applied last, after `itemFields`, so a text can show the words a
   * field gained. A value that is not shown (`disconnected`) leaves the prop as it is. */
  text?: string;
}

/** A field each item of a list value gains: see `Binding.itemFields`. */
export interface ItemField {
  /** The item's field the value is read from: its key, or — when it starts with `/` — a JSON Pointer into the item
   * (`/properties/mag`), for a field that lives deeper in it. A field the item does not have reads as nothing. */
  from: string;
  /** Translates it, as `Binding.map` does a value. Omitted: the value as it is. */
  map?: ValueMap;
}

/** A lookup from source values to the values a prop takes, tried in order:
 * 1. `values` — a source value is looked up by its text — `"Fault"`, `"3"`, `"true"`, `"null"` — so
 *    a JSON object key can name any of them.
 * 2. `ranges` — a number (or text that reads as one, `"92.5"`) takes the first range it falls in.
 * 3. `otherwise` — or, when there is none, the value passes through unchanged, the way the raw
 *    reading would have. `V` is what it gives — anything a prop takes, or a state’s name (`StateRule`). */
export interface ValueMap<V = unknown> {
  values?: Record<string, V>;
  ranges?: ValueRange<V>[];
  otherwise?: V;
}

/** A band of numbers and the value a prop takes for it: from `min` up to but not including `max`,
 * so adjacent ranges meet without overlapping — `{ min: 70, max: 80 }` then `{ min: 80 }` reads
 * "70 or more" and "80 or more". A missing bound leaves that end open; at least one is given. */
export interface ValueRange<V = unknown> {
  min?: number;
  max?: number;
  value: V;
}

/**
 * The states a placed widget can be in — a pump’s `running`, `stopped`, `fault` — and how the board shows each.
 * The state is named from the reading of one of the widget’s own bindings (`from`, a key of `widget.bindings`): the
 * source’s value, before that binding’s `map`, looked up in `map` as a prop’s value map is (`values`, then `ranges`,
 * then `otherwise`). A reading the map names nothing for is no state — not the reading itself — and so is a binding
 * that read no value. A state is computed from the current reading alone; it remembers nothing.
 */
export interface StateRule {
  from: string;
  map: ValueMap<string>;
  /** How each state is shown, by name. A state without one is still named — in the board state, on the part for
   *  assistive technology — and drawn as usual. */
  looks?: Record<string, StateLook>;
}

/** How a part is shown while it is in a state. Separate from how it shows its connection quality (the frame’s border):
 *  a look draws around the frame, so the two never take each other’s place. */
export interface StateLook {
  /** A ring around the part in this colour — the forms a decoration colour takes, a theme colour's name (`negative`)
   *  among them. */
  outline?: string;
  /** The ring (or the part, without one) blinks — for a state that asks for attention. Not where a reader asks for
   *  reduced motion. Needs the default stylesheet; without it the part does not blink. */
  blink?: boolean;
  /** The part is not drawn while in this state. Connectors to it still are. */
  hidden?: boolean;
}

/** What a trigger reacts to (`Trigger.on`). */
export const TRIGGER_EVENTS = ['click', 'element', 'enter', 'leave', 'open'] as const;

/** What a trigger does (`Trigger.do`). */
export const TRIGGER_ACTIONS = ['open-link', 'focus', 'emit', 'go-to-board'] as const;

/** Something that happens on a board: a part clicked (or activated from the keyboard), an event an element raises, a
 *  part entering or leaving one of its states, the board opened in a viewer. `node` names a canvas node or a grid item. */
export type TriggerEvent =
  | { event: 'click'; node: string }
  | { event: 'element'; node: string; name: string }
  | { event: 'enter' | 'leave'; node: string; state: string }
  | { event: 'open' };

/** What a trigger does. `open-link` opens `url` in a new tab — an `https://` address, or a path on the installation
 *  the board is served from; `{{node}}`, `{{state}}` and `{{board}}` in it are filled in. `focus` brings a part into
 *  view. `emit` hands the host page an event of that name. `go-to-board` asks the host to show another board of the
 *  same workspace. */
export type TriggerAction =
  | { action: 'open-link'; url: string }
  | { action: 'focus'; node: string }
  | { action: 'emit'; name: string }
  | { action: 'go-to-board'; board: string };

/**
 * What a board does when something happens on it: `on` an event, only `when` a part is in one of the given states (if
 * given), `do` the actions in order. A viewer runs triggers; an editor does not. Triggers only show, move and tell —
 * nothing a trigger does writes to the systems the board reads.
 */
export interface Trigger {
  on: TriggerEvent;
  when?: { node: string; state: string | string[] };
  do: TriggerAction[];
}

/** Whether `url` is a link a trigger may open: an `https://` address, or a path on this installation (`/…` — not
 *  `//…` or `/\…`, which a browser reads as another host). */
export function isTriggerLink(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/')) return url[1] !== '/' && url[1] !== '\\';
  if (!url.startsWith('https://')) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
