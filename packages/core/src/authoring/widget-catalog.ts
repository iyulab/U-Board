import type { Widget } from '../view-document.js';

/** The widget types the property panel offers a type-select for (u-widgets' v1 minimal catalog —
 * ROADMAP.md "위젯 3~4종"). Each entry seeds a minimal-but-visible starting `props` so switching
 * to a type never leaves a widget rendering nothing (u-widgets renders nothing for `status`
 * without a `value`, and `gauge`/`chart.line` need at least one data point). */
export const WIDGET_TYPES = ['status', 'gauge', 'chart.line'] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export function seedWidget(type: WidgetType): Widget {
  switch (type) {
    case 'status':
      return { type: 'status', props: { data: { label: 'New node', level: 'neutral', value: 'unbound' } } };
    case 'gauge':
      return { type: 'gauge', props: { data: { value: 0 } } };
    case 'chart.line':
      return { type: 'chart.line', props: { data: [{ t: '00:00', value: 0 }], mapping: { x: 't', y: 'value' } } };
  }
}
