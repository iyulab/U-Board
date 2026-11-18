import { useEffect } from 'react';
import { FONT_FAMILY, FONT_SRC } from '../board/fonts.js';
import type { ViewFont } from '../view-document.js';

// A board's `fonts` are registered with the page once, by what they say: the same font on a board drawn again (a new object each time) loads
// nothing more. They stay registered for the life of the page — a family is a name, and a second board that names it again finds it there.
const registered = new Set<string>();

/** Registers one font with the page's font set and starts loading it; false when it is not loadable here (no font API, or a family or a source the check would have refused —
 *  a document can reach a viewer from outside the check). */
export function registerFont(font: ViewFont): boolean {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || document.fonts === undefined) return false;
  if (typeof font.family !== 'string' || typeof font.src !== 'string' || !FONT_FAMILY.test(font.family) || !FONT_SRC.test(font.src)) return false;
  const weight = font.weight ?? 400;
  const style = font.style ?? 'normal';
  const id = JSON.stringify([font.family, font.src, weight, style]);
  if (registered.has(id)) return true;
  registered.add(id);
  // `swap`: the text is drawn in the next family of its stack until the face has loaded, then in the face.
  const face = new FontFace(font.family, `url(${JSON.stringify(font.src)})`, { weight: String(weight), style, display: 'swap' });
  document.fonts.add(face);
  face.load().catch(() => {
    // A face that cannot be fetched leaves its family to the rest of the stack: the text is drawn, in another font.
  });
  return true;
}

/** Makes a board's web fonts available to everything it draws — widgets and elements read them by family name in the skin's stacks and their own CSS. */
export function useDocumentFonts(fonts: readonly ViewFont[] | undefined): void {
  const wanted = fonts === undefined || fonts.length === 0 ? '' : JSON.stringify(fonts);
  useEffect(() => {
    if (wanted === '') return;
    for (const font of JSON.parse(wanted) as ViewFont[]) registerFont(font);
  }, [wanted]);
}
