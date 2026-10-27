import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useId, useMemo, type ReactNode } from 'react';
import { PART_KINDS, partKind } from '@iyulab/u-board/toolkit';
import { widgetFields } from './widget-fields.js';
import { FieldControl } from './WidgetPropsForm.js';
import type { BoardFinding } from '../board/check.js';
import type { Board, Part } from '@iyulab/u-board/toolkit';

export interface PartPanelProps {
  /** The part's id in the board's `parts`. */
  id: string;
  board: Board;
  /** Replaces the part with what the panel made of it. */
  onChange: (part: Part) => void;
  /** What the board's check finds at this part — shown under it, where it is fixed. */
  findings?: readonly BoardFinding[];
  /** The part's triggers' editor, shown under its settings. */
  triggers?: ReactNode;
  labels?: DesignerLabels;
}

/** `<data>` or `<data>[<key>]`, as a part names what it reads. */
const OF = /^([\w-]+)(?:\[([^\]]+)\])?$/;


/**
 * The panel of a part of a board: its title, its kind, what it reads (a data read,
 * and one item of it by key), which fields it shows, then its kind's options — those the board reads itself (a field's
 * name, offered from what the part reads; one written as a structure is shown, and set by the assistant or the JSON),
 * and the widget's, with the controls the widget library describes. A setting left empty goes from the part, so the
 * board keeps only what was set. A part made per item reads the items its `each` names, shown and not changed here.
 */
