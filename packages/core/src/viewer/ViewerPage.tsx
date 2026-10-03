import { useEffect, useMemo, useRef, useState } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { useResolvedDocument } from './useResolvedDocument.js';
import { documentExtent } from './document-extent.js';
import { useFittedView } from './use-fitted-view.js';
import { toCanvasKit, chartsReady } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';

export interface ViewerPageProps {
  adapters: readonly Adapter[];
  /** Viewport size in CSS px. Omit either to have the view follow its container along that axis —
   * `ViewerPage` then fills its parent, so give the parent a definite size. */
  width?: number;
  height?: number;
  /** 주어지면 Import UI 없이 이 문서를 즉시 렌더한다(공개 임베드 뷰용). 생략 시 오늘과 같은
   * 로컬 파일 Import 데모 동작. */
  initialDocument?: ViewDocument;
  /** 주어지면 이 주기(ms)로 바인딩을 재해석해 연결 품질을 다시 반영한다. 생략 시 오늘과 같은
   * 1회 해석(하위호환). */
  pollIntervalMs?: number;
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
}: ViewerPageProps) {
  const [doc, setDoc] = useState<ViewDocument | null>(initialDocument ?? null);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { resolved } = useResolvedDocument(doc, adapters, { pollIntervalMs });

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
    setPreview(toCanvasKit(resolved));
    // chart.* renders through the dynamically-loaded @iyulab/u-widgets/charts subpath (see
    // to-canvas-kit.tsx) — a node mounted before that resolves needs one more render pass to
    // pick it up.
    chartsReady.then(() => {
      if (!cancelled) setPreview(toCanvasKit(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      setDoc(parseViewDocument(await file.text()));
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof InvalidViewDocumentError ? err.message : 'Import failed.');
    }
  };

  const showFit = viewerShown && extent !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(!initialDocument || showFit) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {!initialDocument && (
            <>
              <button onClick={handleImportClick}>Import</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </>
          )}
          {showFit && <button onClick={() => fitTo(extent)}>Fit to view</button>}
        </div>
      )}
      {importError && <p style={{ color: '#dc2626', fontSize: 13 }}>{importError}</p>}
      {!doc ? (
        <p style={{ color: '#64748b' }}>No document loaded — Import one to view it.</p>
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
          />
        </div>
      ) : (
        <p>Resolving…</p>
      )}
    </div>
  );
}
