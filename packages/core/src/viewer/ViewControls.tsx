import type { FittedView } from './use-fitted-view.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { GROUP_STYLE } from '../ui-style.js';

export interface ViewControlsProps {
  view: FittedView;
  /** Fits the document into view; omitted when there is nothing to fit (an empty document). */
  onFit?: () => void;
  labels?: Pick<UBoardLabels, 'zoomIn' | 'zoomOut' | 'fitToView'>;
}

/**
 * Zoom out / zoom in / fit buttons for a board view — what the wheel and drag do, operable from the
 * keyboard too (WCAG 2.1.1). Zooming steps around the middle of the view and is disabled at the
 * zoom bounds.
 */
export function ViewControls({ view, onFit, labels = DEFAULT_LABELS }: ViewControlsProps) {
  return (
    <span className="ub-view-controls" style={GROUP_STYLE}>
      <button
        type="button"
        className="ub-action ub-action--icon"
        aria-label={labels.zoomOut}
        title={labels.zoomOut}
        onClick={view.zoomOut}
        disabled={!view.canZoomOut}
      >
        −
      </button>
      <button
        type="button"
        className="ub-action ub-action--icon"
        aria-label={labels.zoomIn}
        title={labels.zoomIn}
        onClick={view.zoomIn}
        disabled={!view.canZoomIn}
      >
        +
      </button>
      {onFit && (
        <button type="button" className="ub-action" onClick={onFit}>
          {labels.fitToView}
        </button>
      )}
    </span>
  );
}
