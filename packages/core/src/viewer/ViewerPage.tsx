import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { useResolvedDocument } from './useResolvedDocument.js';
import { documentExtent } from './document-extent.js';
import { useFittedView } from './use-fitted-view.js';
import { ViewControls } from './ViewControls.js';
import { toCanvasKit } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { GridBoard } from '../renderer/grid-board.js';
import type { Adapter, ResolvedWidget } from '../adapter.js';
import { isCanvasItem, type ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import type { ResolvedGridView, ResolvedViewDocument } from '../resolve-document.js';
import { useLabels } from '../use-labels.js';
import { TOOLBAR_STYLE, MUTED_STYLE } from '../ui-style.js';
import { isSkinColor } from '../css-color.js';
import { AttributionLine, boardAttributions, showsExampleData } from './attribution.js';
import { ElementHost } from '../renderer/element-view.js';
import { boardStateOf, type BoardState } from '../board-state.js';
import type { BoardInput, PartInput } from '../board-input.js';
import { focusPart, useTriggers, type BoardEvent } from './use-triggers.js';

export interface ViewerPageProps {
  /** Where the values come from. The page reads again when this is another array (by identity) and not when it is the same one — so a host
   *  that carries a value it chose to the source (a point in time, a site) makes an adapter bound to that value and passes a new array when
   *  the choice changes. Keep the array while nothing changed: a new one on every render reads on every render. */
  adapters: readonly Adapter[];
  /** Viewport size in CSS px. Omit either to have the view follow its container along that axis —
   * `ViewerPage` then fills its parent, so give the parent a definite size. */
  width?: number;
  height?: number;
  /** The document to show. A different document given later replaces it — a board saved again while
   * it is open — keeping the user's pan and zoom unless the new one covers a different area. Pass the
   * same object until the document changes: each new one is resolved again. A canvas view opens fitted
   * and pans and zooms; a grid view lays out to the view's width and scrolls. */
  document: ViewDocument;
  /** Re-resolve the bindings every this many milliseconds, so values and connection quality stay
   * current. Omitted, bindings resolve once when the document opens. */
  pollIntervalMs?: number;
  /** Accessible name of the board view — e.g. the board's name. The view is focusable: arrow keys
   * pan, `+`/`-` zoom. Default `labels.boardRegion` ("Board"). */
  ariaLabel?: string;
  /** Text to show instead of the English defaults — any subset of `UBoardLabels`. */
  labels?: Partial<UBoardLabels>;
  /** Leave out of the page the parts of a canvas that lie well outside the view (they are drawn again when the view
   * nears them), so a board with thousands of parts stays smooth to pan, zoom and update. A number: left out once the
   * board has more parts than that; `true`: always; `false`: never. Default `500` — a smaller board is whole in the
   * page, as a screen reader and the Tab key meet it; a larger one is met as far as the view has reached. A part that
   * holds a state of its own (a script element's frame) is never left out. */
  cullParts?: boolean | number;
  /** Draw the markers of a canvas as points on the canvas instead of as parts of the page once too many are in the view —
   * a page of thousands of parts pans and zooms slowly however light each one is. A number: turned on when more than that
   * many markers are in the view (and turned off again below 0.8 × that, so a view at the edge does not flicker); `true`:
   * always; `false`: never. Default `500`. While markers are points they take no click, hover or focus, and a screen
   * reader is told so (`labels.partsSummarized`) — zoom in until fewer are in the view and they are parts again. A part
   * that is not a marker is never drawn as a point. */
  summarizeParts?: boolean | number;
  /** The current time in epoch milliseconds — what "N minutes ago", the time of the last update and
   * a state read against the clock (a session «now» or «next») are measured by. `Date.now` by default. The `observedAt` times adapters report come from the
   * source's side; when this machine's clock may be off from that one (an unattended screen whose
   * clock has drifted), pass a clock corrected to the source's — see `serverClock`. */
  clock?: () => number;
  /** Name where the board's data comes from — each bound adapter's `attribution` — under the board.
   * Default `true`. Turn it off only to show it yourself: a source's license often requires it. */
  attribution?: boolean;
  /** The origins an element of the board may load from — a font, an image, a script library — when it also lists them
   * in its `resources`. Default none: a board loads nothing from another origin unless its host allows it here. */
  elementOrigins?: readonly string[];
  /** Where the board's script elements run: the address its server serves their frames under —
   * `/api/element-frames/<board id>` on a U-Board server, or the address its board answer gives (`elementFrames`) when
   * it serves each definition from an origin of its own (`{definition}` in it names that origin). Omitted, a script
   * element shows a notice in its box. */
  elementFrames?: string;
  /** Called with the board’s state each time new values are drawn — what each part shows: its state, its connection
   *  quality and why, how old its data is (`BoardState`, no values). A board that has stopped updating reports its
   *  parts `stale`. For a host that acts on what the board shows — a count of faults in its own header, a sound. */
  onBoardState?: (state: BoardState) => void;
  /** Called when a person types into an input widget of the picture or confirms on it (a `form`, a `confirm`) — the part and the values, as
   * `BoardInput` says. The viewer tells and writes nothing: whether to ask for a confirmation, where the values go and who may send them is
   * the host's, under its own rules. Left out, an input widget shows but its values go nowhere. A board's own kinds offer no input widget yet,
   * so this is for a picture a host draws itself. */
  onInput?: (input: BoardInput) => void;
  /** The board's id — what `{{board}}` in a trigger's link becomes, and what the events it hands the host name. */
  boardId?: string;
  /** Called when one of the board's triggers emits an event (`emit`): its name, and the part and state it came from —
   *  never a value. A host page acts on it: opens its own panel, plays a sound, logs it. */
  onTrigger?: (event: BoardEvent) => void;
  /** Called when a trigger asks to show another board of the same workspace (`go-to-board`). Without it, nothing
   *  happens — the viewer does not go anywhere on its own. */
  onNavigate?: (target: { board: string }) => void;
  /** The origins a trigger's link may open (`open-link`), besides paths on this installation. Left out: any `https`
   *  address. */
  linkOrigins?: readonly string[];
}

/** What is on screen: a canvas view as canvas-kit draws it, or a grid view as it lays out — with the time its
 *  values' ages are measured to. */
type Drawn = { kind: 'canvas'; preview: CanvasKitRenderOutput; now: number } | { kind: 'grid'; doc: ResolvedGridView; now: number };

/**
 * A read-only view of a ViewDocument — no `KonvaDesigner`, no editing controls. A canvas view opens
 * with the whole document fitted into view (shrunk to fit, never magnified) and keeps it fitted as
 * the view resizes until the user pans or zooms; "Fit to view" brings that back. Refreshed binding
 * values (polling) leave the user's pan/zoom alone. This
 * module never imports `@canvas-kit/designer` at all, so it stays what a real standalone viewer
 * deployment would ship with (docs/principles.md — editor/renderer separation): the authoring
 * tool's weight can never leak in here, because it isn't a dependency of this file.
 */
export function ViewerPage({
  adapters,
  width,
  height,
  document,
  pollIntervalMs,
  ariaLabel,
  labels: labelsProp,
  cullParts,
  summarizeParts,
  clock = Date.now,
  attribution = true,
  elementOrigins,
  elementFrames,
  onBoardState,
  onInput,
  boardId,
  onTrigger,
  onNavigate,
  linkOrigins,
}: ViewerPageProps) {
  const labels = useLabels(labelsProp);
  const [drawn, setDrawn] = useState<Drawn | null>(null);

  // Read when a result is drawn, not watched: a new function on every render must not redraw the view.
  const readClock = useEffectEvent(() => clock());
  const reportState = useEffectEvent((state: BoardState) => onBoardState?.(state));
  // The host's `onInput`, kept current without redrawing the board when the host passes a new function; none when it passes none,
  // so a part shows no listener for what nobody hears.
  const inputRef = useRef(onInput);
  useEffect(() => {
    inputRef.current = onInput;
  });
  const hearsInput = onInput !== undefined;
  const tellInput = useMemo(
    () => (hearsInput ? (part: string, input: PartInput) => inputRef.current?.({ ...input, part } as BoardInput) : undefined),
    [hearsInput]
  );
  const { resolved: received, resolvedAt, stalled } = useResolvedDocument(document, adapters, { pollIntervalMs, clock });
  // A view that is not updating cannot vouch that any value is current, so none reads as `live`.
  const resolved = useMemo(() => (received && stalled ? asLastKnown(received) : received), [received, stalled]);

  // Kept while the area stays the same, so a document replaced in place leaves the view where it is. A grid
  // view has no area to fit: it lays out to the view's width.
  const extentKey = JSON.stringify(document.kind === 'canvas' ? documentExtent(document) : null);
  const extent = useMemo(() => JSON.parse(extentKey) as ReturnType<typeof documentExtent>, [extentKey]);
  const attributions = useMemo(() => (attribution ? boardAttributions(document, adapters) : []), [document, adapters, attribution]);
  // Example data is said whatever the host shows itself: it is not a credit but what the figures are.
  const example = useMemo(() => showsExampleData(document, adapters), [document, adapters]);
  const view = useFittedView();
  const { fitTo, focusOn } = view;
  const surface = useRef<HTMLDivElement>(null);
  // A part a trigger points at: on a canvas, its box brought into view; in a grid, its cell scrolled into view.
  // A grid's cells exist a draw after its document is resolved, so a part pointed at as the board is first drawn is kept
  // until they do.
  const pendingFocus = useRef<string | null>(null);
  const focus = useCallback((node: string) => {
    if (resolved?.kind === 'grid' && !surface.current) pendingFocus.current = node;
    else focusPart(resolved, node, focusOn, surface.current);
  }, [resolved, focusOn]);
  const triggers = useTriggers(document, resolved, { boardId, onTrigger, onNavigate, linkOrigins, focus });
  const { activatable, activate, elementEvent } = triggers;
  // Fit whenever a document covering a new area is shown — not on a preview refresh, which is only
  // new values for the same document, nor on a document replaced within the same area.
  useEffect(() => {
    fitTo(extent);
  }, [fitTo, extent]);

  useEffect(() => {
    if (!resolved) {
      setDrawn(null);
      return;
    }
    const now = readClock();
    setDrawn(
      resolved.kind === 'canvas'
        ? { kind: 'canvas', preview: toCanvasKit(resolved, { qualityText: labels.qualityText, now, locale: labels.locale, activatable, onNodeActivate: activate, onElementEvent: elementEvent, onInput: tellInput }), now }
        : { kind: 'grid', doc: resolved, now }
    );
    reportState(boardStateOf(resolved, { now }));
  }, [resolved, labels, activatable, activate, elementEvent, tellInput]);

  useEffect(() => {
    const node = pendingFocus.current;
    if (node === null || drawn?.kind !== 'grid') return;
    pendingFocus.current = null;
    focusPart(drawn.doc, node, focusOn, surface.current);
  }, [drawn, focusOn]);

  return (
    <ElementHost origins={elementOrigins} frames={elementFrames}>
      <div className="ub-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {drawn && (drawn.kind === 'canvas' || pollIntervalMs !== undefined) && (
          <div className="ub-viewer__toolbar" style={TOOLBAR_STYLE}>
            {drawn.kind === 'canvas' && <ViewControls view={view} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />}
            {drawn.kind === 'canvas' && drawn.preview.backgroundBlocked && <span role="status" style={NOT_UPDATING_STYLE}>{labels.backgroundBlocked}</span>}
            {pollIntervalMs !== undefined && <Freshness resolvedAt={resolvedAt} stalled={stalled} labels={labels} />}
          </div>
        )}
        {drawn ? (
          <div ref={surface} className="ub-viewer__surface" data-appearance={document.appearance ?? 'light'} style={{ flex: 1, minHeight: 0, ...(isSkinColor(document.skin?.palette?.backdrop) && { background: document.skin.palette.backdrop }), ...(drawn.kind === 'grid' && { width, height }) }}>
            {drawn.kind === 'canvas' ? (
              <Viewer
                width={width}
                height={height}
                scene={drawn.preview.scene}
                overlays={drawn.preview.overlays}
                cullOverlays={cullsParts(drawn.preview.overlays.length, cullParts)}
                summarizeOverlays={summarizesParts(summarizeParts)}
                summaryLabel={count => labels.partsSummarized.replace('{count}', String(count))}
                transform={view.transform}
                onTransformChange={view.onUserTransform}
                onViewportResize={view.onViewportResize}
                ariaLabel={ariaLabel ?? labels.boardRegion}
              />
            ) : (
              <GridBoard
                doc={drawn.doc}
                ariaLabel={ariaLabel ?? labels.boardRegion}
                qualityText={labels.qualityText}
                now={drawn.now}
                locale={labels.locale}
                labels={labels}
                activatable={activatable}
                onItemActivate={activate}
                onElementEvent={elementEvent}
                onInput={tellInput}
              />
            )}
          </div>
        ) : (
          <p className="ub-viewer__status">{labels.resolving}</p>
        )}
        {drawn && <AttributionLine attributions={attributions} example={example} labels={labels} />}
      </div>
    </ElementHost>
  );
}

