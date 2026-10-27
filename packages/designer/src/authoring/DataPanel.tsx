import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useState } from 'react';
import { ERROR_STYLE, GROUP_STYLE } from '@iyulab/u-board/toolkit';
import type { Field, Query } from '@iyulab/u-board/toolkit';
import { MappingEditor } from './MappingEditor.js';

/** A data source a board may read from, as its host names it — one of the adapters the host gives. */
export interface DataSource {
  id: string;
  label?: string;
}

export interface DataPanelProps {
  data: Readonly<Record<string, Query>> | undefined;
  /** The board's data as the panel made them — none left: `undefined`. */
  onChange: (data: Record<string, Query> | undefined) => void;
  /** Where a read may come from — the host's sources. */
  sources: readonly DataSource[];
  /** Reads one of the board's data as the board reads it whole: the list, or the one item. Omitted, there is no looking. */
  look?: (name: string) => Promise<unknown>;
  /** The board's statuses, by name — what a field's status maps to. */
  statuses?: readonly string[];
  labels?: DesignerLabels;
}

/** Whether new data may take `name`: a name parts can address (`<data>[<key>]`), not one taken. */
const usable = (name: string, taken: Readonly<Record<string, unknown>>) => /^[\w-]+$/.test(name.trim()) && !Object.hasOwn(taken, name.trim());
/** Whether a new field may take `name`: any name an item's field has, not an empty one or one taken. */
const usableField = (name: string, taken: Readonly<Record<string, unknown>>) => name.trim() !== '' && !Object.hasOwn(taken, name.trim());

/** The fields an item read has: an object's own names, or those of a list's first item. */
function fieldsIn(value: unknown): string[] {
  const item = Array.isArray(value) ? value[0] : value;
  return typeof item === 'object' && item !== null && !Array.isArray(item) ? Object.keys(item) : [];
}

/** A query without the settings emptied in the panel. */
function tidy<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== '')) as T;
}

/**
 * The board's data — each read: where from (a source of the host's), what is asked, the list in the answer and the
 * field naming its items, and the meaning of its fields (a name, a unit, decimal places, a format). Looking reads the
 * data now and offers the fields it found. A field's value names and state are written as structures and shown, not
 * edited, here.
 */
export function DataPanel({ data = {}, onChange, sources, look, statuses = [], labels = DEFAULT_DESIGNER_LABELS }: DataPanelProps) {
  const [name, setName] = useState('');
  const write = (next: Record<string, Query>) => onChange(Object.keys(next).length > 0 ? next : undefined);
  const set = (key: string, change: Partial<Query>) => write({ ...data, [key]: tidy({ ...data[key]!, ...change }) });
  const setField = (key: string, field: string, change: Partial<Field> | null) => {
    const { [field]: before, ...others } = data[key]!.fields ?? {};
    const fields = change === null ? others : { ...data[key]!.fields, [field]: tidy({ ...before, ...change }) };
    set(key, { fields: Object.keys(fields).length > 0 ? fields : undefined });
  };
  const remove = (key: string) => {
    const { [key]: _gone, ...rest } = data;
    write(rest);
  };
  return (
    <div className="ub-panel ub-panel--data">
      <h2 className="ub-panel__heading">{labels.dataHeading}</h2>
      {Object.entries(data).map(([key, query]) => (
        <DataRead key={key} name={key} query={query} sources={sources} look={look} statuses={statuses} labels={labels} set={change => set(key, change)} setField={(field, change) => setField(key, field, change)} remove={() => remove(key)} />
      ))}
      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.dataNew}
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <button
          type="button"
          className="ub-action"
          disabled={!usable(name, data) || sources.length === 0}
          onClick={() => {
            write({ ...data, [name.trim()]: { from: sources[0]!.id, path: '/' } });
            setName('');
          }}
        >
          {labels.dataAdd}
        </button>
      </div>
      {/* With no source to read from, where one comes from — the add button stays off until there is one. */}
      {sources.length === 0 && <p className="ub-panel__hint">{labels.noDataSources}</p>}
    </div>
  );
}

