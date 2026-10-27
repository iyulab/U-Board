import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from 'react';
import { resolveDocument, type ResolvedCellCanvas, type ResolvedGridView } from '@iyulab/u-board/toolkit';
import type { ResolvedWidget } from '@iyulab/u-board/toolkit';
import { isCanvasItem, type CellCanvas, type GridView, type Widget } from '@iyulab/u-board/picture';
import { GridBoard, GRID_MEDIUM_MIN_WIDTH, GRID_WIDE_MIN_WIDTH } from '@iyulab/u-board/toolkit';
import { AttributionLine, boardAttributions, showsExampleData } from '@iyulab/u-board/toolkit';
import { focusPart, useTriggers } from '@iyulab/u-board/toolkit';
import { TOOLBAR_STYLE, GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { GridItemPanel } from './GridItemPanel.js';
import { widgetTypeName } from './widget-catalog.js';
import { gridItemIndex, moveGridItem, removeGridItem, updateGridItem } from '../editing/grid-editing.js';
import { ModeSwitch, type KindEditorProps } from './editor-parts.js';

/** The widths the editor can lay a grid out at — one inside each of the grid's three bands. */
type LayoutWidth = 'wide' | 'medium' | 'narrow';
const LAYOUT_MAX_WIDTH: Record<LayoutWidth, number | undefined> = {
  wide: undefined,
  medium: GRID_WIDE_MIN_WIDTH - 1,
  narrow: GRID_MEDIUM_MIN_WIDTH - 1,
};

const CELL_STYLE: CSSProperties = { position: 'relative', width: '100%', height: '100%' };
// The item's widget is shown, not used, while editing: a press anywhere on the cell selects the item.
const FRAME_STYLE: CSSProperties = { width: '100%', height: '100%', pointerEvents: 'none' };
const PICK_STYLE: CSSProperties = {
  position: 'absolute',
  inset: -4,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: 10,
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
};
const PICKED_STYLE: CSSProperties = { ...PICK_STYLE, borderColor: 'var(--_ub-brand-solid, var(--ub-brand-solid, #2563eb))' };
// Where a dragged item would go: the item it is held over, whose place it takes.
const DROP_STYLE: CSSProperties = { ...PICK_STYLE, borderStyle: 'dashed', borderColor: 'var(--_ub-brand-solid, var(--ub-brand-solid, #2563eb))' };
// Above the cell's top-right corner — the quality mark takes the top-left one.
const TAG_STYLE: CSSProperties = { position: 'absolute', right: 0, bottom: '100%', marginBottom: 6, whiteSpace: 'nowrap' };

/** A widget not resolved yet — its own props, no quality — so a new or changed item shows at once. */
const unresolved = (widget: Widget): ResolvedWidget => ({ type: widget.type, props: widget.props ?? {}, quality: {} });
/** A canvas cell as edited now, each node showing what its widget read when it was last resolved — as a widget item
 *  does — and its connectors as written. */
function shownCanvas(canvas: CellCanvas, resolved: ResolvedCellCanvas | undefined): ResolvedCellCanvas {
  const read = new Map(resolved?.nodes.map(node => [node.id, node.widget]));
  return {
    ...canvas,
    nodes: canvas.nodes.map(node => {
      const widget = read.get(node.id);
      return { ...node, widget: widget && widget.type === node.widget.type ? widget : unresolved(node.widget) };
    }),
    connectors: canvas.connectors.map(connector => ({ ...connector, quality: {} })),
  };
}

/**
 * The grid of a board being edited, drawn from its picture: its items in order, laid out as the viewer lays them out,
 * beside a panel for the selected item — its room and place, then what `parts.panel` draws for it — or, with nothing
 * selected, what `parts.panel` draws for the board. The layout width lays the grid out as a medium or a narrow screen
 * will, so the author sees each.
 */
export interface GridAuthoringProps extends KindEditorProps<GridView> {
  /** Opens a canvas cell's canvas in the canvas editor. */
  onEditCanvas?: (id: string) => void;
}

export function GridAuthoring({ doc, updateDoc, mode, onModeChange, documentActions, adapters, width, height, labels, clock, triggerHosting, onEditCanvas, parts }: GridAuthoringProps) {
  const { movable } = parts;
  const readClock = useEffectEvent(() => clock());
  const [preview, setPreview] = useState<{ doc: ResolvedGridView; now: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // An item being dragged to another place, and the item it is held over.
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<string | null>(null);
  const [layoutWidth, setLayoutWidth] = useState<LayoutWidth>('wide');

  useEffect(() => {
    let cancelled = false;
    resolveDocument(doc, adapters).then(resolved => {
      if (!cancelled) setPreview({ doc: resolved, now: readClock() });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters]);
  const attributions = useMemo(() => boardAttributions(doc, adapters), [doc, adapters]);
  const example = useMemo(() => showsExampleData(doc, adapters), [doc, adapters]);
  // The board's triggers run in View only, as a shared link runs them; in Edit a click selects.
  const surface = useRef<HTMLDivElement>(null);
  const shownDoc = mode === 'view' ? (preview?.doc ?? null) : null;
  const focus = useCallback((node: string) => focusPart(shownDoc, node, () => {}, surface.current), [shownDoc]);
  const { activatable, activate, elementEvent } = useTriggers(doc, shownDoc, { ...triggerHosting, focus });

  // Where each item is, how much room it takes and which widget it is come from the document as edited now; only
  // what a widget shows waits for its bindings, so a moved or resized item does not lag behind a slow source.
  const shown = useMemo<ResolvedGridView>(() => {
    const resolved = new Map(preview?.doc.items.map(item => [item.id, item]));
    return {
      ...doc,
      items: doc.items.map(item => {
        const before = resolved.get(item.id);
        if (isCanvasItem(item)) return { ...item, canvas: shownCanvas(item.canvas, before && isCanvasItem(before) ? before.canvas : undefined) };
        const widget = before && !isCanvasItem(before) ? before.widget : undefined;
        return { ...item, widget: widget && widget.type === item.widget.type ? widget : unresolved(item.widget) };
      }),
    };
  }, [doc, preview]);

  const selectedIndex = doc.items.findIndex(item => item.id === selectedId);
  const selected = selectedIndex >= 0 ? doc.items[selectedIndex] : null;

  const handleRemove = () => {
    if (!selected) return;
    updateDoc(current => removeGridItem(current, selected.id));
    setSelectedId(null);
  };

  const handleViewMode = () => {
    onModeChange('view');
    setSelectedId(null);
  };

  const followsContainer = width === undefined || height === undefined;
  const paneStyle: CSSProperties = followsContainer ? { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' } : { display: 'flex', flexDirection: 'column' };
  const surfaceStyle: CSSProperties = { flex: 1, minHeight: 0, width, height, maxWidth: mode === 'edit' ? LAYOUT_MAX_WIDTH[layoutWidth] : undefined };

  return (
    <>
      <div className="ub-authoring__toolbar" style={TOOLBAR_STYLE}>
        {documentActions}
        <ModeSwitch mode={mode} onEdit={() => onModeChange('edit')} onView={handleViewMode} labels={labels} />
        {mode === 'edit' && (
          <div className="ub-authoring__group ub-authoring__layout-width" style={GROUP_STYLE} role="group" aria-label={labels.layoutWidth}>
            {(['wide', 'medium', 'narrow'] as const).map(choice => (
              <button key={choice} type="button" className="ub-action" aria-pressed={layoutWidth === choice} onClick={() => setLayoutWidth(choice)}>
                {choice === 'wide' ? labels.layoutWide : choice === 'medium' ? labels.layoutMedium : labels.layoutNarrow}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="ub-authoring__panes" style={{ display: 'flex', gap: 'var(--ub-space-4, 16px)', flex: 1, minHeight: 0 }}>
        <div className="ub-authoring__pane" style={paneStyle}>
          {mode === 'edit' ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={surfaceStyle}>
              <GridBoard
                doc={shown}
                ariaLabel={labels.editorRegion}
                qualityText={labels.qualityText}
                now={preview?.now ?? 0}
                locale={labels.locale}
                labels={labels}
                canvasControls={false}
                renderCell={(item, frame, index) => {
                  const name = isCanvasItem(item) ? labels.canvasCell : widgetTypeName(item.widget.type, labels.locale);
                  const picked = item.id === selectedId;
                  return (
                    <div className="ub-authoring__node" style={CELL_STYLE}>
                      <div style={FRAME_STYLE}>{frame}</div>
                      <span className="ub-authoring__node-tag" style={TAG_STYLE}>
                        {name}
                      </span>
                      {/* Pressed, it selects the item; dragged onto another, it moves there (the panel moves it a place at a time,
                          by keyboard too). */}
                      <button
                        type="button"
                        className="ub-authoring__pick"
                        aria-label={`${index + 1}. ${name}`}
                        aria-pressed={picked}
                        style={dropOn === item.id ? DROP_STYLE : picked ? PICKED_STYLE : PICK_STYLE}
                        onClick={() => setSelectedId(picked ? null : item.id)}
                        draggable={movable(item.id)}
                        onDragStart={e => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', item.id);
                          setDragged(item.id);
                        }}
                        onDragOver={e => {
                          if (!dragged || dragged === item.id || !movable(item.id)) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDropOn(item.id);
                        }}
                        onDragLeave={() => setDropOn(on => (on === item.id ? null : on))}
                        onDrop={e => {
                          e.preventDefault();
                          if (dragged) {
                            const moving = dragged;
                            updateDoc(current => moveGridItem(current, moving, gridItemIndex(current, item.id)));
                            setSelectedId(moving);
                          }
                          setDragged(null);
                          setDropOn(null);
                        }}
                        onDragEnd={() => {
                          setDragged(null);
                          setDropOn(null);
                        }}
                      />
                    </div>
                  );
                }}
              />
            </div>
          ) : preview ? (
            <div ref={surface} className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={surfaceStyle}>
              <GridBoard
                doc={preview.doc}
                ariaLabel={labels.previewRegion}
                qualityText={labels.qualityText}
                now={preview.now}
                locale={labels.locale}
                labels={labels}
                activatable={activatable}
                onItemActivate={activate}
                onElementEvent={elementEvent}
              />
            </div>
          ) : (
            <p className="ub-authoring__status">{labels.resolving}</p>
          )}
          {mode === 'view' && preview && <AttributionLine attributions={attributions} example={example} labels={labels} />}
        </div>
        <div className="ub-authoring__panel" style={{ flex: '0 0 var(--ub-panel-width, 320px)', minWidth: 0, overflowY: 'auto' }}>
          {selected ? (
            <>
              {movable(selected.id) && (
              <GridItemPanel
                item={selected}
                isFirst={selectedIndex === 0}
                isLast={selectedIndex === doc.items.length - 1}
                onChange={change => updateDoc(current => updateGridItem(current, selected.id, change))}
                onMove={by => updateDoc(current => moveGridItem(current, selected.id, gridItemIndex(current, selected.id) + by))}
                                onRemove={handleRemove}
                spanOnly
                labels={labels}
              />
              )}
              {(parts.panel(selected.id) ?? <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>)}
              {isCanvasItem(selected) && onEditCanvas && (
                <button type="button" className="ub-action ub-action--primary" onClick={() => onEditCanvas(selected.id)}>
                  {labels.editCanvas}
                </button>
              )}
            </>
          ) : (
            (parts.panel(null) ?? <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>)
          )}
        </div>
      </div>
    </>
  );
}
