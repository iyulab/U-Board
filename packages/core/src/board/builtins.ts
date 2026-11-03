// The spatial built-ins U-Board draws itself — a marker, a label, a legend, a line — as elements of the picture model:
// markup the renderer's element layer draws in an isolated root, with the widgets' tokens and tones. Their names start
// with `u-board-`, which a board's own elements do not.

import { TONES } from '../tones.js';
import type { ElementDefinition } from '../view-document.js';

/** Each tone as the colour `--c` a part is drawn in, by its `data-tone`. */
const TONE_RULES = TONES.map(t => `[data-tone="${t}"]{--c:var(--u-widget-tone-${t})}`).join('');

const text = { type: 'string' } as const;

/** The size of a marker's point — what a link meets when the marker's words are on a side of it (`labelAt`). */
export const MARKER_JOINT = 14;

/** A point on a canvas, in its status, with its name, its status's words and a note. */
export const MARKER: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: { name: text, tone: text, status: text, note: text, shape: { enum: ['dot', 'pin', 'ring'] }, labelAt: { enum: ['', 'right', 'left', 'above', 'below'] } } },
  template:
    '<div class="mk {{shape}} at-{{labelAt}}" data-tone="{{tone}}"><i></i><span class="txt"><b>{{name}}</b><span class="st">{{status}}</span><small>{{note}}</small></span></div>',
  style:
    `.mk{--c:var(--u-widget-tone-idle);display:flex;align-items:center;gap:6px;height:100%;font:12px var(--u-widget-font-family);color:var(--u-widget-text)}${TONE_RULES}` +
    '.mk i{flex:none;width:14px;height:14px;border-radius:50%;background:var(--c)}.mk.ring i{background:none;border:3px solid var(--c)}' +
    '.mk.pin i{border-radius:50% 50% 50% 0;transform:rotate(-45deg) scale(.7071)}.txt{display:grid;line-height:1.2;min-width:0}' +
    '.txt b,.st,small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.st{color:var(--c);font-weight:600}.st:empty,small:empty{display:none}' +
    'small{color:var(--u-widget-text-secondary)}' +
    // With `labelAt` the point is the middle of the box and the words go on a side of it — so a link to the box meets the point.
    '.mk[class*=" at-"]:not(.at-){position:relative;display:block}.mk[class*=" at-"]:not(.at-) i{position:absolute;left:50%;top:50%;box-sizing:border-box;margin:-7px 0 0 -7px}' +
    '.mk[class*=" at-"]:not(.at-) .txt{position:absolute}.at-right .txt{left:calc(50% + 14px);top:50%;transform:translateY(-50%)}' +
    '.at-left .txt{right:calc(50% + 14px);top:50%;transform:translateY(-50%);text-align:right}' +
    '.at-below .txt{left:0;right:0;top:calc(50% + 14px);text-align:center}.at-above .txt{left:0;right:0;bottom:calc(50% + 14px);text-align:center}',
};

/** A marker drawn as one of the board's symbols — in its status's colour — with its name, status and note under it. */
export const MARKER_SYMBOL: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: { symbol: text, name: text, tone: text, status: text, note: text } },
  template:
    '<figure class="sm" data-tone="{{tone}}"><svg class="sym" aria-hidden="true"><use href="#{{symbol}}" width="100%" height="100%"/></svg>' +
    '<figcaption><b>{{name}}</b><span class="st">{{status}}</span><small>{{note}}</small></figcaption></figure>',
  style:
    `.sm{--c:var(--u-widget-tone-idle);margin:0;display:grid;grid-template-rows:minmax(0,1fr) auto;height:100%;font:12px var(--u-widget-font-family);color:var(--u-widget-text)}${TONE_RULES}` +
    '.sym{width:100%;height:100%;fill:var(--c)}figcaption{display:flex;gap:6px;align-items:baseline;min-width:0}' +
    'figcaption b,.st,small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.st{color:var(--c);font-weight:600}.st:empty,small:empty{display:none}' +
    'small{color:var(--u-widget-text-secondary)}',
};

