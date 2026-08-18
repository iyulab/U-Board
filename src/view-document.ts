/**
 * The saved output of authoring a view: layout, bindings, and widget references, in a format
 * the renderer can read without the editor present (docs/concepts.md — "View document").
 *
 * This type is renderer-agnostic by design (docs/architecture.md — the renderer only reads the
 * document format, it never depends on the authoring tool). It does not reference the canvas
 * engine or widget library's own internal types; those are implementation details a renderer
 * translates this document into at render time.
 */
export interface ViewDocument {
  /** The authoring/rendering mode this view was created as (docs/concepts.md — "Kind"). Only
   * one kind exists today; this is an extension point, not a fixed union, so a future kind can
   * be added without widening every consumer's switch statement. */
  kind: 'canvas';
  background: Background;
  nodes: Node[];
  connectors: Connector[];
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
}

/** A positioned point in a canvas view that carries a widget. */
export interface Node {
  id: string;
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
  widget: Widget;
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
}