/** Items picked by their fields, as written — `kind=PM10, site=north` — a number (not one with a leading zero, an id) or
 *  `true`/`false` as one, the rest as text; `null` when it is not pairs, `undefined` when empty. */
export function parseWhere(text: string): Record<string, string | number | boolean> | null | undefined {
  if (text.trim() === '') return undefined;
  const where: Record<string, string | number | boolean> = {};
  for (const pair of text.split(',')) {
    const at = pair.indexOf('=');
    const field = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    if (at < 0 || field === '' || value === '') return null;
    where[field] = /^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) ? Number(value) : value === 'true' ? true : value === 'false' ? false : value;
  }
  return where;
}

const whereText = (where: Query['where']) => (where ? Object.entries(where).map(([field, value]) => `${field}=${value}`).join(', ') : '');

/** The finer points of a request read, folded: which items, when they were observed, how long a value stays current, the
 *  source's time zone, the time its request asks for, and a long answer read as one item. */
function ReadDetails({ query, labels, set }: { query: Query; labels: DesignerLabels; set: (change: Partial<Query>) => void }) {
  const [where, setWhere] = useState(() => whereText(query.where));
  const whereRead = parseWhere(where);
  const text = (label: string, value: string | undefined, change: (value: string) => void) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input type="text" value={value ?? ''} onChange={e => change(e.target.value)} />
    </label>
  );
  const seconds = (label: string, value: number | undefined, change: (value: number | undefined) => void) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input type="number" min={0} value={value ?? ''} onChange={e => change(e.target.value === '' ? undefined : Number(e.target.value))} />
    </label>
  );
  const setNow = (change: Partial<NonNullable<Query['now']>>) => {
    const now = Object.fromEntries(Object.entries({ ...query.now, ...change }).filter(([, v]) => v !== undefined));
    set({ now: Object.keys(now).length > 0 ? now : undefined });
  };
  const setPivot = (change: Partial<NonNullable<Query['pivot']>>) => {
    const pivot = { key: query.pivot?.key ?? '', value: query.pivot?.value ?? '', ...change };
    set({ pivot: pivot.key.trim() === '' && pivot.value.trim() === '' ? undefined : pivot });
  };
  const open = [query.where, query.time, query.answerTime, query.fresh, query.zone, query.now, query.pivot].some(v => v !== undefined);
  return (
    <details className="ub-panel__details" open={open}>
      <summary>{labels.dataDetails}</summary>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.dataWhere}
        <input
          type="text"
          value={where}
          aria-invalid={whereRead === null}
          onChange={e => {
            setWhere(e.target.value);
            const read = parseWhere(e.target.value);
            if (read !== null) set({ where: read });
          }}
        />
        {whereRead === null && (
          <span role="alert" style={ERROR_STYLE}>
            {labels.dataWhereInvalid}
          </span>
        )}
      </label>
      {text(labels.dataTime, query.time, time => set({ time }))}
      {text(labels.dataAnswerTime, query.answerTime, answerTime => set({ answerTime }))}
      {seconds(labels.dataFresh, query.fresh, fresh => set({ fresh }))}
      {text(labels.dataZone, query.zone, zone => set({ zone }))}
      {seconds(labels.dataNowDelay, query.now?.delay, delay => setNow({ delay }))}
      {seconds(labels.dataNowStep, query.now?.step, step => setNow({ step }))}
      {text(labels.dataPivotKey, query.pivot?.key, key => setPivot({ key }))}
      {text(labels.dataPivotValue, query.pivot?.value, value => setPivot({ value }))}
    </details>
  );
}

interface DataReadProps {
  name: string;
  statuses: readonly string[];
  query: Query;
  sources: readonly DataSource[];
  look?: (name: string) => Promise<unknown>;
  labels: DesignerLabels;
  set: (change: Partial<Query>) => void;
  setField: (field: string, change: Partial<Field> | null) => void;
  remove: () => void;
}

