import type { DrawingObject } from '@canvas-kit/core';
import type { BoardAppearance, Shape, StrokeDash, TextShape } from '../view-document.js';
import { TEXT_BACKGROUND_PAD, frameLabelPoint, placementParts, type Column, type Row } from '../decoration-geometry.js';

/** Text drawn on a dark board with no colour of its own — light enough to read on its paper. */
const DARK_BOARD_TEXT = '#e5e7eb';

/** A line style as the canvas strokes it — connectors and frames alike. */
export const DASH_PATTERNS: Record<StrokeDash, number[]> = { solid: [], dashed: [6, 4], dotted: [2, 3] };

const ALIGN: Record<Column, 'left' | 'center' | 'right'> = { start: 'left', center: 'center', end: 'right' };

/**
 * What a decoration draws on a board of `appearance`, as canvas-kit objects — the same for the viewer and the editor.
 * A rect is one rect (rounded and dashed as it says), then its name, if it has one, as a text inside it (id
 * `<id>#label`); a text is one text, placed by its anchor over its background.
 *
 * A colour of `none` paints nothing — the same as leaving it out — so it is left out here (a canvas would otherwise
 * ignore the word and paint in whatever colour it last used). A text the author gave no colour is drawn in the
 * canvas's default dark ink, which disappears on a dark board, so there it takes a light one. A colour the author
 * chose is theirs, on either board. A frame's name takes its `labelFill`, else the frame's stroke colour.
 */
export function decorationObjects(shape: Shape, appearance: BoardAppearance = 'light'): DrawingObject[] {
  if (shape.type === 'text') return [textObject(shape, appearance)];

  const { id, x, y, width, height, strokeWidth, radius, dash } = shape;
  const fill = painted(shape.fill);
  const stroke = painted(shape.stroke);
  const pattern = dash ? DASH_PATTERNS[dash] : [];
  const rect: DrawingObject = {
    id, type: 'rect', x, y, width, height,
    ...(fill !== undefined && { fill }),
    ...(stroke !== undefined && { stroke }),
    ...(strokeWidth !== undefined && { strokeWidth }),
    ...(radius !== undefined && radius > 0 && { cornerRadius: radius }),
    ...(pattern.length > 0 && { dash: pattern }),
  };
  if (!shape.label?.trim()) return [rect];
  const at = frameLabelPoint(shape);
  const ink = shape.labelFill ?? stroke;
  const label = textObject({ id: `${id}#label`, type: 'text', x: at.x, y: at.y, text: shape.label, fontSize: at.size, ...(ink !== undefined && { fill: ink }) }, appearance, at.row, at.column);
  return [rect, label];
}

function textObject(text: TextShape, appearance: BoardAppearance, row?: Row, column?: Column): DrawingObject {
  const parts = row && column ? { row, column } : placementParts(text.anchor ?? 'top-start');
  const ink = text.fill?.trim().toLowerCase() === 'none' ? 'transparent' : text.fill ?? (appearance === 'dark' ? DARK_BOARD_TEXT : undefined);
  const background = painted(text.background);
  return {
    id: text.id, type: 'text', x: text.x, y: text.y, text: text.text,
    ...(text.fontSize !== undefined && { fontSize: text.fontSize }),
    ...(ink !== undefined && { fill: ink }),
    ...(parts.column !== 'start' && { align: ALIGN[parts.column] }),
    ...(parts.row !== 'top' && { verticalAlign: parts.row }),
    ...(background !== undefined && { background, padding: TEXT_BACKGROUND_PAD }),
  };
}

/** A colour as painted: `none` (in any case) is no colour. */
function painted(colour: string | undefined): string | undefined {
  return colour === undefined || colour.trim().toLowerCase() === 'none' ? undefined : colour;
}
