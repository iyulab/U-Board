import type { ViewSkin } from '../view-document.js';
import { skinTokens } from './element-template.js';

// A board's background picture is drawn as an image, and an image reads no CSS variables — so the skin cannot reach it the
// way it reaches a widget or an element. A picture that wants to follow the skin writes its colours as the widgets' own
// tokens with the colour it has by itself as the fallback — `fill="var(--u-widget-bg, #f6f4ef)"`. Drawn as it is, the
// fallback is what an image draws (the picture is the author's own); when the board's skin names that token, the viewer
// writes the skin's value in place of the whole `var(…)` before the picture is drawn. Only a picture the board carries
// (`data:image/svg+xml`) can be read; one at an address is left as it is.
// the fallback may hold one level of parentheses — `rgba(0, 0, 0, .5)`
const SKIN_VAR = /var\(\s*(--u-widget-[a-z-]+)\s*,\s*(?:[^()]|\([^()]*\))*\)/g;
const SVG_DATA = /^data:image\/svg\+xml(?:;charset=[\w-]+)?(;base64)?,/i;

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** The picture's address with the skin's values written in for the tokens the picture names; the address itself when there is nothing to write. */
export function skinBackground(src: string, skin: ViewSkin | undefined): string {
  if (skin === undefined) return src;
  const encoded = SVG_DATA.exec(src);
  // a percent-encoded picture shows whether it asks (`var(`, or `var%28` where the encoder escaped the parenthesis) without being
  // decoded; a base64 one has to be read
  if (encoded === null || (!encoded[1] && !/var(\(|%28)/i.test(src))) return src;
  const tokens = skinTokens(skin);
  if (Object.keys(tokens).length === 0) return src;
  let text: string;
  try {
    text = encoded[1] ? atob(src.slice(encoded[0].length)) : decodeURIComponent(src.slice(encoded[0].length));
  } catch {
    return src;
  }
  let changed = false;
  const next = text.replace(SKIN_VAR, (whole, token: string) => {
    const value = tokens[token];
    if (value === undefined) return whole;
    changed = true;
    return escapeXml(value);
  });
  return changed ? `data:image/svg+xml,${encodeURIComponent(next)}` : src;
}
