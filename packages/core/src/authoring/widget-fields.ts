import { WIDGET_DATA_FIELDS, WIDGET_OPTIONS, specSurface, help, template } from '@iyulab/u-widgets/tools';
import type { Widget } from '../view-document.js';

/** A value of a widget's props the property panel offers its own control for. */
export interface WidgetField {
  /** Where it lives: `props.data` or `props.options`. */
  section: 'data' | 'options';
  key: string;
  kind: 'text' | 'number' | 'boolean' | 'choice';
  /** The values a `choice` field takes. */
  choices?: readonly string[];
  /** What the widget library says the value is. */
  description?: string;
}

export interface WidgetFields {
  fields: WidgetField[];
  /** Options the widget library lists that have no control here — edited as JSON instead. */
  otherOptions: number;
}

// TODO(upstream): @iyulab/u-widgets/tools lists a widget's option keys and describes them in prose,
// but gives no value types, choices or short localizable names. Until it does, option types are
// inferred from the library's own examples and template (and the widget's current props) through
// its `specSurface`, choices are read from a data field's type string, and the label is the
// library's description. When the metadata carries these, read them directly and drop the inference.

/** `"a" | "b"` — the choices of a data field whose type is a union of string literals. */
export function literalChoices(type: string): string[] | undefined {
  const parts = type.split('|').map(part => part.trim());
  const choices = parts.map(part => /^"([^"]*)"$/.exec(part)?.[1]);
  return parts.length > 1 && choices.every(c => c !== undefined) ? (choices as string[]) : undefined;
}

function kindOf(type: string): Pick<WidgetField, 'kind' | 'choices'> | undefined {
  if (type === 'string') return { kind: 'text' };
  if (type === 'number') return { kind: 'number' };
  if (type === 'boolean') return { kind: 'boolean' };
  const choices = literalChoices(type);
  return choices ? { kind: 'choice', choices } : undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The fields of `widget` the panel can edit with a control: the widget library's known data fields
 * (when `props.data` is a single object — data given as an array of rows is edited as JSON), and the
 * options whose value type is known. Anything else stays in the JSON editor.
 */
export function widgetFields(widget: Widget): WidgetFields {
  const props = isRecord(widget.props) ? widget.props : {};
  const fields: WidgetField[] = [];

  if (props.data === undefined || isRecord(props.data)) {
    for (const field of WIDGET_DATA_FIELDS[widget.type] ?? []) {
      const kind = kindOf(field.type);
      if (kind) fields.push({ section: 'data', key: field.key, ...kind, description: field.desc });
    }
  }

  const listed = WIDGET_OPTIONS[widget.type] ?? [];
  const detail = help(widget.type);
  const examples = Array.isArray(detail) ? [] : detail.examples.map(example => example.spec);
  const starter = template(widget.type);
  const samples: object[] = [...examples, ...(starter ? [starter] : []), { widget: widget.type, ...props }];
  const known = new Map(specSurface(samples, widget.type).optionKeys.map(option => [option.key, option]));
  let shown = 0;
  for (const key of listed) {
    const option = known.get(key);
    const kind = option && kindOf(option.type);
    if (!kind) continue;
    fields.push({ section: 'options', key, ...kind, description: option.desc });
    shown++;
  }
  return { fields, otherOptions: listed.length - shown };
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
