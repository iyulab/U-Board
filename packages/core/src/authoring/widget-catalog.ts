import { getPrimaryDataField } from '@iyulab/u-widgets';
import { getWidgetLabel } from '@iyulab/u-widgets/tools';
// The widget library's names in Korean, for `widgetTypeName` — authoring code only, as in widget-fields.ts.
import '@iyulab/u-widgets/tools/locales/ko';
import type { ElementDefinition, Widget } from '../view-document.js';
import { ELEMENT_TYPE_PREFIX, elementNameOf } from '../elements/element-type.js';

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
      return { type: 'status', props: { data: { label: text.label, tone: 'idle', value: text.value } } };
    case 'gauge':
      return { type: 'gauge', props: { data: { value: 0 } } };
    case 'chart.line':
      return { type: 'chart.line', props: { data: [{ t: '00:00', value: 0 }], mapping: { x: 't', y: 'value' } } };
  }
}

/** The prop path of a widget type's headline value (`data.value` for `status` and `gauge`) — where a new binding
 * starts while nothing binds it. `undefined` for a type with no headline field (`chart.*`). */
export function headlinePropPath(type: string): string | undefined {
  const field = getPrimaryDataField(type);
  return field === undefined ? undefined : `data.${field}`;
}

/** A widget placing the board's element `name`, starting from the defaults its definition's schema gives its props. */
export function seedElementWidget(name: string, definition: ElementDefinition): Widget {
  const props: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(definition.props?.properties ?? {})) {
    if (schema.default !== undefined) props[key] = schema.default;
  }
  return { type: `${ELEMENT_TYPE_PREFIX}${name}`, props };
}

/** What a widget is called where the editor names it: a prepared widget's name from the widget library, in `locale`,
 *  or the name of the board's element it places. */
export function widgetTypeName(type: string, locale?: string): string {
  return elementNameOf(type) ?? getWidgetLabel(type, locale);
}
