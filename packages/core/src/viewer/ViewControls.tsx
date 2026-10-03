import type { CSSProperties } from 'react';
import type { FittedView } from './use-fitted-view.js';

export interface ViewControlsProps {
  view: FittedView;
  /** Fits the document into view; omitted when there is nothing to fit (an empty document). */
  onFit?: () => void;
  buttonStyle?: CSSProperties;
}

/**
 * Zoom out / zoom in / fit buttons for a board view — what the wheel and drag do, operable from the
 * keyboard too (WCAG 2.1.1). Zooming steps around the middle of the view and is disabled at the
 * zoom bounds.
 */
export function ViewControls({ view, onFit, buttonStyle }: ViewControlsProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={view.zoomOut}
        disabled={!view.canZoomOut}
        style={buttonStyle}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={view.zoomIn}
        disabled={!view.canZoomIn}
        style={buttonStyle}
      >
        +
      </button>
      {onFit && (
        <button type="button" onClick={onFit} style={buttonStyle}>
          Fit to view
        </button>
      )}
    </>
  );
}
