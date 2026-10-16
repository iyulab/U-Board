import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties } from 'react';
import { resolveDocument, type ResolvedGridView } from '../resolve-document.js';
import type { ResolvedWidget } from '../adapter.js';
import type { GridView, Widget } from '../view-document.js';
import { GridBoard, GRID_MEDIUM_MIN_WIDTH, GRID_WIDE_MIN_WIDTH } from '../renderer/grid-board.js';
import { AttributionLine, boardAttributions } from '../viewer/attribution.js';
import { TOOLBAR_STYLE, GROUP_STYLE } from '../ui-style.js';
import { PropertyPanel } from './PropertyPanel.js';
import { BoardPanel } from './BoardPanel.js';
import { ElementsPanel } from './ElementsPanel.js';
import { SymbolsPanel } from './SymbolsPanel.js';
import { GridItemPanel } from './GridItemPanel.js';
import { seedWidget, widgetTypeName } from './widget-catalog.js';
import { addGridItem, moveGridItem, newGridItemId, removeGridItem, updateGridItem } from './grid-editing.js';
import { FileError, ModeSwitch, type KindEditorProps } from './editor-parts.js';

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
// Above the cell's top-right corner — the quality mark takes the top-left one.
const TAG_STYLE: CSSProperties = { position: 'absolute', right: 0, bottom: '100%', marginBottom: 6, whiteSpace: 'nowrap' };

/** A widget not resolved yet — its own props, no quality — so a new or changed item shows at once. */
const unresolved = (widget: Widget): ResolvedWidget => ({ type: widget.type, props: widget.props ?? {}, quality: {} });

/**
 * The editor of a grid view: its items in order, laid out as the viewer lays them out, beside a panel for the
 * selected item — its room and place, then its widget — or, with nothing selected, the board's settings. "Add
 * item" puts a new item after the selected one. The layout width lays the grid out as a medium or a narrow screen
 * will, so the author sees each.
 */
export function GridAuthoring({ doc, updateDoc, mode, onModeChange, fileActions, fileError, adapters, width, height, connectorLabels, labels, clock }: KindEditorProps<GridView>) {
  const readClock = useEffectEvent(() => clock());
  const [preview, setPreview] = useState<{ doc: ResolvedGridView; now: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Where each item is, how much room it takes and which widget it is come from the document as edited now; only
  // what a widget shows waits for its bindings, so a moved or resized item does not lag behind a slow source.
  const shown = useMemo<ResolvedGridView>(() => {
    const resolved = new Map(preview?.doc.items.map(item => [item.id, item.widget]));
    return {
      ...doc,
      items: doc.items.map(item => {
        const widget = resolved.get(item.id);
        return { ...item, widget: widget && widget.type === item.widget.type ? widget : unresolved(item.widget) };
      }),
    };
  }, [doc, preview]);

  const selectedIndex = doc.items.findIndex(item => item.id === selectedId);
  const selected = selectedIndex >= 0 ? doc.items[selectedIndex] : null;

  const handleAddItem = () => {
    const item = { id: newGridItemId(), widget: seedWidget('status', { label: labels.newNodeLabel, value: labels.newNodeValue }) };
    updateDoc(current => addGridItem(current, item, selectedId));
    setSelectedId(item.id);
  };

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
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={handleAddItem}>
            {labels.addItem}
          </button>
        </div>
        {fileActions}
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
      <FileError message={fileError} />
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
                renderCell={(item, frame, index) => {
                  const name = widgetTypeName(item.widget.type, labels.locale);
                  const picked = item.id === selectedId;
                  return (
                    <div className="ub-authoring__node" style={CELL_STYLE}>
                      <div style={FRAME_STYLE}>{frame}</div>
                      <span className="ub-authoring__node-tag" style={TAG_STYLE}>
                        {name}
                      </span>
                      <button
                        type="button"
                        className="ub-authoring__pick"
                        aria-label={`${index + 1}. ${name}`}
                        aria-pressed={picked}
                        style={picked ? PICKED_STYLE : PICK_STYLE}
                        onClick={() => setSelectedId(picked ? null : item.id)}
                      />
                    </div>
                  );
                }}
              />
            </div>
          ) : preview ? (
            <div className="ub-authoring__surface" data-appearance={doc.appearance ?? 'light'} style={surfaceStyle}>
              <GridBoard doc={preview.doc} ariaLabel={labels.previewRegion} qualityText={labels.qualityText} now={preview.now} locale={labels.locale} />
            </div>
          ) : (
            <p className="ub-authoring__status">{labels.resolving}</p>
          )}
          {mode === 'view' && preview && <AttributionLine attributions={attributions} labels={labels} />}
        </div>
        <div className="ub-authoring__panel" style={{ flex: '0 0 var(--ub-panel-width, 320px)', minWidth: 0, overflowY: 'auto' }}>
          {selected ? (
            <>
              <GridItemPanel
                item={selected}
                isFirst={selectedIndex === 0}
                isLast={selectedIndex === doc.items.length - 1}
                onChange={change => updateDoc(current => updateGridItem(current, selected.id, change))}
                onMove={by => updateDoc(current => moveGridItem(current, selected.id, by))}
                onRemove={handleRemove}
                labels={labels}
              />
              <PropertyPanel
                node={selected}
                adapters={adapters}
                connectorLabels={connectorLabels}
                onChange={widget => updateDoc(current => updateGridItem(current, selected.id, { widget }))}
                elements={doc.elements}
                labels={labels}
                clock={clock}
              />
            </>
          ) : (
            <BoardPanel
              appearance={doc.appearance ?? 'light'}
              onAppearanceChange={appearance =>
                updateDoc(current => {
                  const { appearance: _appearance, ...rest } = current;
                  return appearance === 'dark' ? { ...rest, appearance } : rest;
                })
              }
              accent={doc.accent}
              onAccentChange={accent =>
                updateDoc(current => {
                  const { accent: _accent, ...rest } = current;
                  return accent === undefined ? rest : { ...rest, accent };
                })
              }
              hint={labels.selectItem}
              labels={labels}
            />
          )}
          {!selected && <ElementsPanel doc={doc} updateDoc={updateDoc} labels={labels} />}
          {!selected && <SymbolsPanel doc={doc} updateDoc={updateDoc} labels={labels} />}
        </div>
      </div>
    </>
  );
}
