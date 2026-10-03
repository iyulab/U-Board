import { useEffect, useMemo, useRef, useState } from 'react';
import { KonvaDesigner } from '@canvas-kit/designer';
import { Viewer } from '@canvas-kit/viewer';
import { viewToScene } from '@canvas-kit/core';
import type { Scene, DrawingObject } from '@canvas-kit/core';
import {
  documentToScene,
  applySceneToDocument,
  addNode,
  nextNodePosition,
  addDecoration,
  nextDecorationPosition,
} from './scene-mapping.js';
import { resolveDocument } from '../resolve-document.js';
import { toCanvasKit, chartsReady } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { serializeViewDocument, parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file.js';
import { PropertyPanel } from './PropertyPanel.js';
import { DecorationPanel } from './DecorationPanel.js';
import { documentExtent } from '../viewer/document-extent.js';
import { useFittedView } from '../viewer/use-fitted-view.js';
import { ViewControls } from '../viewer/ViewControls.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument, Widget, Shape } from '../view-document.js';

export interface AuthoringViewProps {
  initialDocument: ViewDocument;
  adapters: readonly Adapter[];
  /** Size (CSS px) of the editor and of the live preview beside it. Omit either and the two panes
   * split the available width and fill the height — `AuthoringView` then fills its parent, so give
   * the parent a definite height. */
  width?: number;
  height?: number;
  /** Adapter id → human-readable label for the binding editor's connector picker. Falls back to
   * the raw adapter id when a given adapter has no entry (or this prop is omitted entirely). */
  connectorLabels?: Record<string, string>;
  /** Save 버튼 동작을 오버라이드한다. 생략 시 오늘과 같은 로컬 파일 다운로드(Export). */
  onSave?: (doc: ViewDocument) => void | Promise<void>;
  /** 미저장 변경 여부가 바뀔 때마다 호출된다 — 소비자가 자체 UI(상태 표시줄 등)에 반영할 수 있게.
   * 이 컴포넌트 자신은 시각적 표시를 그리지 않는다(그건 소비자 몫); 브라우저 레벨 이탈 경고
   * (`beforeunload`)만 내부적으로 처리한다. */
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * The authoring surface: a canvas-kit `KonvaDesigner` for adding/dragging/selecting nodes, a live
 * preview rendered through the same path a real viewer would use (`resolveDocument` +
 * `toCanvasKit`), and a `PropertyPanel` for editing the selected node's widget type, static props,
 * and bindings (docs/principles.md — editor/renderer separation; the designer never renders a
 * widget itself, it only owns the node's footprint and selection).
 *
 * The editor and the preview share one pan/zoom — moving either moves both, so the preview stays a
 * mirror of what is being edited. A document opens fitted into view (shrunk to fit, never
 * magnified) and stays fitted as the panes resize until the author pans or zooms; "Fit to view"
 * restores that, and a new node or decoration is placed in view.
 */
export function AuthoringView({ initialDocument, adapters, width, height, connectorLabels, onSave, onDirtyChange }: AuthoringViewProps) {
  const [doc, setDoc] = useState(initialDocument);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const view = useFittedView();
  const { fitTo, transform } = view;
  // The document most recently opened (the initial one, or an import) — fitting into view happens
  // when a document is opened, not on every edit.
  const [openedDoc, setOpenedDoc] = useState(initialDocument);
  const scene = useMemo(() => documentToScene(doc), [doc]);
  const extent = useMemo(() => documentExtent(doc), [doc]);
  // Every state-changing handler below (`setDoc`) replaces the document with a new object, so a
  // plain reference check against the last-saved snapshot is enough to know "the author has
  // unsaved changes" — no per-field diffing needed. Kept in state (not a ref) because updating it
  // must trigger a re-render for `isDirty`/the beforeunload effect below to pick up the change.
  const [lastSavedDoc, setLastSavedDoc] = useState(initialDocument);
  const isDirty = doc !== lastSavedDoc;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    fitTo(documentExtent(openedDoc));
  }, [fitTo, openedDoc]);


  // The scene point at the top-left of the editor's view — where a newly added item is offset from.
  const visibleOrigin = () => {
    const origin = viewToScene(transform, { x: 0, y: 0 });
    return { x: Math.round(origin.x), y: Math.round(origin.y) };
  };

  useEffect(() => {
    let cancelled = false;
    resolveDocument(doc, adapters).then(resolved => {
      if (cancelled) return;
      setPreview(toCanvasKit(resolved));
      // chart.* renders through the dynamically-loaded @iyulab/u-widgets/charts subpath (see
      // to-canvas-kit.tsx) — a node mounted before that resolves needs one more render pass to
      // pick it up.
      chartsReady.then(() => {
        if (!cancelled) setPreview(toCanvasKit(resolved));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters]);

  useEffect(() => {
    if (selectedNodeId && !doc.nodes.some(n => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
    if (selectedDecorationId && !doc.decorations?.some(d => d.id === selectedDecorationId)) {
      setSelectedDecorationId(null);
    }
  }, [doc, selectedNodeId, selectedDecorationId]);

  const handleSceneChange = (newScene: Scene) => {
    setDoc(prev => applySceneToDocument(prev, newScene));
  };

  // A decoration can be a scene `rect`, same as a node — told apart by which array of the
  // document actually contains the selected id, not by the DrawingObject's own `type`.
  const handleSelectionChange = (selection: DrawingObject[]) => {
    const id = selection[0]?.id ?? null;
    setSelectedNodeId(id && doc.nodes.some(n => n.id === id) ? id : null);
    setSelectedDecorationId(id && doc.decorations?.some(d => d.id === id) ? id : null);
  };

  const handleAddNode = () => {
    setDoc(prev => addNode(prev, nextNodePosition(prev, visibleOrigin())));
    setImportError(null);
  };

  const handleAddDecoration = (type: Shape['type']) => {
    setDoc(prev => addDecoration(prev, type, nextDecorationPosition(prev, visibleOrigin())));
    setImportError(null);
  };

  const handleSave = async () => {
    setImportError(null);
    if (onSave) {
      try {
        await onSave(doc);
        setLastSavedDoc(doc);
      } catch {
        // `onSave` (the consumer's save action) is responsible for surfacing the failure in its
        // own UI — this view only needs to know not to clear the unsaved-changes guard.
      }
      return;
    }
    const blob = new Blob([serializeViewDocument(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'view-document.json';
    link.click();
    URL.revokeObjectURL(url);
    setLastSavedDoc(doc);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      const imported = parseViewDocument(await file.text());
      setDoc(imported);
      setOpenedDoc(imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof InvalidViewDocumentError ? err.message : 'Import failed.');
    }
  };

  const handleWidgetChange = (widget: Widget) => {
    setDoc(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === selectedNodeId ? { ...n, widget } : n)),
    }));
  };

  const handleDecorationChange = (decoration: Shape) => {
    setDoc(prev => ({
      ...prev,
      decorations: prev.decorations?.map(d => (d.id === selectedDecorationId ? decoration : d)),
    }));
  };

  const selectedNode = doc.nodes.find(n => n.id === selectedNodeId) ?? null;
  const selectedDecoration = doc.decorations?.find(d => d.id === selectedDecorationId) ?? null;

  // Sized panes stay at their size; container-sized ones split the row and fill its height.
  const followsContainer = width === undefined || height === undefined;
  const paneStyle: React.CSSProperties = followsContainer
    ? { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div>
        <button onClick={handleAddNode} style={{ marginBottom: 8 }}>
          Add node
        </button>{' '}
        <button onClick={() => handleAddDecoration('rect')} style={{ marginBottom: 8 }}>
          Add rect decoration
        </button>{' '}
        <button onClick={() => handleAddDecoration('text')} style={{ marginBottom: 8 }}>
          Add text decoration
        </button>{' '}
        <button onClick={handleSave} style={{ marginBottom: 8 }}>
          {onSave ? 'Save' : 'Export'}
        </button>{' '}
        <button onClick={handleImportClick} style={{ marginBottom: 8 }}>
          Import
        </button>
        {' '}
        <ViewControls
          view={view}
          onFit={extent ? () => fitTo(extent) : undefined}
          buttonStyle={{ marginBottom: 8, marginRight: 4 }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          data-testid="import-file-input"
        />
        {importError && <p style={{ color: '#dc2626', fontSize: 13 }}>{importError}</p>}
      </div>
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        <div style={paneStyle}>
          <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Editor</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <KonvaDesigner
              width={width}
              height={height}
              scene={scene}
              transform={transform}
              onTransformChange={view.onUserTransform}
              onViewportResize={view.onViewportResize}
              onSceneChange={handleSceneChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
        <div style={paneStyle}>
          <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Live preview</h2>
          {preview ? (
            <div style={{ flex: 1, minHeight: 0 }}>
              <Viewer
                width={width}
                height={height}
                scene={preview.scene}
                overlays={preview.overlays}
                transform={transform}
                onTransformChange={view.onUserTransform}
              />
            </div>
          ) : (
            <p>Resolving…</p>
          )}
        </div>
        <div>
          {selectedDecoration ? (
            <DecorationPanel decoration={selectedDecoration} onChange={handleDecorationChange} />
          ) : (
            <PropertyPanel node={selectedNode} adapters={adapters} connectorLabels={connectorLabels} onChange={handleWidgetChange} />
          )}
        </div>
      </div>
      <details style={{ marginTop: 16 }}>
        <summary>ViewDocument (debug)</summary>
        <pre style={{ fontSize: 11, maxWidth: 900, overflowX: 'auto' }}>{JSON.stringify(doc, null, 2)}</pre>
      </details>
    </div>
  );
}