/** A text on a canvas, in its status's colour when it has one. */
export const LABEL: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: { text, tone: text, scale: text, ink: text, face: text } },
  template: '<span class="lb" data-tone="{{tone}}" data-scale="{{scale}}" data-ink="{{ink}}" data-face="{{face}}"><span class="tx">{{text}}</span></span>',
  // The ink is the colour a label is drawn in unless it has a status: `:where` keeps the ink's rules as weak as the tones' and
  // they come first, so a status wins. A pill is the text on a faint face of the ink, as wide as the text.
  style:
    '.lb{--c:var(--u-widget-text);display:flex;align-items:center;height:100%;font:600 14px var(--u-widget-font-family);color:var(--c)}' +
    ':where(.lb)[data-ink="muted"]{--c:var(--u-widget-text-secondary)}:where(.lb)[data-ink="accent"]{--c:var(--u-widget-primary)}' +
    TONE_RULES +
    '.lb[data-scale="small"]{font-size:10.5px}.lb[data-scale="large"]{font-size:17.5px}.lb[data-scale="xlarge"]{font-size:24.5px}.lb[data-scale="xxlarge"]{font-size:35px}' +
    '.lb[data-face="pill"] .tx{padding:.15em .7em;border-radius:999px;background:color-mix(in srgb,var(--c) 12%,transparent);line-height:1.4}',
};

/** The board's statuses, each its colour and words. */
export const LEGEND: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    properties: { items: { type: 'array', items: { type: 'object', properties: { tone: text, label: text, glyph: text } } } },
  },
  template: '<ul class="lg">{{#items}}<li data-tone="{{tone}}"><i>{{glyph}}</i>{{label}}</li>{{/items}}</ul>',
  style:
    `.lg{list-style:none;margin:0;padding:4px 6px;display:flex;flex-wrap:wrap;align-content:center;gap:4px 14px;height:100%;box-sizing:border-box;font:12px var(--u-widget-font-family);color:var(--u-widget-text)}${TONE_RULES}` +
    '.lg li{display:flex;align-items:center;gap:5px}.lg i{display:grid;place-items:center;min-width:12px;height:12px;border-radius:3px;background:var(--c);color:var(--u-widget-bg);font-style:normal;font-size:9px}',
};

/**
 * A line or a path in a box of its own: `d` drawn in the box's coordinates, stretched to the node, in a tone (its
 * `--c`), dashed or not.
 */
export function lineElement(d: string, box: { width: number; height: number }, look: { tone?: string; width: number; dash: boolean }): ElementDefinition {
  return {
    render: 'template',
    template:
      `<svg class="ln" width="100%" height="100%" viewBox="0 0 ${box.width} ${box.height}" preserveAspectRatio="none" data-tone="${look.tone ?? 'idle'}">` +
      `<path d="${d}" fill="none" stroke-width="${look.width}"${look.dash ? ' stroke-dasharray="8 6"' : ''} stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    style: `.ln{display:block;overflow:visible;pointer-events:none}.ln path{stroke:var(--c)}${TONE_RULES}`,
  };
}

/**
 * A line or a path that shows a state: its outline in the tone of the field's state (`tone`, bound), and — for a path — its
 * inside as a faint tint of the tone (`fill: "tone"`) or as diagonal lines in it (`fill: "hatch"`, or `hatch: "true"` — the
 * state's emphasis, bound). The three are drawn and shown by the attributes `data-fill` and `data-hatch`, which the style reads.
 */
export function stateLineElement(d: string, box: { width: number; height: number }, look: { width: number; dash: boolean }): ElementDefinition {
  return {
    render: 'template',
    props: { type: 'object', properties: { tone: text, fill: { enum: ['none', 'tone', 'hatch'] }, hatch: text } },
    template:
      `<svg class="ln" width="100%" height="100%" viewBox="0 0 ${box.width} ${box.height}" preserveAspectRatio="none" data-tone="{{tone}}" data-fill="{{fill}}" data-hatch="{{hatch}}">` +
      '<defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V8" stroke-width="1"/></pattern></defs>' +
      `<path class="tint" d="${d}" stroke="none"/><path class="hat" d="${d}" fill="url(#h)" stroke="none"/>` +
      `<path class="out" d="${d}" fill="none" stroke-width="${look.width}"${look.dash ? ' stroke-dasharray="8 6"' : ''} stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    style:
      `.ln{--c:var(--u-widget-tone-idle);display:block;overflow:visible;pointer-events:none}${TONE_RULES}` +
      '.out{stroke:var(--c)}.ln pattern path{stroke:var(--c)}.tint,.hat{display:none}' +
      '.ln[data-fill="tone"] .tint{display:inline;fill:var(--c);fill-opacity:.16}' +
      '.ln[data-fill="tone"][data-hatch="true"] .tint{display:none}' +
      '.ln[data-fill="hatch"] .hat,.ln[data-hatch="true"] .hat{display:inline}',
  };
}
