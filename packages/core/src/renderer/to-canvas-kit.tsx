import { Scene } from '@canvas-kit/core';
import type { ViewerOverlayItem } from '@canvas-kit/viewer';
import '@iyulab/u-widgets';
// The chart entry (`@iyulab/u-widgets/charts`) is not loaded here: `NodeFrame` and the viewer load it when a board
// names a `chart.*` widget (`chart-entry.ts`), so a board without a chart does not fetch the chart engine.
import type { ResolvedCanvasView } from '../resolve-document.js';
import { sizedNodes } from '../node-size.js';
import { DEFAULT_QUALITY_TEXT, type QualityText } from '../quality-text.js';
import { mayLoadBackground } from './background-media.js';
import { skinBackground } from './background-skin.js';
import { decorationObjects } from './decoration-drawing.js';
import { NodeFrame } from './node-frame.js';
import { captionObjects, connectorObjects, placeOnCanvas } from './connector-drawing.js';
import { connectorMark } from './connector-mark.js';
import { boardTheme } from './element-template.js';
import { markerSummary } from './marker-summary.js';
import { frameBinding, frameQuality } from '../quality-presentation.js';
import { elementListeners } from '../triggers.js';
import { elementNameOf } from '../elements/element-type.js';
import type { PartInput } from '../board-input.js';

/** Widgets sit on the board — its background drawing, or the board's paper — not on the page around
 * it, so they take the board's palette (`appearance`, light by default) whatever the system or page
 * theme. A dark page still gets dark controls around a light board; the board reads like a drawing. */

export interface CanvasKitRenderOutput {
  scene: Scene;
  overlays: ViewerOverlayItem[];
  /** The board's background picture was left out: its address is outside the origins the host allowed
   * (`setMediaOrigins`). The board is drawn on an empty background. */
  backgroundBlocked?: boolean;
}

export interface ToCanvasKitOptions {
  /** Words for each node's connection-quality tooltip and announcement (English by default). */
  qualityText?: QualityText;
  /** The time a stale value's age is measured to, in epoch milliseconds — `Date.now()` by default. */
  now?: number;
  /** The language the widgets speak (BCP 47) — the labels' `locale`. Left out, a widget follows the page's. */
  locale?: string;
  /** The nodes a click does something on (`Triggers.activatable`), and what it does. */
  activatable?: ReadonlySet<string>;
  onNodeActivate?: (node: string) => void;
  /** An event a node's element raised. */
  onElementEvent?: (node: string, name: string) => void;
  /** What a person typed into a node's part, or confirmed on it. */
  onInput?: (node: string, input: PartInput) => void;
}

/** A node's summary for the viewer's `summarizeOverlays` — a marker's; none for another part, which stays page content. */
function summaryOf(node: ResolvedCanvasView['nodes'][number], theme: Readonly<Record<string, string>>): Pick<ViewerOverlayItem, 'summary'> {
  const key = frameBinding(node.widget.quality, node.widget.type);
  const summary = markerSummary(
    node.widget,
    theme,
    node.state !== undefined ? node.states?.looks?.[node.state] : undefined,
    frameQuality(node.widget.quality, node.widget.type),
    key === undefined ? undefined : node.widget.reasons?.[key]
  );
  return summary ? { summary } : {};
}

/** Whether a node's widget is a script element — a frame that keeps its own state. */
function holdsState(type: string, elements: ResolvedCanvasView['elements']): boolean {
  const name = elementNameOf(type);
  return name !== undefined && elements?.[name]?.render === 'script';
}

/**
 * Translates a resolved View Document into canvas-kit primitives: a Scene holding the
 * background and connectors, and an overlay list for the Viewer to position in scene coordinates —
 * each node's widget, then each connector's display-only mark (`connectorMark`). This is the renderer half of the editor/renderer separation
 * (docs/principles.md) — it depends on canvas-kit and u-widgets so the document format itself
 * doesn't have to.
 */
export function toCanvasKit(doc: ResolvedCanvasView, { qualityText = DEFAULT_QUALITY_TEXT, now, locale, activatable, onNodeActivate, onElementEvent, onInput }: ToCanvasKitOptions = {}): CanvasKitRenderOutput {
  const scene = new Scene();
  const nodes = sizedNodes(doc);

  const backgroundBlocked = !!doc.background.image && !mayLoadBackground(doc.background.image.src);
  if (doc.background.image && !backgroundBlocked) {
    scene.add({
      type: 'image',
      x: 0,
      y: 0,
      width: doc.background.image.width,
      height: doc.background.image.height,
      src: skinBackground(doc.background.image.src, doc.skin),
    });
  }

  for (const shape of doc.decorations ?? []) {
    for (const object of decorationObjects(shape, doc.appearance, doc.accent)) scene.add(object);
  }

  for (const object of connectorObjects(nodes, doc.connectors, doc.appearance, {}, doc.accent)) scene.add(object);
  for (const object of captionObjects(nodes, doc.appearance)) scene.add(object);

  const at = now ?? Date.now();
  const theme = boardTheme(doc.appearance ?? 'light', doc.accent, doc.skin);
  const listened = onElementEvent ? elementListeners(doc.triggers) : undefined;
  const overlays: ViewerOverlayItem[] = nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    // A script element holds a frame with state of its own: it is not torn down when the view moves away from it.
    ...(holdsState(node.widget.type, doc.elements) && { cull: false }),
    // What it is drawn as, once too many are in view to keep each as page content (`summarizeParts`): a marker's point.
    ...summaryOf(node, theme),
    // A widget takes its node's box exactly — the box the author drew is the layout.
    content: <NodeFrame widget={node.widget} appearance={doc.appearance} accent={doc.accent} skin={doc.skin} symbols={doc.symbols} qualityText={qualityText} now={at} locale={locale} elements={doc.elements} nodeId={node.id} state={node.state} looks={node.states?.looks} highlighted={node.highlighted} dimmed={node.dimmed} onActivate={onNodeActivate && activatable?.has(node.id) ? () => onNodeActivate(node.id) : undefined} onElementEvent={onElementEvent && (name => onElementEvent(node.id, name))} onInput={onInput && (input => onInput(node.id, input))} elementEvents={listened?.get(node.id)} name={node.caption} />,
  }));
  for (const placed of placeOnCanvas(nodes, doc.connectors)) overlays.push(connectorMark(placed, qualityText, at));

  return { scene, overlays, ...(backgroundBlocked && { backgroundBlocked }) };
}
