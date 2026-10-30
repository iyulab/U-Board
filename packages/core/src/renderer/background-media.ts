import { getMediaOrigins } from '@iyulab/u-widgets';

/**
 * Whether the picture a board is drawn on may be requested. The image of a board's background is a request that leaves
 * the page like the media of a widget does, so it answers to the same list: the origins the host allowed with
 * `setMediaOrigins`. Without a list nothing is limited; an inline image (`data:image/…`) makes no request, so no origin
 * applies to it.
 */
export function mayLoadBackground(src: string): boolean {
  const allowed = getMediaOrigins();
  if (allowed === null) return true;
  if (/^data:image\//i.test(src)) return true;
  let origin: string;
  try {
    origin = new URL(src, typeof document !== 'undefined' ? document.baseURI : undefined).origin;
  } catch {
    return false;
  }
  if (origin === 'null') return false;
  if (allowed.includes(origin)) return true;
  return allowed.includes('self') && typeof location !== 'undefined' && origin === location.origin;
}
