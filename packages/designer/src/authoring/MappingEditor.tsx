import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useId, useState } from 'react';
import { ERROR_STYLE, GROUP_STYLE } from '@iyulab/u-board/toolkit';
import type { ValueMapping } from '@iyulab/u-board/toolkit';

/** How a mapping is written: by value (a map, `*` for anything else), or by number bands. */
type Form = 'map' | 'bands';

/** A map's rows as the editor holds them — the value it maps, and the name it maps it to. */
interface Row {
  from: string;
  to: string;
}

const formOf = (value: ValueMapping): Form => (Array.isArray(value) ? 'bands' : 'map');
const rowsOf = (value: ValueMapping | undefined): Row[] =>
  value && !Array.isArray(value) ? Object.entries(value).filter(([from]) => from !== '*').map(([from, to]) => ({ from, to })) : [];
const bandsText = (value: ValueMapping | undefined) => (Array.isArray(value) ? value.join(', ') : '');

/** Bands as written — `ok, 1, warn, 5, alarm`: names and rising numbers in turn, from a name — or `undefined` when they
 *  are not. */
export function parseBands(text: string): (string | number)[] | undefined {
  const parts = text.split(',').map(part => part.trim());
  if (parts.length < 3 || parts.length % 2 === 0) return undefined;
  const bands: (string | number)[] = [];
  for (const [i, part] of parts.entries()) {
    if (i % 2 === 0) {
      if (part === '') return undefined;
      bands.push(part);
    } else {
      const bound = Number(part);
      if (part === '' || !Number.isFinite(bound) || (i > 1 && bound <= (bands[i - 2] as number))) return undefined;
      bands.push(bound);
    }
  }
  return bands;
}

export interface MappingEditorProps {
  /** What the mapping is for, as its legend says it: a field's status, or its words. */
  legend: string;
  value: ValueMapping | 'raw' | undefined;
  /** The mapping as the editor made it — none: `undefined`. */
  onChange: (value: ValueMapping | 'raw' | undefined) => void;
  /** Offer «the value already is a status name» (`raw`) — a status, not words. */
  raw?: boolean;
  /** The names a mapping may map to, to choose from — the board's statuses. */
  names?: readonly string[];
  labels?: DesignerLabels;
}

/**
 * A mapping of a field's raw value to a name — its status, or the words it is shown as — in the language's two forms: by
 * value (`{ "down": "alarm", "*": "off" }`) or by number bands (`["ok", 1, "warn", 5, "alarm"]`); for a status, also
 * «the value already is one» (`raw`). A row with no value, and bands that do not read, are not written.
 */
export function MappingEditor({ legend, value, onChange, raw = false, names = [], labels = DEFAULT_DESIGNER_LABELS }: MappingEditorProps) {
  const list = useId();
  // A form chosen before it holds anything to write: shown while the mapping is still none.
  const [drafting, setDrafting] = useState<Form | null>(null);
  const kind = value === undefined ? (drafting ?? 'none') : value === 'raw' ? 'raw' : formOf(value);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(value === 'raw' ? undefined : value));
  const [otherwise, setOtherwise] = useState(() => (value && value !== 'raw' && !Array.isArray(value) ? (value['*'] ?? '') : ''));
  const [bands, setBands] = useState(() => bandsText(value === 'raw' ? undefined : value));
  const writeMap = (nextRows: Row[], nextOtherwise: string) => {
    const map: Record<string, string> = {};
    for (const row of nextRows) if (row.from.trim() !== '' && row.to.trim() !== '') map[row.from.trim()] = row.to.trim();
    if (nextOtherwise.trim() !== '') map['*'] = nextOtherwise.trim();
    setDrafting('map');
    onChange(Object.keys(map).length > 0 ? map : undefined);
  };
  const setRow = (i: number, change: Partial<Row>) => {
    const next = rows.map((row, j) => (j === i ? { ...row, ...change } : row));
    setRows(next);
    writeMap(next, otherwise);
  };
  const choose = (next: string) => {
    setDrafting(null);
    if (next === 'none') onChange(undefined);
    else if (next === 'raw') onChange('raw');
    else if (next === 'map') writeMap(rows, otherwise);
    else {
      setDrafting('bands');
      onChange(parseBands(bands));
    }
  };
  const nameInput = (text: string, label: string, change: (text: string) => void) => (
    <input type="text" aria-label={label} list={names.length > 0 ? list : undefined} value={text} onChange={e => change(e.target.value)} />
  );
  const bandsRead = parseBands(bands);
  return (
    <fieldset className="ub-panel__group" style={{ minWidth: 0 }}>
      <legend>{legend}</legend>
      <select aria-label={legend} value={kind} onChange={e => choose(e.target.value)}>
        <option value="none">{labels.mappingNone}</option>
        {raw && <option value="raw">{labels.mappingRaw}</option>}
        <option value="map">{labels.mappingMap}</option>
        <option value="bands">{labels.mappingBands}</option>
      </select>
      {names.length > 0 && (
        <datalist id={list}>
          {names.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </datalist>
      )}
      {kind === 'map' && (
        <>
          {rows.map((row, i) => (
            <div key={i} className="ub-panel__field" style={GROUP_STYLE}>
              <input type="text" aria-label={labels.mappingFrom.replace('{n}', String(i + 1))} value={row.from} onChange={e => setRow(i, { from: e.target.value })} />
              {nameInput(row.to, labels.mappingTo.replace('{n}', String(i + 1)), to => setRow(i, { to }))}
            </div>
          ))}
          <button type="button" className="ub-action" onClick={() => setRows([...rows, { from: '', to: '' }])}>
            {labels.mappingAddRow}
          </button>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.mappingOtherwise}
            {nameInput(otherwise, labels.mappingOtherwise, text => {
              setOtherwise(text);
              writeMap(rows, text);
            })}
          </label>
        </>
      )}
      {kind === 'bands' && (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.mappingBandsText}
          <input
            type="text"
            value={bands}
            aria-invalid={bands.trim() !== '' && !bandsRead}
            onChange={e => {
              setBands(e.target.value);
              const read = parseBands(e.target.value);
              if (read) onChange(read);
            }}
          />
          {bands.trim() !== '' && !bandsRead && (
            <span role="alert" style={ERROR_STYLE}>
              {labels.mappingBandsInvalid}
            </span>
          )}
        </label>
      )}
    </fieldset>
  );
}