/** A board has more parts than this before its parts outside the view are left out (`cullParts`). */
export const CULL_PARTS_ABOVE = 500;

/** Whether a board of `count` parts leaves out those outside the view, as `cullParts` says. */
export function cullsParts(count: number, cullParts: boolean | number | undefined): boolean {
  if (cullParts === undefined) return count > CULL_PARTS_ABOVE;
  if (typeof cullParts === 'number') return count > cullParts;
  return cullParts;
}

/** A canvas turns its markers into points once more than this many are in the view (`summarizeParts`). */
export const SUMMARIZE_PARTS_ABOVE = 500;

/** What `summarizeParts` asks of the viewer: when to turn the markers into points. */
export function summarizesParts(summarizeParts: boolean | number | undefined): false | { above: number } {
  if (summarizeParts === false) return false;
  if (summarizeParts === true) return { above: 0 };
  return { above: typeof summarizeParts === 'number' ? summarizeParts : SUMMARIZE_PARTS_ABOVE };
}

/** A resolved document with every `live` binding read as `stale` — the values stay, their observation
 * times stay, only the claim that they are current goes. */
function asLastKnown(doc: ResolvedViewDocument): ResolvedViewDocument {
  const lastKnown = <T extends { widget: ResolvedWidget }>(placed: T): T => ({
    ...placed,
    widget: {
      ...placed.widget,
      quality: Object.fromEntries(
        Object.entries(placed.widget.quality).map(([path, quality]) => [path, quality === 'live' ? 'stale' : quality])
      ),
    },
  });
  if (doc.kind === 'canvas') return { ...doc, nodes: doc.nodes.map(lastKnown) };
  return { ...doc, items: doc.items.map(item => (isCanvasItem(item) ? { ...item, canvas: { ...item.canvas, nodes: item.canvas.nodes.map(lastKnown) } } : lastKnown(item))) };
}

