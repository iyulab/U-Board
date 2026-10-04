import { getObjectBounds } from '@canvas-kit/core';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';
import type { ViewDocument } from '../view-document.js';

/** Fitting a document into view: space (CSS px) kept clear around it, and never magnified past its
 * natural size — a small board stays legible at 1:1 instead of blowing its widgets and a raster
 * background up to fill the screen; a large one shrinks to fit. Shared by the viewer and the editor
 * so a board opens framed the same way in both. */
export const DOCUMENT_FIT_OPTIONS = { padding: 16, maxScale: 1 };

/** An axis-aligned rect in the document's own (scene) coordinates. */
export interface DocumentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The region a viewer has to show for the whole document to be visible: the background image's
 * rect, grown to take in every node (at its default footprint when it has no size of its own) and
 * decoration (a text decoration by its rendered text box, as the canvas draws it). `null` when the
 * document has nothing to show.
 */
export function documentExtent(doc: ViewDocument): DocumentRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number, width = 0, height = 0) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  };

  const image = doc.background.image;
  if (image) include(0, 0, image.width, image.height);
  for (const node of doc.nodes) {
    include(node.x, node.y, node.width ?? DEFAULT_NODE_WIDTH, node.height ?? DEFAULT_NODE_HEIGHT);
  }
  for (const shape of doc.decorations ?? []) {
    const box = getObjectBounds(shape);
    include(box.x, box.y, box.width, box.height);
  }

  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
