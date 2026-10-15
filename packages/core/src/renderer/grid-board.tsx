import type { CSSProperties } from 'react';
import type { ResolvedGridItem, ResolvedGridView } from '../resolve-document.js';
import { GRID_COLUMNS_MEDIUM, GRID_DEFAULT_SPAN } from '../view-document.js';
import type { QualityText } from '../quality-text.js';
import { NodeFrame } from './node-frame.js';

/** Where a grid's width changes how it lays out — the width of the board's own container, not of the window:
 *  a board embedded in a narrow panel of a wide page lays out as a narrow one. */
export const GRID_MEDIUM_MIN_WIDTH = 600;
export const GRID_WIDE_MIN_WIDTH = 1024;

// Rules a style attribute cannot carry — the container queries — so the component brings them itself (React
// hoists and dedupes a `<style>` with `href` and `precedence`), and a grid lays out with or without the
// package stylesheet. Narrow: one item per row, in order. Medium: 6 columns, `spanMedium`. Wide: 12, `span`.
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
  .ub-grid__item { grid-column: span var(--_ub-span-medium); }
}
@container (min-width: ${GRID_WIDE_MIN_WIDTH}px) {
  .ub-grid__items { grid-template-columns: repeat(12, minmax(0, 1fr)); }
  .ub-grid__item { grid-column: span var(--_ub-span); }
}
`;

/** The columns an item spans at full width and at medium width. */
export function gridSpans(item: Pick<ResolvedGridItem, 'span' | 'spanMedium'>): { span: number; spanMedium: number } {
  const span = item.span ?? GRID_DEFAULT_SPAN;
  return { span, spanMedium: item.spanMedium ?? Math.min(GRID_COLUMNS_MEDIUM, Math.ceil(span / 2)) };
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
}

/**
 * A grid view as a board shows it: its items in order, each in a cell as wide as its span, rows as tall as
 * their tallest item — an item without a height takes its widget's own, and the others in its row stretch
 * to match. No pan or zoom: a grid reads at any width, and scrolls when it is taller than its container.
 */
export function GridBoard({ doc, ariaLabel, qualityText, now, locale }: GridBoardProps) {
  return (
    <div className="ub-grid" role="region" aria-label={ariaLabel} data-appearance={doc.appearance ?? 'light'}>
      <style href="u-board-grid" precedence="u-board">
        {GRID_CSS}
      </style>
      <div className="ub-grid__items">
        {doc.items.map(item => {
          const { span, spanMedium } = gridSpans(item);
          const style = { '--_ub-span': span, '--_ub-span-medium': spanMedium, height: item.height } as CSSProperties;
          return (
            <div key={item.id} className="ub-grid__item" data-item-id={item.id} style={style}>
              <NodeFrame widget={item.widget} appearance={doc.appearance} qualityText={qualityText} now={now} locale={locale} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
