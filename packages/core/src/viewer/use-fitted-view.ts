import { useCallback, useRef, useState } from 'react';
import { fitTransform } from '@canvas-kit/core';
import type { Transform, Size } from '@canvas-kit/core';
import { DOCUMENT_FIT_OPTIONS, type DocumentRect } from './document-extent.js';

const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };
// canvas-kit's own default zoom floor — a fit never goes below what the user could zoom out to.
const MIN_SCALE = 0.1;

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

  return { transform, fitTo, onViewportResize, onUserTransform };
}
