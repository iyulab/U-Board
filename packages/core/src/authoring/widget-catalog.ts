import { getPrimaryDataField } from '@iyulab/u-widgets';
import type { Widget } from '../view-document.js';

/** The widget types the property panel offers a type-select for (u-widgets' v1 minimal catalog).
 * Each entry seeds a minimal-but-visible starting `props` so switching to a type never leaves a
 * widget rendering nothing (u-widgets renders nothing for `status` without a `value`, and
 * `gauge`/`chart.line` need at least one data point). */
export const WIDGET_TYPES = ['status', 'gauge', 'chart.line'] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

/** The words a new `status` widget starts with — its label, and the value shown until it is bound. */
export interface SeedText {
  label: string;
  value: string;
}

const DEFAULT_SEED_TEXT: SeedText = { label: 'New node', value: 'Not bound' };

export function seedWidget(type: WidgetType, text: SeedText = DEFAULT_SEED_TEXT): Widget {
  switch (type) {
    case 'status':
      return { type: 'status', props: { data: { label: text.label, level: 'neutral', value: text.value } } };
    case 'gauge':
      return { type: 'gauge', props: { data: { value: 0 } } };
    case 'chart.line':
      return { type: 'chart.line', props: { data: [{ t: '00:00', value: 0 }], mapping: { x: 't', y: 'value' } } };
  }
}

/** The prop path a new binding of `widget` starts on: the widget's headline value (`data.value` for
 * `status` and `gauge`) when it is not bound yet. Empty for a widget with no headline field
 * (`chart.*`), or once that field is bound — the author names the prop then. */
export function defaultPropPath(widget: Widget): string {
  const field = getPrimaryDataField(widget.type);
  if (field === undefined) return '';
  const path = `data.${field}`;
  return widget.bindings?.[path] ? '' : path;
}
