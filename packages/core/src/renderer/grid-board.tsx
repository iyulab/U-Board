import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedGridItem, ResolvedGridView } from '../resolve-document.js';
import { GRID_COLUMNS, GRID_COLUMNS_MEDIUM, GRID_DEFAULT_SPAN, isCanvasItem } from '../view-document.js';
import type { QualityText } from '../quality-text.js';
import { NodeFrame } from './node-frame.js';
import { CanvasCell } from './canvas-cell.js';
import type { UBoardLabels } from '../labels.js';
import { elementNameOf } from '../elements/element-type.js';
import { elementListeners } from '../triggers.js';

/** Where a grid's width changes how it lays out — the width of the board's own container, not of the window:
 *  a board embedded in a narrow panel of a wide page lays out as a narrow one. */
export const GRID_MEDIUM_MIN_WIDTH = 600;
export const GRID_WIDE_MIN_WIDTH = 1024;

// Rules a style attribute cannot carry — the container queries — so the component brings them itself (React
// hoists and dedupes a `<style>` with `href` and `precedence`), and a grid lays out with or without the
// package stylesheet. Narrow: one item per row, in order. Medium: 6 columns, `spanMedium`. Wide: 12, `span`. From
// medium up an item spans `rowSpan` rows, and the items after it fill the rows beside it in order.
// Each item sits on a cell — a faint surface, translucent so it reads on light and dark paper alike — so an item
// in its normal state, which has no frame (ISA-101: normal is unmarked), still reads as one; and a cell keeps a
// height of its own, so a widget with nothing to show yet does not fold away with its quality mark. The row gap
// leaves room above each cell for that mark, which sits over the frame's top edge.
const GRID_CSS = `
.ub-grid { container-type: inline-size; height: 100%; overflow-y: auto; box-sizing: border-box; }
.ub-grid__items { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px 12px; padding: 24px 12px 12px; }
.ub-grid__item {
  grid-column: span 1; min-width: 0; min-height: 48px; box-sizing: border-box; padding: 8px; border-radius: 8px;
  background: var(--ub-grid-cell-bg, rgb(15 23 42 / 4%));
}
.ub-grid[data-appearance="dark"] .ub-grid__item { background: var(--ub-grid-cell-bg-dark, rgb(255 255 255 / 6%)); }
@container (min-width: ${GRID_MEDIUM_MIN_WIDTH}px) {
  .ub-grid__items { grid-template-columns: repeat(${GRID_COLUMNS_MEDIUM}, minmax(0, 1fr)); }
  .ub-grid__item { grid-column: span var(--_ub-span-medium); grid-row: span var(--_ub-row-span, 1); }
}
@container (min-width: ${GRID_WIDE_MIN_WIDTH}px) {
  .ub-grid__items { grid-template-columns: repeat(12, minmax(0, 1fr)); }
  .ub-grid__item { grid-column: span var(--_ub-span); }
}
`;

type SpanItem = Pick<ResolvedGridItem, 'span' | 'spanMedium' | 'rowSpan'>;

/**
 * The columns each item spans at full width and at medium width. An item without `spanMedium` takes its share of the
 * row it sits on at full width, so a row that fills the twelve columns fills the six: halved when every span on the
 * row is even; split into two medium rows when the row divides at its middle (four 3s → two rows of 3 + 3, 6 + 3 + 3 →
 * 6, then 3 + 3); otherwise shared out in proportion (7 + 5 → 4 + 2). Beside an item spanning rows, a row shares
 * what that item leaves. Where an item's own `spanMedium` lays the medium width out otherwise — on its row, or with no
 * room left beside it — the others take half their span, rounded up.
 */
