/**
 * The colours a document's own drawing (decorations) may name: what every canvas reads the same way, and what a
 * check can tell apart without a browser. CSS variables (`var(--x)`) are not among them — a canvas has no
 * stylesheet to resolve them against; newer colour functions (`oklch()`, `color-mix()`) are left out until every
 * browser U-Board supports reads them.
 */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const CHANNEL = String.raw`${NUMBER}%?`;
const HUE = String.raw`${NUMBER}(?:deg|grad|rad|turn)?`;
const ALPHA = String.raw`${NUMBER}%?`;
const fn = (name: string, first: string) =>
  new RegExp(
    String.raw`^${name}a?\(\s*(?:` +
      // legacy: commas, optional alpha
      String.raw`${first}\s*,\s*${CHANNEL}\s*,\s*${CHANNEL}(?:\s*,\s*${ALPHA})?` +
      '|' +
      // modern: spaces, optional "/ alpha"
      String.raw`${first}\s+${CHANNEL}\s+${CHANNEL}(?:\s*\/\s*${ALPHA})?` +
      String.raw`)\s*\)$`,
    'i'
  );
const RGB = fn('rgb', CHANNEL);
const HSL = fn('hsl', HUE);

const NAMED = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
    'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray ' +
    'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue ' +
    'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew ' +
    'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray ' +
    'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue ' +
    'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
    'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
    'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple ' +
    'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue ' +
    'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white ' +
    'whitesmoke yellow yellowgreen transparent'
  ).split(' ')
);

/** Whether `value` is a colour a decoration may use: hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, a CSS colour name,
 *  `transparent`, or `none` (paint nothing — the same as leaving the field out). */
export function isDrawingColor(value: string): boolean {
  const v = value.trim();
  return v.toLowerCase() === 'none' || HEX.test(v) || NAMED.has(v.toLowerCase()) || RGB.test(v) || HSL.test(v);
}

/** Whether `value` is a colour a skin's palette may name: a drawing's colour that paints something (`none` paints nothing). A
 *  palette colour is written into the widgets' CSS, where anything else — `url(…)`, a `var()` — would load or read what the
 *  board's media origins and its theme govern. */
export function isSkinColor(value: unknown): value is string {
  return typeof value === 'string' && value.trim().toLowerCase() !== 'none' && isDrawingColor(value);
}

const FONT_STACK = /^[\p{L}\p{N}\s,"'._-]{1,200}$/u;

/** Whether `value` is a font stack a skin may name: family names separated by commas (`"Noto Sans KR", serif`). No function,
 *  no url, no braces or semicolons — a font is written into the widgets' CSS as a name, never as a rule. */
export function isFontStack(value: unknown): value is string {
  return typeof value === 'string' && FONT_STACK.test(value) && value.trim() !== '';
}

/** What a decoration's colour field accepts, said the way a fix needs it. */
export const DRAWING_COLOR_FORMS = 'a hex colour ("#1f6feb", "#1f6feb33"), rgb()/rgba(), hsl()/hsla(), a CSS colour name, "transparent" or "none"';
