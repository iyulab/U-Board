import { useEffect, useMemo, useRef, useState } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { useResolvedDocument } from './useResolvedDocument.js';
import { documentExtent } from './document-extent.js';
import { useFittedView } from './use-fitted-view.js';
import { ViewControls } from './ViewControls.js';
import { toCanvasKit, chartsReady } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import type { ResolvedViewDocument } from '../resolve-document.js';
import { useLabels } from '../use-labels.js';

export interface ViewerPageProps {
  adapters: readonly Adapter[];
  /** Viewport size in CSS px. Omit either to have the view follow its container along that axis —
   * `ViewerPage` then fills its parent, so give the parent a definite size. */
  width?: number;
  height?: number;
  /** The document to show. Given, it renders at once with no import control (the embed case);
   * omitted, the page offers an Import button that opens a local document file. */
  initialDocument?: ViewDocument;
  /** Re-resolve the bindings every this many milliseconds, so values and connection quality stay
   * current. Omitted, bindings resolve once when the document opens. */
  pollIntervalMs?: number;
  /** Accessible name of the board view — e.g. the board's name. The view is focusable: arrow keys
   * pan, `+`/`-` zoom. Default `labels.boardRegion` ("Board"). */
  ariaLabel?: string;
  /** Text to show instead of the English defaults — any subset of `UBoardLabels`. */
  labels?: Partial<UBoardLabels>;
}

/**
 * A read-only view of an imported ViewDocument — no `KonvaDesigner`, no editing controls. It opens
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
  initialDocument,
  pollIntervalMs,
  ariaLabel,
  labels: labelsProp,
}: ViewerPageProps) {
  const labels = useLabels(labelsProp);
  const [doc, setDoc] = useState<ViewDocument | null>(initialDocument ?? null);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { resolved: received, resolvedAt, stalled } = useResolvedDocument(doc, adapters, { pollIntervalMs });
  // A view that is not updating cannot vouch that any value is current, so none reads as `live`.
  const resolved = useMemo(() => (received && stalled ? asLastKnown(received) : received), [received, stalled]);

  const extent = useMemo(() => (doc ? documentExtent(doc) : null), [doc]);
  const view = useFittedView();
  const { fitTo } = view;
  // Fit whenever a document is loaded — not on a preview refresh, which is only new values for the
  // same document.
  useEffect(() => {
    fitTo(extent);
  }, [fitTo, extent]);
  const viewerShown = preview !== null;

  useEffect(() => {
    if (!resolved) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreview(toCanvasKit(resolved, { qualityText: labels.qualityText }));
    // chart.* renders through the dynamically-loaded @iyulab/u-widgets/charts subpath (see
    // to-canvas-kit.tsx) — a node mounted before that resolves needs one more render pass to
    // pick it up.
    chartsReady.then(() => {
      if (!cancelled) setPreview(toCanvasKit(resolved, { qualityText: labels.qualityText }));
    });
    return () => {
      cancelled = true;
    };
  }, [resolved, labels]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      setDoc(parseViewDocument(await file.text()));
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof InvalidViewDocumentError ? err.message : labels.importFailed);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(!initialDocument || viewerShown) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {!initialDocument && (
            <>
              <button onClick={handleImportClick}>{labels.import}</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </>
          )}
          {viewerShown && <ViewControls view={view} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />}
          {viewerShown && pollIntervalMs !== undefined && <Freshness resolvedAt={resolvedAt} stalled={stalled} labels={labels} />}
        </div>
      )}
      {importError && <p style={{ color: '#dc2626', fontSize: 13 }}>{importError}</p>}
      {!doc ? (
        <p style={{ color: '#64748b' }}>{labels.noDocument}</p>
      ) : preview ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Viewer
            width={width}
            height={height}
            scene={preview.scene}
            overlays={preview.overlays}
            transform={view.transform}
            onTransformChange={view.onUserTransform}
            onViewportResize={view.onViewportResize}
            ariaLabel={ariaLabel ?? labels.boardRegion}
          />
        </div>
      ) : (
        <p>{labels.resolving}</p>
      )}
    </div>
  );
}

/** A resolved document with every `live` binding read as `stale` — the values stay, their observation
 * times stay, only the claim that they are current goes. */
function asLastKnown(doc: ResolvedViewDocument): ResolvedViewDocument {
  return {
    ...doc,
    nodes: doc.nodes.map(node => ({
      ...node,
      widget: {
        ...node.widget,
        quality: Object.fromEntries(
          Object.entries(node.widget.quality).map(([path, quality]) => [path, quality === 'live' ? 'stale' : quality])
        ),
      },
    })),
  };
}

/** When the values on screen were last updated, and — distinctly, announced — when they have stopped
 * being updated (NUREG-0700 §14.1-4: show that the display is working; §2.5.4-6: label a frozen one).
 * A time of day rather than an age, so the line itself never goes out of date. The announcing region
 * is always there and only its text changes: one inserted with its text already in it is not read
 * out by many screen readers. */
function Freshness({ resolvedAt, stalled, labels }: { resolvedAt: number | null; stalled: boolean; labels: UBoardLabels }) {
  const time = resolvedAt === null ? null : labels.time(resolvedAt);
  const notUpdating = stalled && time !== null;
  return (
    <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13 }}>
      <span
        role="status"
        style={notUpdating ? { padding: '2px 8px', borderRadius: 4, background: '#fef3c7', color: '#92400e', fontWeight: 600 } : undefined}
      >
        {notUpdating ? labels.notUpdating.replace('{time}', time) : ''}
      </span>
      {!notUpdating && time !== null && <span style={{ color: '#64748b' }}>{labels.lastUpdated.replace('{time}', time)}</span>}
    </span>
  );
}