/** When the values on screen were last updated, and — distinctly, announced — when they have stopped
 * being updated (NUREG-0700 §14.1-4: show that the display is working; §2.5.4-6: label a frozen one).
 * A time of day rather than an age, so the line itself never goes out of date. The announcing region
 * is always there and only its text changes: one inserted with its text already in it is not read
 * out by many screen readers. */
/** A board that has stopped updating says so in the warning colors — with or without the stylesheet. */
const NOT_UPDATING_STYLE: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--_ub-warning-bg, var(--ub-warning-bg, #fef3c7))',
  color: 'var(--_ub-warning, var(--ub-warning, #92400e))',
  fontWeight: 600,
};

function Freshness({ resolvedAt, stalled, labels }: { resolvedAt: number | null; stalled: boolean; labels: UBoardLabels }) {
  const time = resolvedAt === null ? null : labels.time(resolvedAt);
  const notUpdating = stalled && time !== null;
  return (
    <span className="ub-freshness" style={{ marginLeft: 'auto' }}>
      <span role="status" className={notUpdating ? 'ub-freshness__alert' : undefined} style={notUpdating ? NOT_UPDATING_STYLE : undefined}>
        {notUpdating ? labels.notUpdating.replace('{time}', time) : ''}
      </span>
      {!notUpdating && time !== null && (
        <span className="ub-freshness__time" style={MUTED_STYLE}>
          {labels.lastUpdated.replace('{time}', time)}
        </span>
      )}
    </span>
  );
}
