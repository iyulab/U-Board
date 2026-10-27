import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useMemo } from 'react';
import type { ElementDefinition, Widget } from '@iyulab/u-board/picture';
import { readField, widgetFields, withField, type WidgetField } from './widget-fields.js';

export interface WidgetPropsFormProps {
  widget: Widget;
  onChange: (widget: Widget) => void;
  labels?: DesignerLabels;
  /** The board's elements, which a placed element's fields are read from. */
  elements?: Readonly<Record<string, ElementDefinition>>;
}

const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const CHECK_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--ub-space-2, 8px)' };

const text = (value: unknown) => (value === undefined || value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value));

/**
 * A control for each value of the widget the widget library describes — its data fields, and the
 * options whose type is known — or, for an element, each prop its definition's schema lists
 * (`widgetFields`). A typed value is written when the control is left (or a choice is made), not on
 * every keystroke: each change re-resolves the preview's bindings.
 */
export function WidgetPropsForm({ widget, onChange, labels = DEFAULT_DESIGNER_LABELS, elements }: WidgetPropsFormProps) {
  const { fields, otherOptions } = useMemo(() => widgetFields(widget, labels.locale, elements), [widget, labels.locale, elements]);
  if (fields.length === 0 && otherOptions === 0) return null;

  const set = (field: WidgetField, value: unknown) => {
    if (value === readField(widget, field)) return;
    onChange(withField(widget, field, value));
  };

  const control = (field: WidgetField) => (
    <FieldControl
      key={field.path.join('.')}
      field={field}
      value={readField(widget, field)}
      write={value => set(field, value)}
      bound={field.section !== 'options' && widget.bindings?.[field.path.join('.')] !== undefined}
      labels={labels}
    />
  );

  const data = fields.filter(f => f.section === 'data');
  const options = fields.filter(f => f.section === 'options');
  const element = fields.filter(f => f.section === 'element');
  return (
    <div className="ub-panel__widget-form">
      {element.length > 0 && (
        <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>{labels.elementProps}</legend>
          {element.map(control)}
        </fieldset>
      )}
      {data.length > 0 && (
        <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>{labels.widgetData}</legend>
          {data.map(control)}
        </fieldset>
      )}
      {options.length > 0 && (
        <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>{labels.widgetOptions}</legend>
          {options.map(control)}
        </fieldset>
      )}
      {otherOptions > 0 && <p className="ub-panel__hint">{labels.moreInAdvanced.replace('{count}', String(otherOptions))}</p>}
    </div>
  );
}

/** The control for one field: `value` is its value now, `write` sets it (`undefined` takes it out), `bound` marks a value
 *  a binding fills. A typed value is written when the control is left (or a choice is made), not on every keystroke. */
/** The control of one field: a text, a number, a check box or a choice, named as the widget library names it. */
export function FieldControl({ field, value, write, bound = false, labels }: { field: WidgetField; value: unknown; write: (value: unknown) => void; bound?: boolean; labels: DesignerLabels }) {
  const name = (
    <span className="ub-panel__field-name" title={field.description}>
      {field.label} <code>{field.key}</code>
      {bound && <span className="ub-panel__binding-tag"> · {labels.boundField}</span>}
    </span>
  );
  const id = field.path.join('.');
  switch (field.kind) {
    case 'boolean':
      return (
        <label key={id} className="ub-panel__field ub-panel__field--check" style={CHECK_STYLE}>
          <input type="checkbox" checked={value === undefined ? field.defaultValue === true : value === true} onChange={e => write(e.target.checked)} />
          {name}
        </label>
      );
    case 'choice':
      return (
        <label key={id} className="ub-panel__field" style={FIELD_STYLE}>
          {name}
          <select value={typeof value === 'string' ? value : ''} onChange={e => write(e.target.value === '' ? undefined : e.target.value)}>
            <option value="">{field.defaultValue === undefined ? labels.choiceDefault : `${labels.choiceDefault} (${text(field.defaultValue)})`}</option>
            {field.choices!.map(choice => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
      );
    case 'number':
      return (
        <label key={id} className="ub-panel__field" style={FIELD_STYLE}>
          {name}
          <input
            // Re-created when the value changes elsewhere (the JSON editor, an import), so it shows it.
            key={`${id}=${text(value)}`}
            type="number"
            min={field.min}
            max={field.max}
            step={field.integer ? 1 : undefined}
            defaultValue={typeof value === 'number' ? value : ''}
            // Left empty, the widget's own default applies — shown so the empty field does not read as nothing.
            placeholder={field.defaultValue === undefined ? undefined : text(field.defaultValue)}
            onBlur={e => {
              const raw = e.currentTarget.value.trim();
              // Cleared: the widget's own default applies again. A whole-number field keeps whole numbers.
              const number = raw === '' || !Number.isFinite(Number(raw)) ? undefined : Number(raw);
              write(number !== undefined && field.integer ? Math.round(number) : number);
            }}
          />
        </label>
      );
    case 'text':
      return (
        <label key={id} className="ub-panel__field" style={FIELD_STYLE}>
          {name}
          <input
            key={`${id}=${text(value)}`}
            defaultValue={text(value)}
            placeholder={field.defaultValue === undefined ? undefined : text(field.defaultValue)}
            onBlur={e => {
              // Left as shown: nothing to write (an absent value stays absent).
              if (e.currentTarget.value !== text(value)) write(e.currentTarget.value);
            }}
          />
        </label>
      );
  }
}
