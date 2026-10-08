import { useMemo } from 'react';
import type { Widget } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { widgetFields, withField, type WidgetField } from './widget-fields.js';

export interface WidgetPropsFormProps {
  widget: Widget;
  onChange: (widget: Widget) => void;
  labels?: UBoardLabels;
}

const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const CHECK_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--ub-space-2, 8px)' };

function read(widget: Widget, field: WidgetField): unknown {
  const section = widget.props?.[field.section];
  return typeof section === 'object' && section !== null && !Array.isArray(section) ? (section as Record<string, unknown>)[field.key] : undefined;
}

const text = (value: unknown) => (value === undefined || value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value));

/**
 * A control for each value of the widget the widget library describes — its data fields, and the
 * options whose type is known (`widgetFields`). A typed value is written when the control is left
 * (or a choice is made), not on every keystroke: each change re-resolves the preview's bindings.
 */
export function WidgetPropsForm({ widget, onChange, labels = DEFAULT_LABELS }: WidgetPropsFormProps) {
  const { fields, otherOptions } = useMemo(() => widgetFields(widget), [widget]);
  if (fields.length === 0 && otherOptions === 0) return null;

  const set = (field: WidgetField, value: unknown) => {
    if (value === read(widget, field)) return;
    onChange(withField(widget, field, value));
  };

  const control = (field: WidgetField) => {
    const value = read(widget, field);
    const bound = field.section === 'data' && widget.bindings?.[`data.${field.key}`] !== undefined;
    const name = (
      <span className="ub-panel__field-name">
        {field.description ?? field.key} <code>{field.key}</code>
        {bound && <span className="ub-panel__binding-tag"> · {labels.boundField}</span>}
      </span>
    );
    const id = `${field.section}.${field.key}`;
    switch (field.kind) {
      case 'boolean':
        return (
          <label key={id} className="ub-panel__field ub-panel__field--check" style={CHECK_STYLE}>
            <input type="checkbox" checked={value === true} onChange={e => set(field, e.target.checked)} />
            {name}
          </label>
        );
      case 'choice':
        return (
          <label key={id} className="ub-panel__field" style={FIELD_STYLE}>
            {name}
            <select value={typeof value === 'string' ? value : ''} onChange={e => set(field, e.target.value === '' ? undefined : e.target.value)}>
              <option value="">{labels.choiceDefault}</option>
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
              defaultValue={typeof value === 'number' ? value : ''}
              onBlur={e => {
                const raw = e.currentTarget.value.trim();
                // Cleared: the widget's own default applies again.
                set(field, raw === '' || !Number.isFinite(Number(raw)) ? undefined : Number(raw));
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
              onBlur={e => {
                // Left as shown: nothing to write (an absent value stays absent).
                if (e.currentTarget.value !== text(value)) set(field, e.currentTarget.value);
              }}
            />
          </label>
        );
    }
  };

  const data = fields.filter(f => f.section === 'data');
  const options = fields.filter(f => f.section === 'options');
  return (
    <div className="ub-panel__widget-form">
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
