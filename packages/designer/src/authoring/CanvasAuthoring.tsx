import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { KonvaDesigner, type DesignerHandle } from '@canvas-kit/designer';
import { Viewer } from '@canvas-kit/viewer';
import type { Scene, DrawingObject } from '@canvas-kit/core';
import { documentToScene, applySceneToDocument, partOf } from './scene-mapping.js';
import { removeParts } from '../editing/part-removal.js';
import { resolveDocument } from '@iyulab/u-board/toolkit';
import { toCanvasKit } from '@iyulab/u-board/toolkit';
import type { ResolvedCanvasView } from '@iyulab/u-board/toolkit';
import { focusPart, useTriggers } from '@iyulab/u-board/toolkit';
import { widgetTypeName } from './widget-catalog.js';
import { documentExtent } from '@iyulab/u-board/toolkit';
import { sizedNodes } from '@iyulab/u-board/toolkit';
import { useFittedView } from '@iyulab/u-board/toolkit';
import { ViewControls } from '@iyulab/u-board/toolkit';
import type { CanvasView } from '@iyulab/u-board/picture';
import { TOOLBAR_STYLE, GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { ModeSwitch, type KindEditorProps } from './editor-parts.js';
import { AttributionLine, boardAttributions, showsExampleData } from '@iyulab/u-board/toolkit';

/**
 * The canvas of a board being edited, drawn from its picture: in Edit, a canvas-kit `KonvaDesigner` moves, sizes,
 * selects and deletes the parts — each widget, rendered through the same path a viewer uses (`resolveDocument` +
 * `toCanvasKit`), laid over its footprint, display-only — and in View, the canvas-kit `Viewer` shows the board as a
 * shared link does (docs/principles.md — editor/renderer separation; the designer never renders a widget itself, it
 * only owns a part's footprint and selection). What a selected part is set to is the panel `parts.panel` draws.
 *
 * Both modes share one pan/zoom. The board opens fitted into view (shrunk to fit, never magnified) and stays fitted as
 * it resizes until the author pans or zooms; "Fit to view" restores that.
 */
export function CanvasAuthoring({
  doc,
  updateDoc,
  mode,
  onModeChange,
  documentActions,
  adapters,
  width,
  height,
  labels,
  clock,
  triggerHosting,
  parts,
}: KindEditorProps<CanvasView>) {
  // Read when a result is drawn, not watched: a new function on every render must not re-resolve.
  const readClock = useEffectEvent(() => clock());
  // The board as its bindings last resolved, and when — drawn below as a viewer draws it.
  const [resolved, setResolved] = useState<{ doc: ResolvedCanvasView; now: number } | null>(null);
  // The parts the editor has selected, in the order they were picked. With several (a box selection), they can be
  // deleted together, and two joined, but no single part's panel applies.
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  // A part just added, to be selected once the designer draws it — so its panel opens.
  const [pendingSelect, setPendingSelect] = useState<string | null>(null);
  const designerRef = useRef<DesignerHandle>(null);
  const view = useFittedView();
  const { fitTo, focusOn } = view;
  // The board's triggers run in View only, as a shared link runs them; in Edit a click selects.
  const shownDoc = mode === 'view' ? (resolved?.doc ?? null) : null;
  const focus = useCallback((node: string) => focusPart(shownDoc, node, focusOn, null), [shownDoc, focusOn]);
  const { activatable, activate, elementEvent } = useTriggers(doc, shownDoc, { ...triggerHosting, focus });
  const preview = useMemo(
    () =>
      resolved &&
      toCanvasKit(resolved.doc, {
        qualityText: labels.qualityText,
        now: resolved.now,
        locale: labels.locale,
        ...(mode === 'view' && { activatable, onNodeActivate: activate, onElementEvent: elementEvent }),
      }),
    [resolved, labels, mode, activatable, activate, elementEvent]
  );
  // The picture as it was opened — this editor is mounted afresh for each board opened — which is what fits into view;
  // not each edit.
  const [openedDoc] = useState(doc);
  const { movable, deletable } = parts;
  const scene = useMemo(() => documentToScene(doc, movable, deletable), [doc, movable, deletable]);
  const extent = useMemo(() => documentExtent(doc), [doc]);
  // The widgets the viewer would draw, laid over the parts being edited — display-only, so a press on one reaches the
  // part beneath — each with its widget type named above it. Where and how big each is comes from the picture as edited
  // now; only what it shows waits for the bindings to resolve, so a moved or resized part does not leave its widget
  // behind while a slow source answers.
  const editorOverlays = useMemo(() => {
    const widgets = new Map((preview?.overlays ?? []).map(overlay => [overlay.id, overlay.content]));
    return sizedNodes(doc).map(node => ({
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      content: <NodeInPlace widget={widgets.get(node.id) ?? null} name={widgetTypeName(node.widget.type, labels.locale)} />,
    }));
  }, [preview, doc, labels.locale]);
  useEffect(() => {
    fitTo(documentExtent(openedDoc));
  }, [fitTo, openedDoc]);

  useEffect(() => {
    let cancelled = false;
    resolveDocument(doc, adapters).then(result => {
      if (!cancelled) setResolved({ doc: result, now: readClock() });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters]);
  const attributions = useMemo(() => boardAttributions(doc, adapters), [doc, adapters]);
  const example = useMemo(() => showsExampleData(doc, adapters), [doc, adapters]);

  // A part that leaves the picture (undone) leaves the selection.
  useEffect(() => {
    const present = (id: string) => doc.nodes.some(n => n.id === id) || doc.connectors.some(c => c.id === id) || !!doc.decorations?.some(d => d.id === id);
    setSelectedIds(ids => (ids.every(present) ? ids : ids.filter(present)));
  }, [doc]);

  useEffect(() => {
    if (!pendingSelect || !scene.getObjects().some(o => o.id === pendingSelect)) return;
    designerRef.current?.select([pendingSelect]);
    setPendingSelect(null);
  }, [scene, pendingSelect]);

  const handleSceneChange = (newScene: Scene) => {
    updateDoc(prev => applySceneToDocument(prev, newScene));
  };

  // Nothing is selected on a board being viewed — and the editor, mounted again on the way back, starts with no
  // selection — so the panel lets go of the selected item rather than show one the board does not.
  const handleViewMode = () => {
    onModeChange('view');
    setSelectedIds([]);
  };

  // A connector is drawn in pieces (its line, heads, label chip): any of them selects the connector.
  const handleSelectionChange = (selection: DrawingObject[]) => {
    setSelectedIds([...new Set(selection.flatMap(object => (object.id ? [partOf(object.id)] : [])))]);
  };

  // Two of the board's own parts picked: they can be joined, first to second.
  const pair = selectedIds.length === 2 && selectedIds.every(id => doc.nodes.some(n => n.id === id) && movable(id)) ? selectedIds : null;
  const handleConnect = () => {
    if (!pair || !parts.connect) return;
    setPendingSelect(parts.connect(pair[0]!, pair[1]!));
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const ids = selectedIds.filter(id => movable(id) || !!deletable?.(id));
    updateDoc(prev => removeParts(prev, ids));
    designerRef.current?.select([]);
    setSelectedIds([]);
  };

  // Delete or Backspace on the editor deletes the selection — not while typing in a field.
  const handleEditorKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const target = e.target as HTMLElement;
    if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (selectedIds.length === 0) return;
    e.preventDefault();
    handleDelete();
  };

  // Sized panes stay at their size; container-sized ones split the row and fill its height.
  const followsContainer = width === undefined || height === undefined;
  const paneStyle: React.CSSProperties = followsContainer
    ? { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column' };

  return (
    <>
      <div className="ub-authoring__toolbar" style={TOOLBAR_STYLE}>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          {parts.connect && (
            <button type="button" className="ub-action" onClick={handleConnect} disabled={!pair} title={pair ? undefined : labels.connectHint}>
              {labels.addConnector}
            </button>
          )}
          <button type="button" className="ub-action" onClick={handleDelete} disabled={selectedIds.length === 0}>
            {labels.deleteSelected}
          </button>
        </div>
        {documentActions}
        <ModeSwitch mode={mode} onEdit={() => onModeChange('edit')} onView={handleViewMode} labels={labels} />
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <ViewControls view={view} onFit={extent ? () => fitTo(extent) : undefined} labels={labels} />
        </div>
      </div>
      <div className="ub-authoring__panes" style={{ display: 'flex', gap: 'var(--ub-space-4, 16px)', flex: 1, minHeight: 0 }}>
        <div className="ub-authoring__pane" style={paneStyle}>
          {mode === 'edit' ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={{ flex: 1, minHeight: 0 }} role="presentation" onKeyDown={handleEditorKey}>
              <KonvaDesigner
                ref={designerRef}
                width={width}
                height={height}
                scene={scene}
                transform={view.transform}
                onTransformChange={view.onUserTransform}
                onViewportResize={view.onViewportResize}
                onSceneChange={handleSceneChange}
                onSelectionChange={handleSelectionChange}
                overlays={editorOverlays}
                ariaLabel={labels.editorRegion}
              />
            </div>
          ) : preview ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={{ flex: 1, minHeight: 0 }}>
              <Viewer
                width={width}
                height={height}
                scene={preview.scene}
                overlays={preview.overlays}
                transform={view.transform}
                onTransformChange={view.onUserTransform}
                onViewportResize={view.onViewportResize}
                ariaLabel={labels.previewRegion}
              />
            </div>
          ) : (
            <p className="ub-authoring__status">{labels.resolving}</p>
          )}
          {mode === 'view' && preview && <AttributionLine attributions={attributions} example={example} labels={labels} />}
        </div>
        {/* A fixed width: sized by its content, the form's inline fields would widen the panel until the
            editor and preview — which give way (`minWidth: 0`) — were squeezed to a sliver. */}
        <div className="ub-authoring__panel" style={{ flex: '0 0 var(--ub-panel-width, 320px)', minWidth: 0, overflowY: 'auto' }}>
          {selectedIds.length > 1 ? (
            <p className="ub-panel__hint">{labels.multipleSelected.replace('{count}', String(selectedIds.length))}</p>
          ) : (
            (parts.panel(selectedIds[0] ?? null) ?? <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>)
          )}
        </div>
      </div>
    </>
  );
}

const NODE_IN_PLACE_STYLE: CSSProperties = { position: 'relative', width: '100%', height: '100%' };
// Above the node's box, so it never covers the widget; the tag is a hint, not part of the board.
const NODE_TAG_STYLE: CSSProperties = { position: 'absolute', left: 0, bottom: '100%', whiteSpace: 'nowrap' };

/** A part's widget drawn where it is being edited, with the widget type named above it — what tells two parts apart,
 * and what an unbound widget that draws nothing still shows. */
function NodeInPlace({ widget, name }: { widget: ReactNode; name: string }) {
  return (
    <div className="ub-authoring__node" style={NODE_IN_PLACE_STYLE}>
      {widget}
      <span className="ub-authoring__node-tag" style={NODE_TAG_STYLE}>
        {name}
      </span>
    </div>
  );
}