export function gridSpans(items: readonly SpanItem[]): { span: number; spanMedium: number }[] {
  const spans = items.map(item => Math.min(GRID_COLUMNS, item.span ?? GRID_DEFAULT_SPAN));
  const medium = items.map((item, i) => item.spanMedium ?? Math.min(GRID_COLUMNS_MEDIUM, Math.ceil(spans[i] / 2)));
  // Columns an item from a row above still takes on each row, at each width.
  const heldWide: number[] = [];
  const heldMedium: number[] = [];
  wideRows(items, spans).forEach((row, r) => {
    const room = GRID_COLUMNS_MEDIUM - (heldMedium[r] ?? 0);
    // An item's own spanMedium, or one above that holds more of the medium row than the full row, lays the medium
    // width out differently: its rows are not these.
    if (row.some(i => items[i].spanMedium !== undefined) || room < row.length) {
      hold(row, r);
      return;
    }
    const total = row.reduce((sum, i) => sum + spans[i], 0);
    const fills = total === GRID_COLUMNS - (heldWide[r] ?? 0);
    const shared = shareRow(row.map(i => spans[i]), fills ? room : Math.min(room, Math.round(total / 2)));
    row.forEach((i, k) => (medium[i] = shared[k]));
    hold(row, r);
  });
  return spans.map((span, i) => ({ span, spanMedium: medium[i] }));

  function hold(row: number[], r: number) {
    for (const i of row) {
      for (let below = r + 1; below < r + Math.max(1, items[i].rowSpan ?? 1); below++) {
        heldWide[below] = (heldWide[below] ?? 0) + spans[i];
        heldMedium[below] = (heldMedium[below] ?? 0) + medium[i];
      }
    }
  }
}

/** The items' indexes by the row each starts on at full width — CSS grid's auto-placement, an item spanning `rowSpan`
 *  rows keeping its columns taken on the rows below it. A row no item starts on is empty. */
function wideRows(items: readonly SpanItem[], spans: readonly number[]): number[][] {
  const taken: boolean[][] = [];
  const free = (row: number, column: number, span: number, rows: number) => {
    for (let r = row; r < row + rows; r++) for (let c = column; c < column + span; c++) if (taken[r]?.[c]) return false;
    return true;
  };
  const rows: number[][] = [];
  let row = 0;
  let column = 0;
  items.forEach((item, i) => {
    const span = spans[i];
    const height = Math.max(1, item.rowSpan ?? 1);
    for (;;) {
      if (column + span > GRID_COLUMNS) {
        row++;
        column = 0;
      } else if (free(row, column, span, height)) break;
      else column++;
    }
    for (let r = row; r < row + height; r++) for (let c = column; c < column + span; c++) (taken[r] ??= [])[c] = true;
    (rows[row] ??= []).push(i);
    column += span;
  });
  return Array.from(rows, row => row ?? []);
}

/** One full-width row's spans as `columns` medium columns (see `gridSpans`). */
function shareRow(spans: readonly number[], columns: number): number[] {
  if (spans.length === 0) return [];
  const total = spans.reduce((a, b) => a + b, 0);
  if (spans.every(span => span % 2 === 0) && total / 2 <= columns) return spans.map(span => span / 2);
  if (spans.length > 1 && total % 2 === 0 && columns === GRID_COLUMNS_MEDIUM) {
    let sum = 0;
    const cut = spans.findIndex(span => (sum += span) === total / 2);
    if (cut >= 0 && cut < spans.length - 1) return [...proportion(spans.slice(0, cut + 1), columns), ...proportion(spans.slice(cut + 1), columns)];
  }
  return proportion(spans, Math.max(spans.length, columns));
}

/** `columns` shared out over `spans` in proportion, each at least one — the largest remainders take what is left,
 *  the wider item first on a tie. */
function proportion(spans: readonly number[], columns: number): number[] {
  const total = spans.reduce((a, b) => a + b, 0);
  const exact = spans.map(span => (span * columns) / total);
  const shares = exact.map(value => Math.max(1, Math.floor(value)));
  let left = columns - shares.reduce((a, b) => a + b, 0);
  const order = spans.map((_, i) => i).sort((a, b) => exact[b] - Math.floor(exact[b]) - (exact[a] - Math.floor(exact[a])) || spans[b] - spans[a] || a - b);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) shares[order[k]]++;
  for (let k = order.length - 1; left < 0 && k >= 0; k--) {
    const i = order[k];
    if (shares[i] > 1) {
      shares[i]--;
      left++;
    }
  }
  return shares;
}

