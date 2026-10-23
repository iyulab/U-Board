// The spatial built-ins U-Board draws itself — a marker, a label, a legend, a line — as elements of the picture model:
// markup the renderer's element layer draws in an isolated root, with the widgets' tokens and tones. Their names start
// with `u-board-`, which a board's own elements do not.

import { TONES } from '../tones.js';
import type { ElementDefinition } from '../view-document.js';

/** Each tone as the colour `--c` a part is drawn in, by its `data-tone`. */
const TONE_RULES = TONES.map(t => `[data-tone="${t}"]{--c:var(--u-widget-tone-${t})}`).join('');

const text = { type: 'string' } as const;

/** A point on a canvas, in its status, with its name, its status's words and a note. */
export const MARKER: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: { name: text, tone: text, status: text, note: text, shape: { enum: ['dot', 'pin', 'ring'] } } },
  template:
    '<div class="mk {{shape}}" data-tone="{{tone}}"><i></i><span class="txt"><b>{{name}}</b><span class="st">{{status}}</span><small>{{note}}</small></span></div>',
  style:
    `.mk{--c:var(--u-widget-tone-idle);display:flex;align-items:center;gap:6px;height:100%;font:12px var(--u-widget-font-family);color:var(--u-widget-text)}${TONE_RULES}` +
    '.mk i{flex:none;width:14px;height:14px;border-radius:50%;background:var(--c)}.mk.ring i{background:none;border:3px solid var(--c)}' +
    '.mk.pin i{border-radius:50% 50% 50% 0;transform:rotate(-45deg)}.txt{display:grid;line-height:1.2;min-width:0}' +
    '.txt b,.st,small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.st{color:var(--c);font-weight:600}.st:empty,small:empty{display:none}' +
    'small{color:var(--u-widget-text-secondary)}',
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
  props: { type: 'object', properties: { text, tone: text } },
  template: '<span class="lb" data-tone="{{tone}}">{{text}}</span>',
  style: `.lb{--c:var(--u-widget-text);display:flex;align-items:center;height:100%;font:600 14px var(--u-widget-font-family);color:var(--c)}${TONE_RULES}`,
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
