import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import type { GridItem } from '@iyulab/u-board/picture';
import { GRID_COLUMNS, GRID_COLUMNS_MEDIUM, GRID_DEFAULT_SPAN, GRID_MAX_ROW_SPAN, isCanvasItem } from '@iyulab/u-board/picture';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';

const ACTIONS_STYLE = { ...GROUP_STYLE, marginBottom: 'var(--ub-space-3, 12px)' };
const columns = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

export interface GridItemPanelProps {
  item: GridItem;
  /** Whether it can move earlier or later — not at the start or the end of the order. */
  isFirst: boolean;
  isLast: boolean;
  onChange: (change: Partial<Pick<GridItem, 'span' | 'spanMedium' | 'rowSpan' | 'height'>>) => void;
  onMove: (by: -1 | 1) => void;
  /** Left out, there is no Duplicate (an editor that adds nothing). */
  onDuplicate?: () => void;
  onRemove: () => void;
  /** Only the columns it spans — what a board lays out. */
  spanOnly?: boolean;
  labels?: DesignerLabels;
}

/**
 * A grid item's room and place: how many columns it spans at full and at medium width, its height, and where it
 * is in the order. Moving and removing are buttons, so they are a key press as well as a click. A choice left at
 * its default leaves its field out of the document.
 */
export function GridItemPanel({ item, isFirst, isLast, onChange, onMove, onDuplicate, onRemove, spanOnly = false, labels = DEFAULT_DESIGNER_LABELS }: GridItemPanelProps) {
  const span = item.span ?? GRID_DEFAULT_SPAN;
  return (
    <div className="ub-panel ub-panel--item">
      <h2 className="ub-panel__heading">{labels.itemLayout}</h2>
      <div className="ub-panel__actions" style={ACTIONS_STYLE}>
        <button type="button" className="ub-action" disabled={isFirst} onClick={() => onMove(-1)}>
          {labels.moveEarlier}
        </button>
        <button type="button" className="ub-action" disabled={isLast} onClick={() => onMove(1)}>
          {labels.moveLater}
        </button>
        {onDuplicate && (
          <button type="button" className="ub-action" onClick={onDuplicate}>
            {labels.duplicateItem}
          </button>
        )}
        <button type="button" className="ub-action" onClick={onRemove}>
          {labels.removeItem}
        </button>
      </div>
      <label className="ub-panel__field">
        {labels.itemSpan.replace('{columns}', String(GRID_COLUMNS))}
        <select
          value={span}
          onChange={e => {
            const value = Number(e.target.value);
            onChange({ span: value === GRID_DEFAULT_SPAN ? undefined : value });
          }}
        >
          {columns(GRID_COLUMNS).map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {!spanOnly && (
        <>
      <label className="ub-panel__field">
        {labels.itemSpanMedium.replace('{columns}', String(GRID_COLUMNS_MEDIUM))}
        <select value={item.spanMedium ?? ''} onChange={e => onChange({ spanMedium: e.target.value === '' ? undefined : Number(e.target.value) })}>
          <option value="">{labels.itemSpanMediumAuto}</option>
          {columns(GRID_COLUMNS_MEDIUM).map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field">
        {labels.itemRowSpan}
        <select value={item.rowSpan ?? 1} onChange={e => onChange({ rowSpan: Number(e.target.value) === 1 ? undefined : Number(e.target.value) })}>
          {columns(GRID_MAX_ROW_SPAN).map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field">
        {labels.itemHeight}
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder={isCanvasItem(item) ? labels.canvasHeightAuto : labels.itemHeightAuto}
          value={item.height ?? ''}
          onChange={e => {
            const value = e.target.valueAsNumber;
            onChange({ height: Number.isFinite(value) && value > 0 ? value : undefined });
          }}
        />
      </label>
        </>
      )}
    </div>
  );
}
