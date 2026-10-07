import type { BackgroundImage } from '../view-document.js';

/** The image types a background may be — what every browser draws. */
export const BACKGROUND_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

/** The largest background file accepted. The image is kept inside the document — a board needs no
 *  other store, opens the same on a closed network, and is in every backup and exported file — so
 *  it is bounded: every save and every open of the board carries it. */
export const MAX_BACKGROUND_BYTES = 4 * 1024 * 1024;

export type BackgroundImageProblem = 'type' | 'size' | 'unreadable';

export class BackgroundImageError extends Error {
  constructor(readonly problem: BackgroundImageProblem) {
    super(`background image refused: ${problem}`);
  }
}

/** Reads a chosen file into a background: the image as a `data:` URL, and its own size in pixels —
 *  the scene units the board is laid out in. Refuses another type, a file over the limit, and an
 *  image the browser cannot draw or that has no size of its own. */
export async function readBackgroundImage(file: File, measure: (src: string) => Promise<{ width: number; height: number }> = naturalSize): Promise<BackgroundImage> {
  // Some systems give an SVG file no type; its name still says what it is.
  const type = file.type || (/\.svg$/i.test(file.name) ? 'image/svg+xml' : '');
  if (!BACKGROUND_IMAGE_TYPES.includes(type)) throw new BackgroundImageError('type');
  if (file.size > MAX_BACKGROUND_BYTES) throw new BackgroundImageError('size');
  const src = await readAsDataUrl(type === file.type ? file : new Blob([file], { type }));
  let { width, height } = await measure(src).catch(() => ({ width: 0, height: 0 }));
  // An SVG sized only by its viewBox has no size the browser reports; read it from the drawing.
  if (!(width > 0 && height > 0) && type === 'image/svg+xml') ({ width, height } = svgSize(await file.text()));
  if (!(width > 0 && height > 0)) throw new BackgroundImageError('unreadable');
  return { src, width, height };
}

/** An SVG drawing's size from its root element: `width`/`height` in plain numbers or pixels, else
 *  its `viewBox`. Zero when it states neither. */
export function svgSize(text: string): { width: number; height: number } {
  const root = /<svg\b[^>]*>/i.exec(text)?.[0] ?? '';
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(root)?.[1];
  const pixels = (value?: string) => (value && /^\s*[\d.]+\s*(px)?\s*$/i.test(value) ? parseFloat(value) : NaN);
  const width = pixels(attr('width'));
  const height = pixels(attr('height'));
  if (width > 0 && height > 0) return { width, height };
  const box = attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (box?.length === 4 && box[2] > 0 && box[3] > 0) return { width: box[2], height: box[3] };
  return { width: 0, height: 0 };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new BackgroundImageError('unreadable'));
    reader.readAsDataURL(file);
  });
}

function naturalSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('the image could not be drawn'));
    image.src = src;
  });
}
