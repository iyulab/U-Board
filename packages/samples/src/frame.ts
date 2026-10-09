/**
 * Where a latitude/longitude falls on a drawing of a small area, for placing a sample's nodes over its
 * background. Over a few kilometres the earth is flat enough for a linear frame: the drawing spans
 * `south`–`north` and `west`–`east` across its box, with the box's aspect chosen so a metre is the same
 * length either way. The board stores only the result — `x`/`y` on the drawing.
 */
export interface AreaFrame {
  /** The drawing's box on the board. */
  x: number;
  y: number;
  width: number;
  height: number;
  north: number;
  south: number;
  west: number;
  east: number;
}

export function project(frame: AreaFrame, lat: number, lng: number): { x: number; y: number } {
  return {
    x: frame.x + ((lng - frame.west) / (frame.east - frame.west)) * frame.width,
    y: frame.y + ((frame.north - lat) / (frame.north - frame.south)) * frame.height,
  };
}

/** An SVG drawing as an image `src`. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
}