export interface GridBoardProps {
  doc: ResolvedGridView;
  /** Accessible name of the board — e.g. its name. */
  ariaLabel: string;
  /** Words for each item's connection-quality tooltip, mark and announcement (English by default). */
  qualityText?: QualityText;
  /** The time a stale value's age is measured to, in epoch milliseconds. */
  now: number;
  /** The language the widgets speak (BCP 47). */
  locale?: string;
  /** Words for a canvas cell's zoom buttons, its name and the line its wheel shows (English by default). */
  labels?: Pick<UBoardLabels, 'zoomIn' | 'zoomOut' | 'fitToView' | 'canvasCell' | 'wheelZoomHint'>;
  /** What each cell holds, given the item and its frame — the frame by default. The editor wraps it to make the item
   *  selectable; a viewer has no reason to. */
  renderCell?: (item: ResolvedGridItem, frame: ReactNode, index: number) => ReactNode;
  /** Whether a canvas cell has its zoom buttons — off where the grid is shown, not used (an editor). Default true. */
  canvasControls?: boolean;
  /** The items a click does something on (`Triggers.activatable`), and what it does. */
  activatable?: ReadonlySet<string>;
  onItemActivate?: (item: string) => void;
  /** An event an item's element raised. */
  onElementEvent?: (item: string, name: string) => void;
}

/**
 * A grid view as a board shows it: its items in order, each in a cell as wide as its span, rows as tall as
 * their tallest item — an item without a height takes its widget's own (a canvas cell, its canvas's proportions), and
 * the others in its row stretch to match. The grid has no pan or zoom: it reads at any width, and scrolls when it is
 * taller than its container. A canvas cell pans and zooms within itself (`CanvasCell`).
 */
/** The height an item placing an element takes when it gives none: the element's own. A prepared widget has its own
 *  height already; an element's isolated root has none to offer the row, so its definition says it. */
function elementHeight(doc: ResolvedGridView, item: ResolvedGridItem): number | undefined {
  if (isCanvasItem(item)) return undefined;
  const name = elementNameOf(item.widget.type);
  return name === undefined ? undefined : doc.elements?.[name]?.size?.height;
}

export function GridBoard({ doc, ariaLabel, qualityText, now, locale, labels, renderCell, canvasControls, activatable, onItemActivate, onElementEvent }: GridBoardProps) {
  const listened = onElementEvent ? elementListeners(doc.triggers) : undefined;
  const spans = gridSpans(doc.items);
  return (
    <div className="ub-grid" role="region" aria-label={ariaLabel} data-appearance={doc.appearance ?? 'light'}>
      <style href="u-board-grid" precedence="u-board">
        {GRID_CSS}
      </style>
      <div className="ub-grid__items">
        {doc.items.map((item, index) => {
          const { span, spanMedium } = spans[index];
          const style = { '--_ub-span': span, '--_ub-span-medium': spanMedium, ...(item.rowSpan !== undefined && { '--_ub-row-span': item.rowSpan }), height: item.height ?? elementHeight(doc, item) } as CSSProperties;
          return (
            <div key={item.id} className="ub-grid__item" data-item-id={item.id} style={style}>
              {(renderCell ?? ((_item, frame) => frame))(
                item,
                isCanvasItem(item) ? <CanvasCell doc={doc} item={item} qualityText={qualityText} now={now} locale={locale} labels={labels} activatable={activatable} onNodeActivate={onItemActivate} onElementEvent={onElementEvent} controls={canvasControls} /> : <NodeFrame widget={item.widget} appearance={doc.appearance} accent={doc.accent} symbols={doc.symbols} qualityText={qualityText} now={now} locale={locale} elements={doc.elements} state={item.state} looks={item.states?.looks} onActivate={onItemActivate && activatable?.has(item.id) ? () => onItemActivate(item.id) : undefined} onElementEvent={onElementEvent && (name => onElementEvent(item.id, name))} elementEvents={listened?.get(item.id)} />,
                index
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
