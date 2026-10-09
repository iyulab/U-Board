import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
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
import { seedWidget } from './widget-catalog.js';
import { readBackgroundImage, BackgroundImageError, BACKGROUND_IMAGE_TYPES, MAX_BACKGROUND_BYTES } from './background-image.js';
import { DecorationPanel } from './DecorationPanel.js';
import { documentExtent } from '../viewer/document-extent.js';
import { useFittedView } from '../viewer/use-fitted-view.js';
import { ViewControls } from '../viewer/ViewControls.js';
import type { Adapter } from '../adapter.js';
import type { BoardAppearance, ViewDocument, Widget, Shape } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import { useLabels } from '../use-labels.js';
import { TOOLBAR_STYLE, GROUP_STYLE, ERROR_STYLE } from '../ui-style.js';

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
  /** What the Save button does. Omitted, Save downloads the document as a local file (Export). */
  onSave?: (doc: ViewDocument) => void | Promise<void>;
  /** Called whenever the editor gains or loses unsaved changes, so the host can show it in its own
   * UI (a status bar, a tab marker). The editor draws no indicator itself; it only asks the
   * browser to confirm leaving the page (`beforeunload`) while changes are unsaved. */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Text to show instead of the English defaults — any subset of `UBoardLabels`. */
  labels?: Partial<UBoardLabels>;
  /** Show the document being edited as JSON below the editor — a development aid, off by default. */
  showDocumentSource?: boolean;
  /** The current time in epoch milliseconds — what "N minutes ago" in the preview and the binding
   * form is measured by. `Date.now` by default; see `ViewerPage`'s `clock`. */
  clock?: () => number;
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
export function AuthoringView({ initialDocument, adapters, width, height, connectorLabels, onSave, onDirtyChange, labels: labelsProp, showDocumentSource = false, clock = Date.now }: AuthoringViewProps) {
  const labels = useLabels(labelsProp);
  // Read when a result is drawn, not watched: a new function on every render must not re-resolve.
  const readClock = useEffectEvent(() => clock());
  const [doc, setDoc] = useState(initialDocument);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);
  // How many items the editor has selected. With several (a box selection), they can be moved
  // together but no single item's panel applies.
  const [selectionCount, setSelectionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
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

  // A new background usually sets the board's extent — once it is in, show all of it, as when a
  // board opens.
  const [fitPending, setFitPending] = useState(false);
  useEffect(() => {
    if (!fitPending) return;
    setFitPending(false);
    const extentNow = documentExtent(doc);
    if (extentNow) fitTo(extentNow);
  }, [fitPending, doc, fitTo]);


  // The scene point at the top-left of the editor's view — where a newly added item is offset from.
  const visibleOrigin = () => {
    const origin = viewToScene(transform, { x: 0, y: 0 });
    return { x: Math.round(origin.x), y: Math.round(origin.y) };
  };

  useEffect(() => {
    let cancelled = false;
    resolveDocument(doc, adapters).then(resolved => {
      if (cancelled) return;
      setPreview(toCanvasKit(resolved, { qualityText: labels.qualityText, now: readClock(), locale: labels.locale }));
      // chart.* renders through the dynamically-loaded @iyulab/u-widgets/charts subpath (see
      // to-canvas-kit.tsx) — a node mounted before that resolves needs one more render pass to
      // pick it up.
      chartsReady.then(() => {
        if (!cancelled) setPreview(toCanvasKit(resolved, { qualityText: labels.qualityText, now: readClock(), locale: labels.locale }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters, labels]);

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
    setSelectionCount(selection.length);
    const id = selection.length === 1 ? (selection[0].id ?? null) : null;
    setSelectedNodeId(id && doc.nodes.some(n => n.id === id) ? id : null);
    setSelectedDecorationId(id && doc.decorations?.some(d => d.id === id) ? id : null);
  };

  const handleAddNode = () => {
    const widget = seedWidget('status', { label: labels.newNodeLabel, value: labels.newNodeValue });
    setDoc(prev => addNode(prev, nextNodePosition(prev, visibleOrigin()), widget));
    setFileError(null);
  };

  const handleAddDecoration = (type: Shape['type']) => {
    setDoc(prev => addDecoration(prev, type, nextDecorationPosition(prev, visibleOrigin()), labels.newTextDecoration));
    setFileError(null);
  };

  const handleSave = async () => {
    setFileError(null);
    if (!onSave) return handleExport();
    try {
      await onSave(doc);
      setLastSavedDoc(doc);
    } catch {
      // `onSave` (the consumer's save action) is responsible for surfacing the failure in its
      // own UI — this view only needs to know not to clear the unsaved-changes guard.
    }
  };

  /** Downloads the document as a file — what Import opens. Without `onSave` it is how the document
   *  is kept; with one it is a copy to carry elsewhere (another installation, a backup), so it does
   *  not count as saving. */
  const handleExport = () => {
    setFileError(null);
    const blob = new Blob([serializeViewDocument(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'view-document.json';
    link.click();
    URL.revokeObjectURL(url);
    if (!onSave) setLastSavedDoc(doc);
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
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof InvalidViewDocumentError ? err.message : labels.importFailed);
    }
  };

  const handleBackgroundFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-choosing the same file later
    if (!file) return;
    try {
      const image = await readBackgroundImage(file);
      // Onto the document as it is now — the author may have kept editing while the file was read.
      setDoc(prev => ({ ...prev, background: { ...prev.background, image } }));
      setFitPending(true);
      setFileError(null);
    } catch (err) {
      const problem = err instanceof BackgroundImageError ? err.problem : 'unreadable';
      setFileError(
        problem === 'type'
          ? labels.backgroundType
          : problem === 'size'
            ? labels.backgroundTooLarge.replace('{max}', `${MAX_BACKGROUND_BYTES / (1024 * 1024)} MB`)
            : labels.backgroundUnreadable
      );
    }
  };

  const handleRemoveBackground = () => {
    setDoc(prev => {
      const { image: _image, ...background } = prev.background;
      return { ...prev, background };
    });
    setFileError(null);
  };

  // Light is the default, so a light board leaves the field out and its document stays as it was.
  const handleAppearanceChange = (appearance: BoardAppearance) => {
    setDoc(prev => {
      const { appearance: _appearance, ...rest } = prev;
      return appearance === 'dark' ? { ...rest, appearance } : rest;
    });
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
    <div className="ub-authoring" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ub-authoring__toolbar" style={TOOLBAR_STYLE}>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={handleAddNode}>
            {labels.addNode}
          </button>
          <button type="button" className="ub-action" onClick={() => handleAddDecoration('rect')}>
            {labels.addRectDecoration}
          </button>
          <button type="button" className="ub-action" onClick={() => handleAddDecoration('text')}>
            {labels.addTextDecoration}
          </button>
        </div>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          {onSave && (
            <button type="button" className="ub-action ub-action--primary" onClick={handleSave}>
              {labels.save}
            </button>
          )}
          <button type="button" className="ub-action" onClick={handleExport}>
            {labels.export}
          </button>
          <button type="button" className="ub-action" onClick={handleImportClick}>
            {labels.import}
          </button>
        </div>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={() => backgroundInputRef.current?.click()}>
            {labels.setBackground}
          </button>
          {doc.background.image && (
            <button type="button" className="ub-action" onClick={handleRemoveBackground}>
              {labels.removeBackground}
            </button>
          )}
          <label className="ub-authoring__appearance">
            {labels.appearance}{' '}
            <select value={doc.appearance ?? 'light'} onChange={e => handleAppearanceChange(e.target.value as BoardAppearance)}>
              <option value="light">{labels.appearanceLight}</option>
              <option value="dark">{labels.appearanceDark}</option>
            </select>
          </label>
        </div>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <ViewControls view={view} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          data-testid="import-file-input"
        />
        <input
          ref={backgroundInputRef}
          type="file"
          accept={BACKGROUND_IMAGE_TYPES.join(',')}
          onChange={handleBackgroundFile}
          style={{ display: 'none' }}
          data-testid="background-file-input"
        />
      </div>
      {fileError && (
        <p role="alert" className="ub-authoring__error" style={ERROR_STYLE}>
          {fileError}
        </p>
      )}
      <div className="ub-authoring__panes" style={{ display: 'flex', gap: 'var(--ub-space-4, 16px)', flex: 1, minHeight: 0 }}>
        <div className="ub-authoring__pane ub-authoring__pane--editor" style={paneStyle}>
          <h2 className="ub-authoring__pane-heading">{labels.editorHeading}</h2>
          <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={{ flex: 1, minHeight: 0 }}>
            <KonvaDesigner
              width={width}
              height={height}
              scene={scene}
              transform={transform}
              onTransformChange={view.onUserTransform}
              onViewportResize={view.onViewportResize}
              onSceneChange={handleSceneChange}
              onSelectionChange={handleSelectionChange}
              ariaLabel={labels.editorRegion}
            />
          </div>
        </div>
        <div className="ub-authoring__pane ub-authoring__pane--preview" style={paneStyle}>
          <h2 className="ub-authoring__pane-heading">{labels.previewHeading}</h2>
          {preview ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={{ flex: 1, minHeight: 0 }}>
              <Viewer
                width={width}
                height={height}
                scene={preview.scene}
                overlays={preview.overlays}
                transform={transform}
                onTransformChange={view.onUserTransform}
                ariaLabel={labels.previewRegion}
              />
            </div>
          ) : (
            <p className="ub-authoring__status">{labels.resolving}</p>
          )}
        </div>
        {/* A fixed width: sized by its content, the form's inline fields would widen the panel until the
            editor and preview — which give way (`minWidth: 0`) — were squeezed to a sliver. */}
        <div className="ub-authoring__panel" style={{ flex: '0 0 var(--ub-panel-width, 320px)', minWidth: 0, overflowY: 'auto' }}>
          {selectionCount > 1 ? (
            <p className="ub-panel__hint">{labels.multipleSelected.replace('{count}', String(selectionCount))}</p>
          ) : selectedDecoration ? (
            <DecorationPanel decoration={selectedDecoration} onChange={handleDecorationChange} labels={labels} />
          ) : (
            <PropertyPanel node={selectedNode} adapters={adapters} connectorLabels={connectorLabels} onChange={handleWidgetChange} labels={labels} clock={clock} />
          )}
        </div>
      </div>
      {showDocumentSource && (
        <details className="ub-authoring__source">
          <summary>{labels.debugDocument}</summary>
          <pre>{JSON.stringify(doc, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
