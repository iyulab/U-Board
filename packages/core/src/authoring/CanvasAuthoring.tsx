import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { KonvaDesigner, type DesignerHandle } from '@canvas-kit/designer';
import { Viewer } from '@canvas-kit/viewer';
import { viewToScene } from '@canvas-kit/core';
import type { Scene, DrawingObject } from '@canvas-kit/core';
import {
  documentToScene,
  applySceneToDocument,
  addNode,
  newNodeId,
  nextNodePosition,
  addDecoration,
  newDecorationId,
  nextDecorationPosition,
  addConnector,
  newConnectorId,
  setInstanceParam,
  partOf,
} from './scene-mapping.js';
import { removeParts } from '../editing/part-removal.js';
import { resolveDocument } from '../resolve-document.js';
import { expandComponents } from '../components.js';
import { toCanvasKit } from '../renderer/to-canvas-kit.js';
import type { ResolvedCanvasView } from '../resolve-document.js';
import { focusPart, useTriggers } from '../viewer/use-triggers.js';
import { PropertyPanel, withPartChange, type PartChange } from './PropertyPanel.js';
import { triggerEditing } from './TriggersEditor.js';
import { BoardPanel } from './BoardPanel.js';
import { ElementsPanel } from './ElementsPanel.js';
import { SymbolsPanel } from './SymbolsPanel.js';
import { seedWidget, widgetTypeName } from './widget-catalog.js';
import { readBackgroundImage, BackgroundImageError, BACKGROUND_IMAGE_TYPES, MAX_BACKGROUND_BYTES } from './background-image.js';
import { DecorationPanel } from './DecorationPanel.js';
import { ConnectorPanel } from './ConnectorPanel.js';
import { InstancePanel } from './InstancePanel.js';
import { partNamer } from './part-names.js';
import { canMakeComponent, componentBoard, componentPreview, componentPreviewValues, detachInstance, makeComponent, newComponentName, newInstanceId, setComponentParams, withComponentBoard } from '../editing/component-editing.js';
import { ComponentPanel } from './ComponentPanel.js';
import { forgetMoved, movedAnchors, relocateAnchors, snapshotAnchors, type AnchorSnapshot } from './anchor-snapshot.js';
import { documentExtent } from '../viewer/document-extent.js';
import { sizedNodes } from '../node-size.js';
import { useFittedView } from '../viewer/use-fitted-view.js';
import { ViewControls } from '../viewer/ViewControls.js';
import type { BoardAppearance, Connector, Node, ReferencePoint, CanvasView, PropsSchema, Widget, Shape } from '../view-document.js';
import { TOOLBAR_STYLE, GROUP_STYLE } from '../ui-style.js';
import { FileError, ModeSwitch, type KindEditorProps } from './editor-parts.js';
import { AttributionLine, boardAttributions, showsExampleData } from '../viewer/attribution.js';

/**
 * The editor of a canvas view: one board, shown in one of two modes, beside a `PropertyPanel` for editing
 * the selected node's widget type, static props and bindings. In Edit, a canvas-kit `KonvaDesigner`
 * adds, drags and selects nodes, and each node's widget — rendered through the same path a real
 * viewer uses (`resolveDocument` + `toCanvasKit`) — is laid over its footprint, display-only. In
 * View, the canvas-kit `Viewer` shows the board as a shared link does (docs/principles.md —
 * editor/renderer separation; the designer never renders a widget itself, it only owns the node's
 * footprint and selection).
 *
 * Both modes share one pan/zoom. The board opens fitted into view (shrunk to fit, never magnified)
 * and stays fitted as it resizes until the author pans or zooms; "Fit to view" restores that, and a
 * new node or decoration is placed in view.
 */
export interface CanvasAuthoringProps extends KindEditorProps<CanvasView> {
  /** It edits a grid's canvas cell — which has no components of its own, so none is made here. */
  inCell?: boolean;
}