export function PartPanel({ id, board, onChange, findings = [], triggers, labels = DEFAULT_DESIGNER_LABELS }: PartPanelProps) {
  const part = board.parts[id] ?? {};
  const fieldList = useId();
  const set = (key: keyof Part, value: unknown) => {
    const { [key]: _gone, ...rest } = part;
    onChange(value === undefined || value === '' ? rest : { ...rest, [key]: value });
  };
  const of = typeof part.of === 'string' ? OF.exec(part.of) : null;
  const data = of?.[1] ?? '';
  const key = of?.[2] ?? '';
  const reads = typeof part.each === 'string' ? part.each : data;
  const fields = Object.keys(board.data?.[reads]?.fields ?? {});
  const show = part.show === undefined ? '' : Array.isArray(part.show) ? part.show.join(', ') : part.show;
  const kind = partKind(part.as ?? (part.use !== undefined ? board.presets?.[part.use]?.as : undefined) ?? '');
  const widgetOptions = useMemo(
    () => (kind?.widget === undefined ? [] : widgetFields({ type: kind.widget, props: {} }, labels.locale).fields.filter(f => f.section === 'options' && kind.options.includes(f.key))),
    [kind, labels.locale]
  );
  const own = (kind?.own ?? []).filter(key => !['size', 'parts', 'place'].includes(key) && !(kind?.kind === 'element' && ['element', 'props', 'bind'].includes(key)));
  const writeOf = (nextData: string, nextKey: string) => set('of', nextData === '' ? undefined : nextKey.trim() === '' ? nextData : `${nextData}[${nextKey.trim()}]`);
  return (
    <div className="ub-panel ub-panel--part">
      <h2 className="ub-panel__heading">{labels.partHeading.replace('{id}', id)}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.partTitle}
        <input type="text" value={part.title ?? ''} onChange={e => set('title', e.target.value)} />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.partKind}
        <select value={part.as ?? ''} onChange={e => set('as', e.target.value)}>
          {part.as === undefined && <option value="">{labels.partFromPreset}</option>}
          {PART_KINDS.map(kind => (
            <option key={kind.kind} value={kind.kind}>
              {kind.kind}
            </option>
          ))}
        </select>
      </label>
      {typeof part.each === 'string' ? (
        <p className="ub-panel__hint">{labels.partEach.replace('{data}', part.each)}</p>
      ) : (
        <>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.partOf}
            <select value={data} onChange={e => writeOf(e.target.value, key)}>
              <option value="">{labels.partOfNone}</option>
              {Object.keys(board.data ?? {}).map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {data !== '' && board.data?.[data]?.list !== undefined && (
            <label className="ub-panel__field" style={FIELD_STYLE}>
              {labels.partItem}
              <input type="text" value={key} placeholder={labels.partItemAll} onChange={e => writeOf(data, e.target.value)} />
            </label>
          )}
        </>
      )}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.partShow}
        <input
          type="text"
          list={fields.length > 0 ? fieldList : undefined}
          value={show}
          onChange={e => {
            const names = e.target.value.split(',').map(name => name.trim()).filter(name => name !== '');
            set('show', names.length === 0 ? undefined : names.length === 1 && !e.target.value.includes(',') ? names[0] : names);
          }}
        />
      </label>
      {fields.length > 0 && (
        <datalist id={fieldList}>
          {fields.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </datalist>
      )}
      {kind?.kind === 'element' && <ElementPartFields part={part} board={board} onChange={onChange} labels={labels} fieldList={fields.length > 0 ? fieldList : undefined} />}
      {own.length > 0 && (
        <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>{labels.partOwnOptions}</legend>
          {own.map(key => {
            const value = (part as Record<string, unknown>)[key];
            const structured = value !== undefined && typeof value !== 'string' && typeof value !== 'number';
            return (
              <div key={key} className="ub-panel__field" style={FIELD_STYLE}>
                <code aria-hidden="true">{key}</code>
                <input
                  type="text"
                  aria-label={key}
                  list={fields.length > 0 ? fieldList : undefined}
                  value={structured ? JSON.stringify(value) : value === undefined ? '' : String(value)}
                  readOnly={structured}
                  title={structured ? labels.partStructured : undefined}
                  onChange={e => {
                    const text = e.target.value.trim();
                    set(key as keyof typeof part, text !== '' && /^-?\d+(\.\d+)?$/.test(text) && key === 'max' ? Number(text) : text);
                  }}
                />
              </div>
            );
          })}
        </fieldset>
      )}
      {widgetOptions.length > 0 && (
        <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>{labels.partWidgetOptions}</legend>
          {widgetOptions.map(field => (
            <FieldControl
              key={field.key}
              field={field}
              value={(part as Record<string, unknown>)[field.key]}
              write={value => set(field.key as keyof typeof part, value)}
              labels={labels}
            />
          ))}
        </fieldset>
      )}
      {triggers}
      {findings.length > 0 && (
        <ul className="ub-panel__findings" role="alert">
          {findings.map(finding => (
            <li key={`${finding.path}:${finding.message}`}>{finding.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ElementPartFieldsProps {
  part: Part;
  board: Board;
  onChange: (part: Part) => void;
  labels: DesignerLabels;
  fieldList: string | undefined;
}

/**
 * An element part's drawing: which of the board's elements, and each prop it takes — bound to a field of what the
 * part reads (`<field>`, or its status `<field>.status` or tone `<field>.tone`), or fixed. A prop that takes a list or
 * a record is fixed only in the board's JSON.
 */
function ElementPartFields({ part, board, onChange, labels, fieldList }: ElementPartFieldsProps) {
  const name = typeof part.element === 'string' ? part.element : '';
  const props = board.elements?.[name]?.props ?? {};
  const bind = (part.bind ?? {}) as Record<string, string>;
  const fixed = (part.props ?? {}) as Record<string, unknown>;
  /** The part with its bound and fixed props as given — an empty set of either left out. */
  const write = (nextBind: Record<string, unknown>, nextFixed: Record<string, unknown>) => {
    const { bind: _b, props: _p, ...rest } = part;
    onChange({ ...rest, ...(Object.keys(nextFixed).length > 0 ? { props: nextFixed } : {}), ...(Object.keys(nextBind).length > 0 ? { bind: nextBind } : {}) });
  };
  return (
    <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
      <legend>{labels.elementProps}</legend>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.boardElements}
        <select value={name} onChange={e => onChange({ ...part, element: e.target.value })}>
          {name === '' && <option value="">—</option>}
          {Object.keys(board.elements ?? {}).map(element => (
            <option key={element} value={element}>
              {element}
            </option>
          ))}
        </select>
      </label>
      {Object.entries(props).map(([prop, type]) => {
        const structured = type === 'list' || type === 'object';
        const value = bind[prop] ?? (fixed[prop] === undefined ? '' : String(fixed[prop]));
        return (
          <div key={prop} className="ub-panel__field" style={FIELD_STYLE}>
            <code aria-hidden="true">
              {prop} · {type}
            </code>
            <input
              type="text"
              aria-label={prop}
              list={fieldList}
              value={structured && prop in fixed ? JSON.stringify(fixed[prop]) : value}
              readOnly={structured && prop in fixed}
              onChange={e => {
                const text = e.target.value.trim();
                const { [prop]: _b, ...restBind } = bind;
                const { [prop]: _f, ...restFixed } = fixed;
                // A field's name (or its status, its tone) binds the prop; a value of the prop's type fixes it.
                const asFixed = type === 'number' && /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : type === 'boolean' && /^(true|false)$/.test(text) ? text === 'true' : undefined;
                if (text === '') write(restBind, restFixed);
                else if (asFixed !== undefined || (type === 'string' && text.startsWith('"'))) write(restBind, { ...restFixed, [prop]: asFixed ?? text.replace(/^"|"$/g, '') });
                else write({ ...restBind, [prop]: text }, restFixed);
              }}
            />
          </div>
        );
      })}
    </fieldset>
  );
}
