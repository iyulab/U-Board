import { useCallback, useRef, useState } from 'react';
import { fitTransform, zoomAt } from '@canvas-kit/core';
import type { Transform, Size } from '@canvas-kit/core';
import { DOCUMENT_FIT_OPTIONS, type DocumentRect } from './document-extent.js';

const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };
// canvas-kit's own default zoom bounds — the wheel, the zoom controls and a fit all stay within them.
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
// One press of a zoom control.
const ZOOM_STEP = 1.25;

export interface FittedView {
  /** The transform to render with (pass it to a controlled canvas-kit Viewer/KonvaDesigner). */
  transform: Transform;
  /** Fits `rect` into view and keeps it fitted as the viewport resizes, until the user moves the
   * view. `null` (nothing to show) leaves the view as it is. */
  fitTo(rect: DocumentRect | null): void;
  /** Wire to the canvas's `onViewportResize`. */
  onViewportResize(size: Size): void;
  /** Wire to the canvas's `onTransformChange` — a pan or zoom by the user, which ends following. */
  onUserTransform(transform: Transform): void;
  /** One zoom step in or out around the middle of the view — the keyboard-operable counterpart of
   * the wheel. Like any user move, it ends following. */
  zoomIn(): void;
  zoomOut(): void;
  /** Whether a step is still possible before the zoom bounds. */
  canZoomIn: boolean;
  canZoomOut: boolean;
}

/**
 * Owns a view transform that keeps a target rect fitted (shrunk to fit, never magnified —
 * `DOCUMENT_FIT_OPTIONS`) as the viewport resizes — a window resized, a tablet rotated, a panel
 * dragged — until the user pans or zooms; from then on the view is theirs until the next fit.
 */
export function useFittedView(): FittedView {
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const viewportRef = useRef<Size | null>(null);
  const targetRef = useRef<DocumentRect | null>(null);

  const applyFit = useCallback(() => {
    const viewport = viewportRef.current;
    const target = targetRef.current;
    if (!viewport || !target) return;
    setTransform(fitTransform(viewport, target, { ...DOCUMENT_FIT_OPTIONS, minScale: MIN_SCALE }));
  }, []);

  const fitTo = useCallback((rect: DocumentRect | null) => {
    targetRef.current = rect;
    applyFit();
  }, [applyFit]);

  const onViewportResize = useCallback((size: Size) => {
    viewportRef.current = size;
    applyFit();
  }, [applyFit]);

  const onUserTransform = useCallback((next: Transform) => {
    targetRef.current = null;
    setTransform(next);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    targetRef.current = null;
    setTransform(current =>
      zoomAt(current, { x: viewport.width / 2, y: viewport.height / 2 }, factor, { minScale: MIN_SCALE, maxScale: MAX_SCALE })
    );
  }, []);
  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]);

  return {
    transform,
    fitTo,
    onViewportResize,
    onUserTransform,
    zoomIn,
    zoomOut,
    canZoomIn: transform.scale < MAX_SCALE,
    canZoomOut: transform.scale > MIN_SCALE,
  };
}
