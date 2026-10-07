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
  if (!BACKGROUND_IMAGE_TYPES.includes(file.type)) throw new BackgroundImageError('type');
  if (file.size > MAX_BACKGROUND_BYTES) throw new BackgroundImageError('size');
  const src = await readAsDataUrl(file);
  const { width, height } = await measure(src).catch(() => ({ width: 0, height: 0 }));
  if (!(width > 0 && height > 0)) throw new BackgroundImageError('unreadable');
  return { src, width, height };
}

function readAsDataUrl(file: File): Promise<string> {
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
