import { WIDGET_DATA_FIELDS, getWidgetOptions } from '@iyulab/u-widgets/tools';
import type { Widget } from '../view-document.js';

/** A value of a widget's props the property panel offers its own control for. */
export interface WidgetField {
  /** Where it lives: `props.data` or `props.options`. */
  section: 'data' | 'options';
  key: string;
  kind: 'text' | 'number' | 'boolean' | 'choice';
  /** The values a `choice` field takes. */
  choices?: readonly string[];
  /** What the widget uses when the value is left out, when the widget library says. */
  defaultValue?: unknown;
  /** What the widget library says the value is. */
  description?: string;
}

export interface WidgetFields {
  fields: WidgetField[];
  /** Options the widget reads that have no control here (lists, objects) — edited as JSON instead. */
  otherOptions: number;
}

/** The control for a value of `type` (in the widget library's notation), or none for a list or an object. */
function kindOf(type: string, choices: readonly string[] | undefined): Pick<WidgetField, 'kind' | 'choices'> | undefined {
  if (choices) return { kind: 'choice', choices };
  if (type === 'string') return { kind: 'text' };
  if (type === 'number') return { kind: 'number' };
  if (type === 'boolean') return { kind: 'boolean' };
  return undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The fields of `widget` the panel can edit with a control, as the widget library describes them
 * (`@iyulab/u-widgets/tools`): its known data fields — when `props.data` is a single object; data
 * given as an array of rows is edited as JSON — and the options it reads whose value is a text, a
 * number, a yes/no or a choice. Anything else stays in the JSON editor.
 */
export function widgetFields(widget: Widget): WidgetFields {
  const props = isRecord(widget.props) ? widget.props : {};
  const fields: WidgetField[] = [];

  if (props.data === undefined || isRecord(props.data)) {
    for (const field of WIDGET_DATA_FIELDS[widget.type] ?? []) {
      const kind = kindOf(field.type, field.enum);
      if (kind) fields.push({ section: 'data', key: field.key, ...kind, description: field.desc });
    }
  }

  let otherOptions = 0;
  for (const option of getWidgetOptions(widget.type)) {
    const kind = kindOf(option.type, option.enum);
    if (!kind) {
      otherOptions++;
      continue;
    }
    fields.push({
      section: 'options',
      key: option.key,
      ...kind,
      ...(option.default !== undefined && { defaultValue: option.default }),
      description: option.desc,
    });
  }
  return { fields, otherOptions };
}

/** `widget` with one field set — or removed, when `value` is `undefined`. Everything else in its
 * props (mapping, other options, keys this panel does not know) is kept as it was. */
export function withField(widget: Widget, field: Pick<WidgetField, 'section' | 'key'>, value: unknown): Widget {
  const props = isRecord(widget.props) ? widget.props : {};
  const section = isRecord(props[field.section]) ? { ...(props[field.section] as Record<string, unknown>) } : {};
  if (value === undefined) delete section[field.key];
  else section[field.key] = value;
  const nextProps = { ...props };
  if (Object.keys(section).length === 0 && field.section === 'options') delete nextProps.options;
  else nextProps[field.section] = section;
  return { ...widget, props: nextProps };
}
