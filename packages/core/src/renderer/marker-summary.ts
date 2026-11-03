// A marker drawn as a point on the canvas — what the viewer shows in its place when too many parts are in view to keep each one
// as page content (`summarizeParts`). Its shape, its status's colour, for a state that asks for attention a ring, and for a value
// that is not current an edge: the same marker, from the same tokens the marker element and its frame draw with, so the two never disagree.

import type { OverlaySummary } from '@canvas-kit/viewer';
import type { ConnectionQuality } from '../adapter.js';
import { elementNameOf } from '../elements/element-type.js';
import { QUALITY_EDGE } from '../quality-presentation.js';
import { TONES } from '../tones.js';
import type { StateLook } from '../view-document.js';

const MARKER = 'u-board-marker';
const SHAPES: readonly OverlaySummary['shape'][] = ['dot', 'ring', 'pin'];

/**
 * What a part is drawn as on the canvas when it is summarized — a marker's point; none for any other part (a widget, a
 * chart, a label, an element of the board's own), which stays page content.
 *
 * `theme` is the board's tokens (`boardTheme`): the marker's colour is its tone's, resolved to the colour a canvas can
 * draw (it cannot read a CSS variable). A marker with no status is `idle`, as its element draws it. A part its state
 * hides is a point of no colour, so it leaves the page without being seen.
 *
 * `quality` is the connection quality of the marker's headline value (`frameQuality`): one that is not current (`stale`,
 * `disconnected`) is an edge — dashed or dotted, in the colours of the part's own frame — apart from the tone, so «the state is
 * bad» and «the value is old» are never the same point. A current one, or none known, draws no edge.
 */
export function markerSummary(
  widget: { type: string; props?: Record<string, unknown> },
  theme: Readonly<Record<string, string>>,
  look?: StateLook,
  quality?: ConnectionQuality
): OverlaySummary | undefined {
  if (elementNameOf(widget.type) !== MARKER) return undefined;
  const props = widget.props ?? {};
  const shape = SHAPES.find(s => s === props.shape) ?? 'dot';
  if (look?.hidden) return { shape, color: 'transparent' };
  const halo = look?.blink === true || look?.outline !== undefined;
  const edge = quality === 'stale' || quality === 'disconnected' ? QUALITY_EDGE[quality] : undefined;
  return {
    shape,
    color: toneColor(typeof props.tone === 'string' ? props.tone : '', theme),
    ...(halo && { halo }),
    ...(edge && { edge: { dash: edge.dash, color: resolved(theme[edge.token], theme) ?? edge.fallback } }),
  };
}

/** The colour of a tone in the board's tokens — `accent` follows the board's primary — `idle` for a name that is none. */
function toneColor(tone: string, theme: Readonly<Record<string, string>>): string {
  const name = (TONES as readonly string[]).includes(tone) ? tone : 'idle';
  return resolved(theme[`--u-widget-tone-${name}`], theme) ?? '#94a3b8';
}

/** A token's value as a colour: one `var(--other)` followed to the token it names, as the tones are written. */
function resolved(value: string | undefined, theme: Readonly<Record<string, string>>): string | undefined {
  const reference = /^var\((--[\w-]+)\)$/.exec(value ?? '');
  return reference ? theme[reference[1]!] : value;
}
