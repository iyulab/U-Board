import type { CSSProperties } from 'react';
import type { FittedView } from './use-fitted-view.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';

export interface ViewControlsProps {
  view: FittedView;
  /** Fits the document into view; omitted when there is nothing to fit (an empty document). */
  onFit?: () => void;
  buttonStyle?: CSSProperties;
  labels?: Pick<UBoardLabels, 'zoomIn' | 'zoomOut' | 'fitToView'>;
}

/**
 * Zoom out / zoom in / fit buttons for a board view — what the wheel and drag do, operable from the
 * keyboard too (WCAG 2.1.1). Zooming steps around the middle of the view and is disabled at the
 * zoom bounds.
 */
export function ViewControls({ view, onFit, buttonStyle, labels = DEFAULT_LABELS }: ViewControlsProps) {
  return (
    <>
      <button
        type="button"
        aria-label={labels.zoomOut}
        title={labels.zoomOut}
        onClick={view.zoomOut}
        disabled={!view.canZoomOut}
        style={buttonStyle}
      >
        −
      </button>
      <button
        type="button"
        aria-label={labels.zoomIn}
        title={labels.zoomIn}
        onClick={view.zoomIn}
        disabled={!view.canZoomIn}
        style={buttonStyle}
      >
        +
      </button>
      {onFit && (
        <button type="button" onClick={onFit} style={buttonStyle}>
          {labels.fitToView}
        </button>
      )}
    </>
  );
}