export function CanvasAuthoring(props: CanvasAuthoringProps) {
  const { doc, updateDoc } = props;
  // The component being edited, if one is: the same editor, on the component as a board of its own (`componentBoard`),
  // each edit written back into the board (`withComponentBoard`) — so Undo, Save and the history are the board's.
  const [editing, setEditing] = useState<string | null>(null);
  const board = useMemo(() => (editing ? componentBoard(doc, editing) : null), [doc, editing]);
  const previewValues = useMemo(() => (editing ? componentPreviewValues(doc, editing) : {}), [doc, editing]);
  // Undone past its making, the component is gone: back to the board.
  useEffect(() => {
    if (editing && !board) setEditing(null);
  }, [editing, board]);
  const updateComponent = useCallback(
    (update: (current: CanvasView) => CanvasView) => {
      if (!editing) return;
      updateDoc(prev => {
        const current = componentBoard(prev, editing);
        return current ? withComponentBoard(prev, editing, update(current)) : prev;
      });
    },
    [editing, updateDoc]
  );
  if (editing && board) {
    const scope: ComponentScope = {
      name: editing,
      params: doc.components?.[editing]?.params,
      instances: (doc.instances ?? []).filter(instance => instance.component === editing).length,
      previewValues,
      onParamsChange: params => updateDoc(prev => setComponentParams(prev, editing, params)),
      onDone: () => setEditing(null),
    };
    return <CanvasEditor key={`component:${editing}`} {...props} doc={board} updateDoc={updateComponent} component={scope} />;
  }
  return <CanvasEditor key="board" {...props} onEditComponent={setEditing} />;
}

/** A component being edited — what the editor needs of it besides its parts. */
interface ComponentScope {
  name: string;
  params: PropsSchema | undefined;
  instances: number;
  /** What its parts' placeholders show while it is edited (`componentPreviewValues`) — never written into it. */
  previewValues: Readonly<Record<string, unknown>>;
  onParamsChange: (params: PropsSchema | undefined) => void;
  onDone: () => void;
}

