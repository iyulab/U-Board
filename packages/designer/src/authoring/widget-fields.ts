import { getWidgetDataFields, getWidgetOptions } from '@iyulab/u-widgets/tools';
// The widget library's names in Korean — the language U-Board ships labels for besides English
// (`KO_LABELS`). Registered here, with the authoring code, so a viewer never loads them.
import '@iyulab/u-widgets/tools/locales/ko';
import type { ElementDefinition, PropsSchema, Widget } from '@iyulab/u-board/picture';
import { elementNameOf } from '@iyulab/u-board/toolkit';

/** A value of a widget's props the property panel offers its own control for. */
export interface WidgetField {
  /** Which group it is shown in: a prepared widget's `props.data` or `props.options`, an element's own props, or a
   *  component instance's parameter values. */
  section: 'data' | 'options' | 'element' | 'params';
  /** Where it lives in the widget's props — also the path a binding that fills it names (`data.value`, `level`). */
  path: readonly string[];
  key: string;
  /** Its name, in the requested language, from the widget library — or an element's `title`. */
  label: string;
  kind: 'text' | 'number' | 'boolean' | 'choice';
  /** The values a `choice` field takes. */
  choices?: readonly string[];
  /** Bounds of a `number` field, and whether it takes whole numbers only. */
  min?: number;
  max?: number;
  integer?: boolean;
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

/** The control for a prop an element's schema describes, or none for one edited as JSON (a list, an object, a
 *  value of several types, a choice that is not all text). */
function schemaKind(schema: PropsSchema): Pick<WidgetField, 'kind' | 'choices' | 'min' | 'max' | 'integer'> | undefined {
  if (schema.enum !== undefined) {
    return schema.enum.every(value => typeof value === 'string') ? { kind: 'choice', choices: schema.enum as string[] } : undefined;
  }
  switch (schema.type) {
    case 'string':
      return { kind: 'text' };
    case 'number':
    case 'integer':
      return {
        kind: 'number',
        ...(schema.minimum !== undefined && { min: schema.minimum }),
        ...(schema.maximum !== undefined && { max: schema.maximum }),
        ...(schema.type === 'integer' && { integer: true }),
      };
    case 'boolean':
      return { kind: 'boolean' };
    default:
      return undefined;
  }
}

/** The fields of an object schema — an element's props, a component's parameters: one per property it lists, in the
 *  schema's order; a property no control edits (a list, an object) is counted in `otherOptions`. */
export function schemaFields(schema: PropsSchema | undefined, section: WidgetField['section']): WidgetFields {
  const fields: WidgetField[] = [];
  let otherOptions = 0;
  for (const [key, property] of Object.entries(schema?.properties ?? {})) {
    const kind = schemaKind(property);
    if (!kind) {
      otherOptions++;
      continue;
    }
    fields.push({
      section,
      path: [key],
      key,
      label: property.title ?? key,
      ...kind,
      ...(property.default !== undefined && { defaultValue: property.default }),
      ...(property.description !== undefined && { description: property.description }),
    });
  }
  return { fields, otherOptions };
}

/** The fields of a placed element: one per prop its definition's schema lists, in the schema's order. */
function elementFields(definition: ElementDefinition | undefined): WidgetFields {
  return schemaFields(definition?.props, 'element');
}

/**
 * The fields of `widget` the panel can edit with a control. For a prepared widget, as the widget library describes
 * them (`@iyulab/u-widgets/tools`): its known data fields — when `props.data` is a single object; data given as an
 * array of rows is edited as JSON — and the options it reads whose value is a text, a number, a yes/no or a choice.
 * For an element (`element:<name>`), the props its definition in `elements` lists. Anything else stays in the JSON
 * editor. Names are in `locale` (the labels' language).
 */
export function widgetFields(widget: Widget, locale?: string, elements?: Readonly<Record<string, ElementDefinition>>): WidgetFields {
  const element = elementNameOf(widget.type);
  if (element !== undefined) return elementFields(elements && Object.hasOwn(elements, element) ? elements[element] : undefined);

  const props = isRecord(widget.props) ? widget.props : {};
  const fields: WidgetField[] = [];

  if (props.data === undefined || isRecord(props.data)) {
    for (const field of getWidgetDataFields(widget.type, locale)) {
      const kind = kindOf(field.type, field.enum);
      if (kind) fields.push({ section: 'data', path: ['data', field.key], key: field.key, label: field.label, ...kind, description: field.desc });
    }
  }

  let otherOptions = 0;
  for (const option of getWidgetOptions(widget.type, locale)) {
    const kind = kindOf(option.type, option.enum);
    if (!kind) {
      otherOptions++;
      continue;
    }
    fields.push({
      section: 'options',
      path: ['options', option.key],
      key: option.key,
      label: option.label,
      ...kind,
      ...(option.default !== undefined && { defaultValue: option.default }),
      description: option.desc,
    });
  }
  return { fields, otherOptions };
}

/** The value of `field` in `widget`'s props, or `undefined` when it is not set. */
export function readField(widget: Widget, field: Pick<WidgetField, 'path'>): unknown {
  let value: unknown = widget.props;
  for (const segment of field.path) value = isRecord(value) ? value[segment] : undefined;
  return value;
}

/** `widget` with one field set — or removed, when `value` is `undefined`. Everything else in its props (mapping,
 * other options, keys this panel does not know) is kept as it was; an `options` object left empty goes too. */
export function withField(widget: Widget, field: Pick<WidgetField, 'path'>, value: unknown): Widget {
  const set = (container: unknown, path: readonly string[]): Record<string, unknown> => {
    const next = isRecord(container) ? { ...container } : {};
    const [head, ...rest] = path;
    const child = rest.length === 0 ? value : set(next[head], rest);
    if (child === undefined || (head === 'options' && isRecord(child) && Object.keys(child).length === 0)) delete next[head];
    else next[head] = child;
    return next;
  };
  return { ...widget, props: set(widget.props, field.path) };
}
