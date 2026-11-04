import type { DrawingObject } from '@canvas-kit/core';
import type { BoardAppearance, Shape, StrokeDash, TextShape } from '../view-document.js';
import { TEXT_BACKGROUND_PAD, frameLabelPoint, placementParts, type Column, type Row } from '../decoration-geometry.js';
import { drawingColor } from '../theme-colors.js';

/** Text drawn on a dark board with no colour of its own — light enough to read on its paper. */
const DARK_BOARD_TEXT = '#e5e7eb';

/** A line style as the canvas strokes it — connectors and frames alike. */
export const DASH_PATTERNS: Record<StrokeDash, number[]> = { solid: [], dashed: [6, 4], dotted: [2, 3], flowing: [2, 3] };

/** How fast flowing dots travel, in scene units per second — three periods of the pattern. A flowing stroke is dotted, not dashed:
 *  stood still (for a reader who asks for less motion) it stays apart from a dashed one, as a status's two emphases are. */
export const DASH_FLOW = 15;

/** What a stroke of this line style adds to a drawing object: its pattern, and the flow of one that flows. */
export function dashOf(dash: StrokeDash | undefined): { dash?: number[]; dashFlow?: number } {
  const pattern = dash ? DASH_PATTERNS[dash] : [];
  return { ...(pattern.length > 0 && { dash: pattern }), ...(dash === 'flowing' && { dashFlow: DASH_FLOW }) };
}

const ALIGN: Record<Column, 'left' | 'center' | 'right'> = { start: 'left', center: 'center', end: 'right' };

/**
 * What a decoration draws on a board of `appearance`, as canvas-kit objects — the same for the viewer and the editor.
 * A rect is one rect (rounded and dashed as it says), then its name, if it has one, as a text inside it (id
 * `<id>#label`); a text is one text, placed by its anchor over its background.
 *
 * A colour of `none` paints nothing — the same as leaving it out — so it is left out here (a canvas would otherwise
 * ignore the word and paint in whatever colour it last used). A text the author gave no colour is drawn in the
 * canvas's default dark ink, which disappears on a dark board, so there it takes a light one. A colour the author
 * chose is theirs, on either board. A frame's name takes its `labelFill`, else the frame's stroke colour. A theme
 * colour's name (`positive`, `accent`, …) is drawn as its value on a board of this tone and `accent`.
 */
export function decorationObjects(shape: Shape, appearance: BoardAppearance = 'light', accent?: string): DrawingObject[] {
  const paint = (colour: string | undefined) => painted(colour, appearance, accent);
  if (shape.type === 'text') return [textObject(shape, appearance, paint)];

  const { id, x, y, width, height, strokeWidth, radius, dash, hatch, fillOpacity } = shape;
  const colour = paint(shape.fill);
  const stroke = paint(shape.stroke);
  // A hatched box has no flat fill: its inside is the lines, in the fill's colour — the outline's when it has none.
  const fill = hatch === true || colour === undefined ? undefined : fillOpacity === undefined ? colour : withAlpha(colour, fillOpacity);
  const rect: DrawingObject = {
    id, type: 'rect', x, y, width, height,
    ...(fill !== undefined && { fill }),
    ...(stroke !== undefined && { stroke }),
    ...(strokeWidth !== undefined && { strokeWidth }),
    ...(radius !== undefined && radius > 0 && { cornerRadius: radius }),
    ...dashOf(dash),
  };
  const lines = hatch === true ? hatchLines(shape, colour ?? stroke) : [];
  if (!shape.label?.trim()) return [rect, ...lines];
  const at = frameLabelPoint(shape);
  const ink = shape.labelFill ?? stroke;
  const label = textObject({ id: `${id}#label`, type: 'text', x: at.x, y: at.y, text: shape.label, fontSize: at.size, ...(ink !== undefined && { fill: ink }) }, appearance, paint, at.row, at.column);
  return [rect, ...lines, label];
}

/** The lines a hatched box is drawn with are about this far apart, in scene units. */
const HATCH_GAP = 8;
/** … and never more than this many, so a large area does not make a drawing of thousands of lines. */
const HATCH_MAX_LINES = 120;

/**
 * The inside of a box as diagonal lines (rising to the right, in the colour), each cut to the box — a second channel a state is
 * shown by that reads without colour. They are `locked`: a designer never selects one, and they stand for the box they are in.
 */
function hatchLines(box: Extract<Shape, { type: 'rect' }>, colour: string | undefined): DrawingObject[] {
  const { id, x, y, width, height } = box;
  if (colour === undefined || width <= 0 || height <= 0) return [];
  const gap = Math.max(HATCH_GAP, (width + height) / HATCH_MAX_LINES);
  const lines: DrawingObject[] = [];
  // Each line is u + v = c in the box's own coordinates (u across, v down), cut where it leaves the box.
  for (let c = gap, n = 0; c < width + height; c += gap, n++) {
    const from = Math.max(0, c - height);
    const to = Math.min(width, c);
    if (to - from < 1) continue;
    lines.push({ id: `${id}#hatch${n}`, type: 'line', x: 0, y: 0, points: [x + from, y + c - from, x + to, y + c - to], stroke: colour, strokeWidth: 1, locked: true });
  }
  return lines;
}

/** A hex colour (`#rgb` or `#rrggbb`) at an opacity, as the canvas reads it; any other colour as it is. */
function withAlpha(colour: string, opacity: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim())?.[1];
  if (hex === undefined) return colour;
  const full = hex.length === 3 ? [...hex].map(d => d + d).join('') : hex;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))})`;
}

function textObject(text: TextShape, appearance: BoardAppearance, paint: (colour: string | undefined) => string | undefined, row?: Row, column?: Column): DrawingObject {
  const parts = row && column ? { row, column } : placementParts(text.anchor ?? 'top-start');
  const ink = text.fill?.trim().toLowerCase() === 'none' ? 'transparent' : text.fill !== undefined ? paint(text.fill) : appearance === 'dark' ? DARK_BOARD_TEXT : undefined;
  const background = paint(text.background);
  return {
    id: text.id, type: 'text', x: text.x, y: text.y, text: text.text,
    ...(text.fontSize !== undefined && { fontSize: text.fontSize }),
    ...(ink !== undefined && { fill: ink }),
    ...(parts.column !== 'start' && { align: ALIGN[parts.column] }),
    ...(parts.row !== 'top' && { verticalAlign: parts.row }),
    ...(background !== undefined && { background, padding: TEXT_BACKGROUND_PAD }),
  };
}

/** A colour as painted: `none` (in any case) is no colour, a theme colour's name its value on this board. */
function painted(colour: string | undefined, appearance: BoardAppearance, accent: string | undefined): string | undefined {
  return colour === undefined || colour.trim().toLowerCase() === 'none' ? undefined : drawingColor(colour, appearance, accent);
}