/** The editor itself — of a board, or of a component as a board of its own (`component`). */
function CanvasEditor({
  doc,
  updateDoc,
  mode,
  onModeChange,
  documentActions,
  fileError,
  onFileError,
  adapters,
  width,
  height,
  connectorLabels,
  labels,
  clock,
  triggerHosting,
  component,
  onEditComponent,
  inCell = false,
  layoutOnly,
}: CanvasAuthoringProps & { component?: ComponentScope; onEditComponent?: (name: string) => void }) {
  const previewValues = component?.previewValues;
  // Read when a result is drawn, not watched: a new function on every render must not re-resolve.
  const readClock = useEffectEvent(() => clock());
  // The board as its bindings last resolved, and when — drawn below as a viewer draws it.
  const [resolved, setResolved] = useState<{ doc: ResolvedCanvasView; now: number } | null>(null);
  // The anchored nodes' coordinates from before the reference points last changed or went away, until the
  // author puts the nodes back there or leaves them (anchor-snapshot.ts).
  // `byImage`: the points went with the image (replaced by one of another size, or removed), so the author
  // is told to give them again; points the author edited or cleared need no telling.
  const [anchorSnapshot, setAnchorSnapshot] = useState<{ snapshot: AnchorSnapshot; byImage: boolean } | null>(null);
  // A node the author moves or resizes while the snapshot is held is where the author wants it: forgotten.
  const documentBefore = useRef(doc);
  useEffect(() => {
    const before = documentBefore.current;
    documentBefore.current = doc;
    if (before === doc) return;
    setAnchorSnapshot(held => {
      if (!held) return held;
      const snapshot = forgetMoved(held.snapshot, before, doc);
      return snapshot === held.snapshot ? held : { ...held, snapshot };
    });
  }, [doc]);
  // The first change since the last answer is what the nodes are measured against, not each keystroke's.
  const holdAnchors = (current: CanvasView, byImage: boolean) =>
    setAnchorSnapshot(held => {
      if (held) return byImage ? { ...held, byImage } : held;
      const snapshot = snapshotAnchors(current);
      return snapshot ? { snapshot, byImage } : null;
    });
  // The document parts the editor has selected — nodes, decorations, connectors — in the order they were picked. With
  // several (a box selection), they can be moved or deleted together, and two nodes joined, but no single part's panel
  // applies.
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  // A part just added, to be selected once the designer draws it — so its panel opens.
  const [pendingSelect, setPendingSelect] = useState<string | null>(null);
  const designerRef = useRef<DesignerHandle>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const view = useFittedView();
  const { fitTo, focusOn, transform } = view;
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
  // The document as it was opened — this editor is mounted afresh for each document opened — which is what
  // fits into view; not each edit.
  const [openedDoc] = useState(doc);
  const movable = layoutOnly?.movable;
  const deletable = layoutOnly?.deletable;
  const scene = useMemo(() => documentToScene(doc, movable, deletable), [doc, movable, deletable]);
  const extent = useMemo(() => documentExtent(doc), [doc]);
  // The widgets the viewer would draw, laid over the nodes being edited — display-only, so a press on
  // one reaches the node beneath — each with its widget type named above it. Where and how big each is
  // comes from the document as edited now; only what it shows waits for the bindings to resolve, so a
  // moved or resized node does not leave its widget behind while a slow source answers.
  const editorOverlays = useMemo(() => {
    const widgets = new Map((preview?.overlays ?? []).map(overlay => [overlay.id, overlay.content]));
    return sizedNodes(expandComponents(doc)).map(node => ({
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

  // A new background usually sets the board's extent — once it is in, show all of it, as when a
  // board opens.
  const [fitPending, setFitPending] = useState(false);
  useEffect(() => {
    if (!fitPending) return;
    setFitPending(false);
    const extentNow = documentExtent(doc);
    if (extentNow) fitTo(extentNow);
  }, [fitPending, doc, fitTo]);


  // Where a newly added item is offset from: the scene point at the top-left of the editor's view — but in a
  // component, its own origin, which every instance moves to its place; from the visible corner a new part would
  // stand off from every instance.
  const newPartOrigin = () => {
    if (component) return { x: 0, y: 0 };
    const origin = viewToScene(transform, { x: 0, y: 0 });
    return { x: Math.round(origin.x), y: Math.round(origin.y) };
  };

  useEffect(() => {
    let cancelled = false;
    // A component's parts are drawn with their placeholders filled, as an instance will draw them.
    resolveDocument(previewValues ? componentPreview(doc, previewValues) : doc, adapters).then(result => {
      if (!cancelled) setResolved({ doc: result, now: readClock() });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters, previewValues]);
  const attributions = useMemo(() => boardAttributions(doc, adapters), [doc, adapters]);
  const example = useMemo(() => showsExampleData(doc, adapters), [doc, adapters]);

  // A part that leaves the document (undone, imported over) leaves the selection.
  useEffect(() => {
    const present = (id: string) =>
      doc.nodes.some(n => n.id === id) || doc.connectors.some(c => c.id === id) || !!doc.decorations?.some(d => d.id === id) || !!doc.instances?.some(i => i.id === id);
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

  // A decoration can be a scene `rect`, same as a node — told apart by which array of the
  // document actually contains the selected id, not by the DrawingObject's own `type`.
  // Nothing is selected on a board being viewed — and the editor, mounted again on the way back, starts
  // with no selection — so the panel lets go of the selected item rather than show one the board does not.
  const handleViewMode = () => {
    onModeChange('view');
    setSelectedIds([]);
  };

  // A connector is drawn in pieces (its line, heads, label chip): any of them selects the connector.
  const handleSelectionChange = (selection: DrawingObject[]) => {
    setSelectedIds([...new Set(selection.flatMap(object => (object.id ? [partOf(object.id)] : [])))]);
  };

  const single = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedNodeId = single && doc.nodes.some(n => n.id === single) ? single : null;
  const selectedDecorationId = single && doc.decorations?.some(d => d.id === single) ? single : null;
  // Two nodes picked: they can be joined, first to second.
  const pair = selectedIds.length === 2 && selectedIds.every(id => doc.nodes.some(n => n.id === id)) ? selectedIds : null;

  // A board drawn from another one joins two of its own parts through that one.
  const ownPair = layoutOnly?.connect && pair && movable && pair.every(movable) ? pair : null;
  const handleOwnConnect = () => {
    if (!ownPair || !layoutOnly?.connect) return;
    setPendingSelect(layoutOnly.connect(ownPair[0]!, ownPair[1]!));
  };

  const handleConnect = () => {
    if (!pair) return;
    const id = newConnectorId();
    updateDoc(prev => addConnector(prev, id, pair[0], pair[1]));
    setPendingSelect(id);
    onFileError(null);
  };

  // The selection, made a component and drawn where it was by a new instance — which is then selected.
  const canMake = canMakeComponent(doc, selectedIds);
  const handleMakeComponent = () => {
    if (!canMake) return;
    const id = newInstanceId(doc);
    const ids = selectedIds;
    updateDoc(prev => makeComponent(prev, ids, newComponentName(prev), id));
    designerRef.current?.select([]);
    setSelectedIds([]);
    setPendingSelect(id);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const ids = movable ? selectedIds.filter(id => movable(id) || !!layoutOnly?.deletable?.(id)) : selectedIds;
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

  // What the author adds is selected at once, so its panel opens — a node, a decoration or a connector alike.
  const handleAddNode = () => {
    const widget = seedWidget('status', { label: labels.newNodeLabel, value: labels.newNodeValue });
    const id = newNodeId();
    updateDoc(prev => addNode(prev, id, nextNodePosition(prev, newPartOrigin()), widget));
    setPendingSelect(id);
    onFileError(null);
  };

  const handleAddDecoration = (type: Shape['type']) => {
    const id = newDecorationId();
    updateDoc(prev => addDecoration(prev, id, type, nextDecorationPosition(prev, newPartOrigin()), labels.newTextDecoration));
    setPendingSelect(id);
    onFileError(null);
  };

  const handleBackgroundFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-choosing the same file later
    if (!file) return;
    try {
      const image = await readBackgroundImage(file);
      // An image of the same size is taken as the same drawing redone (a plan exported again), so the points
      // stay; any other size leaves them pointing at the wrong pixels, so they go, and the anchored nodes'
      // coordinates are held until the new image has points.
      const previous = doc.background.image;
      const keepsPoints = previous?.width === image.width && previous.height === image.height;
      if (previous?.referencePoints && !keepsPoints) holdAnchors(doc, true);
      // Onto the document as it is now — the author may have kept editing while the file was read.
      updateDoc(prev => {
        const points = prev.background.image?.referencePoints;
        return { ...prev, background: { ...prev.background, image: points && keepsPoints ? { ...image, referencePoints: points } : image } };
      });
      setFitPending(true);
      onFileError(null);
    } catch (err) {
      const problem = err instanceof BackgroundImageError ? err.problem : 'unreadable';
      onFileError(
        problem === 'type'
          ? labels.backgroundType
          : problem === 'size'
            ? labels.backgroundTooLarge.replace('{max}', `${MAX_BACKGROUND_BYTES / (1024 * 1024)} MB`)
            : labels.backgroundUnreadable
      );
    }
  };

  const handleRemoveBackground = () => {
    holdAnchors(doc, true);
    updateDoc(prev => {
      const { image: _image, ...background } = prev.background;
      return { ...prev, background };
    });
    onFileError(null);
  };

  // Light is the default, so a light board leaves the field out and its document stays as it was.
  const handleAppearanceChange = (appearance: BoardAppearance) => {
    updateDoc(prev => {
      const { appearance: _appearance, ...rest } = prev;
      return appearance === 'dark' ? { ...rest, appearance } : rest;
    });
  };
  const handleAccentChange = (accent: string | undefined) => {
    updateDoc(prev => {
      const { accent: _accent, ...rest } = prev;
      return accent === undefined ? rest : { ...rest, accent };
    });
  };

  const handleNodeChange = (change: Partial<Pick<Node, 'x' | 'y' | 'anchored'>>) => {
    updateDoc(prev => ({ ...prev, nodes: prev.nodes.map(n => (n.id === selectedNodeId ? { ...n, ...change } : n)) }));
  };
  const handleReferencePointsChange = (referencePoints: [ReferencePoint, ReferencePoint] | undefined) => {
    holdAnchors(doc, false);
    updateDoc(prev => {
      if (!prev.background.image) return prev;
      const { referencePoints: _points, ...image } = prev.background.image;
      return { ...prev, background: { ...prev.background, image: referencePoints ? { ...image, referencePoints } : image } };
    });
  };
  const handleWidgetChange = (widget: Widget) => {
    updateDoc(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === selectedNodeId ? { ...n, widget } : n)),
    }));
  };

  const handlePartChange = (change: PartChange) => {
    updateDoc(prev => ({ ...prev, nodes: prev.nodes.map(n => (n.id === selectedNodeId ? withPartChange(n, change) : n)) }));
  };

  const handleDecorationChange = (decoration: Shape) => {
    updateDoc(prev => ({
      ...prev,
      decorations: prev.decorations?.map(d => (d.id === selectedDecorationId ? decoration : d)),
    }));
  };

  const handleConnectorChange = (connector: Connector) => {
    updateDoc(prev => ({ ...prev, connectors: prev.connectors.map(c => (c.id === connector.id ? connector : c)) }));
  };

  const selectedNode = doc.nodes.find(n => n.id === selectedNodeId) ?? null;
  const selectedDecoration = doc.decorations?.find(d => d.id === selectedDecorationId) ?? null;
  const selectedConnector = single ? (doc.connectors.find(c => c.id === single) ?? null) : null;
  const selectedInstance = single ? (doc.instances?.find(i => i.id === single) ?? null) : null;

  // Sized panes stay at their size; container-sized ones split the row and fill its height.
  const followsContainer = width === undefined || height === undefined;
  const paneStyle: React.CSSProperties = followsContainer
    ? { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column' };

  return (
    <>
      {component && (
        // Always in sight while a component is edited, whatever its panel shows.
        <div className="ub-authoring__scope" role="status" style={TOOLBAR_STYLE}>
          <span>{labels.componentEditing.replace('{component}', component.name)}</span>
          <button type="button" className="ub-action" onClick={component.onDone}>
            {labels.componentDone}
          </button>
        </div>
      )}
      <div className="ub-authoring__toolbar" style={TOOLBAR_STYLE}>
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          {!movable && (
            <>
          <button type="button" className="ub-action" onClick={handleAddNode}>
            {labels.addNode}
          </button>
          <button type="button" className="ub-action" onClick={() => handleAddDecoration('rect')}>
            {labels.addRectDecoration}
          </button>
          <button type="button" className="ub-action" onClick={() => handleAddDecoration('text')}>
            {labels.addTextDecoration}
          </button>
          <button type="button" className="ub-action" onClick={handleConnect} disabled={!pair} title={pair ? undefined : labels.connectHint}>
            {labels.addConnector}
          </button>
          {!component && !inCell && (
            <button type="button" className="ub-action" onClick={handleMakeComponent} disabled={!canMake} title={canMake ? undefined : labels.makeComponentHint}>
              {labels.makeComponent}
            </button>
          )}
            </>
          )}
          {movable && layoutOnly?.connect && (
            <button type="button" className="ub-action" onClick={handleOwnConnect} disabled={!ownPair} title={ownPair ? undefined : labels.connectHint}>
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
        <input
          ref={backgroundInputRef}
          type="file"
          accept={BACKGROUND_IMAGE_TYPES.join(',')}
          onChange={handleBackgroundFile}
          style={{ display: 'none' }}
          data-testid="background-file-input"
        />
      </div>
      <FileError message={fileError} />
      <div className="ub-authoring__panes" style={{ display: 'flex', gap: 'var(--ub-space-4, 16px)', flex: 1, minHeight: 0 }}>
        <div className="ub-authoring__pane" style={paneStyle}>
          {mode === 'edit' ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={{ flex: 1, minHeight: 0 }} role="presentation" onKeyDown={handleEditorKey}>
              <KonvaDesigner
                ref={designerRef}
                width={width}
                height={height}
                scene={scene}
                transform={transform}
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
                transform={transform}
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
          ) : movable ? (
            (layoutOnly?.panel?.(selectedIds[0] ?? null) ?? <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>)
          ) : selectedConnector ? (
            <ConnectorPanel
              connector={selectedConnector}
              nodes={doc.nodes}
              nameOf={partNamer(doc, labels.locale)}
              onChange={handleConnectorChange}
              onDelete={handleDelete}
              adapters={adapters}
              connectorLabels={connectorLabels}
              labels={labels}
              clock={clock}
            />
          ) : selectedDecoration ? (
            <DecorationPanel decoration={selectedDecoration} onChange={handleDecorationChange} labels={labels} />
          ) : selectedInstance ? (
            <InstancePanel
              instance={selectedInstance}
              component={doc.components?.[selectedInstance.component]}
              onParamChange={(name, value) => updateDoc(prev => setInstanceParam(prev, selectedInstance.id, name, value))}
              onEditComponent={onEditComponent && (() => onEditComponent(selectedInstance.component))}
              onDetach={() => {
                updateDoc(prev => detachInstance(prev, selectedInstance.id));
                designerRef.current?.select([]);
                setSelectedIds([]);
              }}
              labels={labels}
            />
          ) : selectedNode ? (
            <PropertyPanel
              node={selectedNode}
              adapters={adapters}
              connectorLabels={connectorLabels}
              onChange={handleWidgetChange}
              onPartChange={handlePartChange}
              triggers={component ? undefined : triggerEditing(doc, updateDoc, labels.locale)}
              background={doc.background}
              onNodeChange={handleNodeChange}
              elements={doc.elements}
              labels={labels}
              clock={clock}
            />
          ) : component ? (
            <ComponentPanel
              key={component.name}
              name={component.name}
              params={component.params}
              instances={component.instances}
              onParamsChange={component.onParamsChange}
              onDone={component.onDone}
              labels={labels}
            />
          ) : (
            <BoardPanel
              hasBackground={!!doc.background.image}
              appearance={doc.appearance ?? 'light'}
              onChooseBackground={() => backgroundInputRef.current?.click()}
              onRemoveBackground={handleRemoveBackground}
              onAppearanceChange={handleAppearanceChange}
              accent={doc.accent}
              onAccentChange={handleAccentChange}
              triggers={triggerEditing(doc, updateDoc, labels.locale)}
              referencePoints={doc.background.image?.referencePoints}
              onReferencePointsChange={handleReferencePointsChange}
              anchors={
                anchorSnapshot
                  ? {
                      awaitingPoints: anchorSnapshot.byImage && !doc.background.image?.referencePoints,
                      moved: movedAnchors(doc, anchorSnapshot.snapshot).length,
                      onRelocate: () => {
                        updateDoc(prev => relocateAnchors(prev, anchorSnapshot.snapshot));
                        setAnchorSnapshot(null);
                      },
                      onKeep: () => setAnchorSnapshot(null),
                    }
                  : undefined
              }
              labels={labels}
            />
          )}
          {/* The board's elements and symbols are edited on the board, where every use of them is. */}
          {selectedIds.length === 0 && !component && !movable && <ElementsPanel doc={doc} updateDoc={updateDoc} labels={labels} />}
          {selectedIds.length === 0 && !component && !movable && <SymbolsPanel doc={doc} updateDoc={updateDoc} labels={labels} />}
        </div>
      </div>
    </>
  );
}

const NODE_IN_PLACE_STYLE: CSSProperties = { position: 'relative', width: '100%', height: '100%' };
// Above the node's box, so it never covers the widget; the tag is a hint, not part of the board.
const NODE_TAG_STYLE: CSSProperties = { position: 'absolute', left: 0, bottom: '100%', whiteSpace: 'nowrap' };

/** A node's widget drawn where the node is being edited, with the widget type named above it — what
 * tells two nodes apart, and what an unbound widget that draws nothing still shows. */
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