function DataRead({ name, query, sources, look, statuses, labels, set, setField, remove }: DataReadProps) {
  const [field, setFieldName] = useState('');
  const [found, setFound] = useState<string[] | 'reading' | null>(null);
  const fields = query.fields ?? {};
  const known = sources.some(s => s.id === query.from) ? sources : [...sources, { id: query.from }];
  const text = (label: string, value: string | undefined, change: (value: string) => void) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input type="text" value={value ?? ''} onChange={e => change(e.target.value)} />
    </label>
  );
  return (
    <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
      <legend>
        <code>{name}</code>
      </legend>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.dataFrom}
        <select value={query.from} onChange={e => set({ from: e.target.value })}>
          {known.map(source => (
            <option key={source.id} value={source.id}>
              {source.label ?? source.id}
            </option>
          ))}
        </select>
      </label>
      {query.ref !== undefined ? (
        <p className="ub-panel__hint">{labels.dataByRef}</p>
      ) : (
        <>
          {text(labels.dataPath, query.path, path => set({ path }))}
          {text(labels.dataList, query.list, list => set({ list }))}
          {text(labels.dataKey, query.key, key => set({ key }))}
          <ReadDetails query={query} labels={labels} set={set} />
        </>
      )}
      <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
        <legend>{labels.dataFields}</legend>
        {Object.entries(fields).map(([fieldName, f]) => (
          <fieldset key={fieldName} className="ub-panel__group" style={{ minWidth: 0 }}>
            <legend>
              <code>{fieldName}</code>
            </legend>
            {text(labels.dataFieldLabel, f.label, label => setField(fieldName, { label }))}
            {text(labels.dataFieldUnit, f.unit, unit => setField(fieldName, { unit }))}
            <label className="ub-panel__field" style={FIELD_STYLE}>
              {labels.dataFieldDigits}
              <input type="number" min={0} step={1} value={f.digits ?? ''} onChange={e => setField(fieldName, { digits: e.target.value === '' ? undefined : Number(e.target.value) })} />
            </label>
            {text(labels.dataFieldFormat, f.format, format => setField(fieldName, { format }))}
            <MappingEditor
              legend={labels.dataFieldState}
              value={f.state}
              raw
              names={statuses}
              onChange={state => setField(fieldName, { state })}
              labels={labels}
            />
            <MappingEditor
              legend={labels.dataFieldNames}
              value={f.names}
              onChange={names => setField(fieldName, { names: names === 'raw' ? undefined : names })}
              labels={labels}
            />
            <button type="button" className="ub-action" onClick={() => setField(fieldName, null)}>
              {labels.dataFieldRemove.replace('{name}', fieldName)}
            </button>
          </fieldset>
        ))}
        <div className="ub-panel__actions" style={GROUP_STYLE}>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.dataFieldNew}
            <input type="text" value={field} onChange={e => setFieldName(e.target.value)} />
          </label>
          <button
            type="button"
            className="ub-action"
            disabled={!usableField(field, fields)}
            onClick={() => {
              setField(field.trim(), {});
              setFieldName('');
            }}
          >
            {labels.dataFieldAdd}
          </button>
        </div>
      </fieldset>
      {look && (
        <div className="ub-panel__actions" style={GROUP_STYLE}>
          <button
            type="button"
            className="ub-action"
            disabled={found === 'reading'}
            onClick={() => {
              setFound('reading');
              look(name).then(value => setFound(fieldsIn(value)), () => setFound([]));
            }}
          >
            {found === 'reading' ? labels.dataLooking : labels.dataLook}
          </button>
          {Array.isArray(found) &&
            (found.length === 0 ? (
              <p role="status">{labels.dataFoundNone}</p>
            ) : (
              <div role="group" aria-label={labels.dataFound}>
                {found.filter(f => !Object.hasOwn(fields, f)).map(f => (
                  <button key={f} type="button" className="ub-action" onClick={() => setField(f, {})}>
                    {labels.dataFoundAdd.replace('{name}', f)}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
      <button type="button" className="ub-action" onClick={remove}>
        {labels.dataRemove.replace('{name}', name)}
      </button>
    </fieldset>
  );
}
