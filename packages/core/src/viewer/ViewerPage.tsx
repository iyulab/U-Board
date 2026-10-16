import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { useResolvedDocument } from './useResolvedDocument.js';
import { documentExtent } from './document-extent.js';
import { useFittedView } from './use-fitted-view.js';
import { ViewControls } from './ViewControls.js';
import { toCanvasKit } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { GridBoard } from '../renderer/grid-board.js';
import type { Adapter, ResolvedWidget } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import type { ResolvedGridView, ResolvedViewDocument } from '../resolve-document.js';
import { useLabels } from '../use-labels.js';
import { TOOLBAR_STYLE, MUTED_STYLE } from '../ui-style.js';
import { AttributionLine, boardAttributions } from './attribution.js';
import { ElementHost } from '../renderer/element-view.js';
import { boardStateOf, type BoardState } from '../board-state.js';

export interface ViewerPageProps {
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
  /** The current time in epoch milliseconds — what "N minutes ago" and the time of the last update
   * are measured by. `Date.now` by default. The `observedAt` times adapters report come from the
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
  clock = Date.now,
  attribution = true,
  elementOrigins,
  elementFrames,
  onBoardState,
}: ViewerPageProps) {
  const labels = useLabels(labelsProp);
  const [drawn, setDrawn] = useState<Drawn | null>(null);

  // Read when a result is drawn, not watched: a new function on every render must not redraw the view.
  const readClock = useEffectEvent(() => clock());
  const reportState = useEffectEvent((state: BoardState) => onBoardState?.(state));
  const { resolved: received, resolvedAt, stalled } = useResolvedDocument(document, adapters, { pollIntervalMs, clock });
  // A view that is not updating cannot vouch that any value is current, so none reads as `live`.
  const resolved = useMemo(() => (received && stalled ? asLastKnown(received) : received), [received, stalled]);

  // Kept while the area stays the same, so a document replaced in place leaves the view where it is. A grid
  // view has no area to fit: it lays out to the view's width.
  const extentKey = JSON.stringify(document.kind === 'canvas' ? documentExtent(document) : null);
  const extent = useMemo(() => JSON.parse(extentKey) as ReturnType<typeof documentExtent>, [extentKey]);
  const attributions = useMemo(() => (attribution ? boardAttributions(document, adapters) : []), [document, adapters, attribution]);
  const view = useFittedView();
  const { fitTo } = view;
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
        ? { kind: 'canvas', preview: toCanvasKit(resolved, { qualityText: labels.qualityText, now, locale: labels.locale }), now }
        : { kind: 'grid', doc: resolved, now }
    );
    reportState(boardStateOf(resolved, { now }));
  }, [resolved, labels]);

  return (
    <ElementHost origins={elementOrigins} frames={elementFrames}>
      <div className="ub-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {drawn && (drawn.kind === 'canvas' || pollIntervalMs !== undefined) && (
          <div className="ub-viewer__toolbar" style={TOOLBAR_STYLE}>
            {drawn.kind === 'canvas' && <ViewControls view={view} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />}
            {pollIntervalMs !== undefined && <Freshness resolvedAt={resolvedAt} stalled={stalled} labels={labels} />}
          </div>
        )}
        {drawn ? (
          <div className="ub-viewer__surface" data-appearance={document.appearance ?? 'light'} style={{ flex: 1, minHeight: 0, ...(drawn.kind === 'grid' && { width, height }) }}>
            {drawn.kind === 'canvas' ? (
              <Viewer
                width={width}
                height={height}
                scene={drawn.preview.scene}
                overlays={drawn.preview.overlays}
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
              />
            )}
          </div>
        ) : (
          <p className="ub-viewer__status">{labels.resolving}</p>
        )}
        {drawn && <AttributionLine attributions={attributions} labels={labels} />}
      </div>
    </ElementHost>
  );
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
  return doc.kind === 'canvas' ? { ...doc, nodes: doc.nodes.map(lastKnown) } : { ...doc, items: doc.items.map(lastKnown) };
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
