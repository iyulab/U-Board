import type { CSSProperties } from 'react';
import { UWidget } from '@iyulab/u-widgets/react';
import '@iyulab/u-widgets';
import type { ResolvedWidget } from '../adapter.js';
import type { BoardAppearance, ElementDefinition } from '../view-document.js';
import { elementNameOf } from '../elements/element-type.js';
import { ElementView } from './element-view.js';
import { QUALITY_BADGE_STYLE, QUALITY_FRAME_STYLE, frameBinding } from '../quality-presentation.js';
import { describeQuality, DEFAULT_QUALITY_TEXT, type QualitySummary, type QualityText } from '../quality-text.js';

// Standard visually-hidden ("sr-only") technique: present in the accessibility tree, invisible
// on screen. Kept off the frame `<div>` itself and off `UWidget` — each `uw-*` custom element
// already renders its own role (e.g. `role="list"`/`"meter"`/`"img"`) inside its shadow root, and
// a `title` attribute or a border-style change carries no text for `aria-live` to observe. This
// sibling node exists purely to hold the announced text in the light DOM, next to (not wrapping)
// the widget, so it can't collide with either.
const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const WIDGET_FILL_STYLE: CSSProperties = { width: '100%', height: '100%' };

// The visible half of a node's quality, for a screen nobody hovers over or listens to — a wall display.
// The frame tells how current the value is (by style as well as colour); this says why, and how old
// it is, in a few words on a tag just above the frame's top-left corner — outside the widget, so it
// covers none of it, and in full however narrow the node: cut to fit, the age (the part that matters
// most) would be the first to go. Hidden from assistive technology: the status region below announces
// the full text.
const BADGE_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: '100%',
  marginBottom: 2,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  padding: '1px 6px',
  borderRadius: 4,
  font: '600 11px/1.4 system-ui, sans-serif',
  pointerEvents: 'none',
  zIndex: 1,
};

/** The few words on a node's mark: the cause of its headline binding's state when the adapter gave
 *  one, else the state; for a stale value, how long ago it was obtained. */
function badgeText(widget: QualitySummary, key: string, text: QualityText, now: number): string | undefined {
  const quality = widget.quality[key];
  if (!quality || quality === 'live') return undefined;
  const reason = widget.reasons?.[key];
  const what = reason ? text.brief.reason[reason] : text.brief.quality[quality];
  if (!what) return undefined;
  const observed = quality === 'stale' && widget.observedAt?.[key] ? Date.parse(widget.observedAt[key]) : NaN;
  return Number.isNaN(observed) ? what : `${what} · ${text.age(now - observed)}`;
}

export interface NodeFrameProps {
  /** The resolved widget to draw. */
  widget: ResolvedWidget;
  /** The board's tone — the widget takes its palette (light by default). */
  appearance?: BoardAppearance;
  /** Words for the connection-quality tooltip, mark and announcement (English by default). */
  qualityText?: QualityText;
  /** The time a stale value's age is measured to, in epoch milliseconds — read by the caller when it draws, so a
   *  re-render of the same values does not change what they say. */
  now: number;
  /** The language the widget speaks (BCP 47). Left out, it follows the page's. */
  locale?: string;
  /** The elements the board defines — what a widget of type `element:<name>` draws. */
  elements?: Record<string, ElementDefinition>;
}

/**
 * One placed widget as a board shows it, whatever the kind places it: the widget filling the box it is
 * given, a frame that tells how current its values are, a mark that says why, and a status region that
 * announces it. A canvas node gives it the node's box; a grid item, its cell.
 *
 * u-widgets fits a host height in both directions: a chart fills it and lays itself out compactly when
 * small, media (a gauge, an image) scales down whole, and content that runs on (a table, a list) scrolls
 * inside. Nothing spills over a neighbour.
 */
export function NodeFrame({ widget, appearance, qualityText = DEFAULT_QUALITY_TEXT, now, locale, elements }: NodeFrameProps) {
  const key = frameBinding(widget.quality, widget.type);
  const quality = key === undefined ? undefined : widget.quality[key];
  const frameStyle = quality ? QUALITY_FRAME_STYLE[quality] : undefined;
  const label = describeQuality(widget, { text: qualityText, now });
  const badge = key === undefined ? undefined : badgeText(widget, key, qualityText, now);
  const element = elementNameOf(widget.type);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...frameStyle }} title={label}>
      {element !== undefined ? (
        <ElementView definition={elements?.[element]} name={element} props={widget.props ?? {}} appearance={appearance} />
      ) : (
        // u-widgets takes one `spec` object with `widget` as the type discriminator alongside
        // `data`/`mapping`/`options` — `type` + `props` recombine into exactly that shape.
        <UWidget spec={{ widget: widget.type, ...widget.props }} style={WIDGET_FILL_STYLE} theme={appearance ?? 'light'} locale={locale} />
      )}
      {badge && quality && (
        <span aria-hidden="true" data-quality-badge="" style={{ ...BADGE_STYLE, ...QUALITY_BADGE_STYLE[quality] }}>
          {badge}
        </span>
      )}
      <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>
        {label ?? ''}
      </span>
    </div>
  );
}
