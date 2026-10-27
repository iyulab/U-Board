import { FIELD_STYLE } from './field-style.js';
import { type DesignerLabels } from '../labels.js';
import type { CSSProperties } from 'react';
import type { ValueMap } from '@iyulab/u-board/picture';
import { ERROR_STYLE } from '@iyulab/u-board/toolkit';

/** A value map as a form edits it — rows of source value → mapped value, numeric bands, and the value for anything
 *  else (empty: none). Written as text: a map's usual job is a status word, a level or a state's name. */
export interface MapDraft {
  mappings: MappingRow[];
  /** Numeric bands → mapped value (`ValueMap.ranges`), tried after `mappings`. */
  ranges: RangeRow[];
  otherwise: string;
  /** The map's `otherwise` as loaded, kept as it was unless its text is edited (see `MappingRow.loaded`). */
  otherwiseLoaded?: { value: unknown };
}

/** A row of the value map as the form edits it. `loaded` is the shown value the row was loaded with:
 * while its text is left as shown, that value is saved back as it was — a number stays a number —
 * rather than as the text the form displays it with. */
export interface MappingRow {
  from: string;
  to: string;
  loaded?: { value: unknown };
}

/** A numeric range row as the form edits it: its bounds as typed (empty: that end is open) and
 * its shown value, kept as loaded like `MappingRow.to`. */
export interface RangeRow {
  min: string;
  max: string;
  to: string;
  loaded?: { value: unknown };
}

/** The value a form field stands for: what it was loaded with if its text was not edited, else its text. */
function fieldValue(text: string, loaded?: { value: unknown }): unknown {
  return loaded && text === asText(loaded.value) ? loaded.value : text;
}

/** A row of the value map: its inputs share the line. */
const ROW_STYLE: CSSProperties = { display: 'flex', gap: 'var(--ub-space-1, 4px)', alignItems: 'center' };
const ROW_INPUT_STYLE: CSSProperties = { flex: 1, minWidth: 0 };

/** The form's text for a mapped value — itself when it is text, its JSON otherwise. */
export const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

const boundText = (bound: number | undefined) => (bound === undefined ? '' : String(bound));

export function draftMap(map: ValueMap | undefined): MapDraft {
  if (!map) return { mappings: [], ranges: [], otherwise: '' };
  return {
    mappings: Object.entries(map.values ?? {}).map(([from, to]) => ({ from, to: asText(to), loaded: { value: to } })),
    ranges: (map.ranges ?? []).map(r => ({ min: boundText(r.min), max: boundText(r.max), to: asText(r.value), loaded: { value: r.value } })),
    otherwise: 'otherwise' in map ? asText(map.otherwise) : '',
    ...('otherwise' in map && { otherwiseLoaded: { value: map.otherwise } }),
  };
}

/** A range bound as typed: `undefined` when left empty (an open end), else the number it reads as. */
const bound = (text: string) => (text.trim() === '' ? undefined : Number(text));

/** The rows (1-based) whose range is not a range — a shown value with neither end, an upper end not
 * above the lower one, or a bound that is not a number. Such a binding is not saved: a row with no
 * end would be dropped silently, the others refused with the document. */
export function invalidRanges(draft: MapDraft): number[] {
  return draft.ranges.flatMap((row, i) => {
    const [min, max] = [bound(row.min), bound(row.max)];
    const broken =
      (min === undefined && max === undefined && row.to.trim() !== '') ||
      [min, max].some(b => b !== undefined && !Number.isFinite(b)) ||
      (min !== undefined && max !== undefined && !(min < max));
    return broken ? [i + 1] : [];
  });
}

/** The `Binding.map` the form describes, or `undefined` when it describes none. A row without a
 * source value, and a range row with neither end, is left out. */
export function mapFromDraft(draft: MapDraft): ValueMap | undefined {
  const rows = draft.mappings.filter(row => row.from !== '');
  const ranges = draft.ranges.filter(row => bound(row.min) !== undefined || bound(row.max) !== undefined);
  if (rows.length === 0 && ranges.length === 0 && draft.otherwise === '') return undefined;
  return {
    ...(rows.length > 0 || ranges.length === 0 ? { values: Object.fromEntries(rows.map(row => [row.from, fieldValue(row.to, row.loaded)])) } : {}),
    ...(ranges.length > 0 && {
      ranges: ranges.map(row => {
        const [min, max] = [bound(row.min), bound(row.max)];
        return { ...(min !== undefined && { min }), ...(max !== undefined && { max }), value: fieldValue(row.to, row.loaded) };
      }),
    }),
    ...(draft.otherwise !== '' && { otherwise: fieldValue(draft.otherwise, draft.otherwiseLoaded) }),
  };
}


export interface ValueMapFieldsProps {
  draft: MapDraft;
  /** Applies a change to the map's part of the draft. */
  onChange: (update: (draft: MapDraft) => MapDraft) => void;
  labels: DesignerLabels;
  /** The heading — `labels.valueMapHeading` by default. */
  heading?: string;
  /** What a row maps to, as its field is named — `labels.mapTo` and `labels.rangeTo` by default ({n} is the row). */
  toLabel?: { mapping: string; range: string };
  /** Examples shown in a row's two sides while they are empty. */
  placeholders?: { from: string; to: string };
}

/** The rows of a value map — source value → mapped value, numeric bands, the value for anything else — as one form. */
export function ValueMapFields({
  draft,
  onChange: setDraft,
  labels,
  heading = labels.valueMapHeading,
  toLabel = { mapping: labels.mapTo, range: labels.rangeTo },
  placeholders = { from: 'Fault', to: 'error' },
}: ValueMapFieldsProps) {
  const rangeIssues = invalidRanges(draft);
  return (
    <fieldset className="ub-panel__value-map" style={{ minWidth: 0 }}>
      <legend>{heading}</legend>
      {draft.mappings.map((row, i) => {
        const n = String(i + 1);
        const setRow = (change: Partial<MappingRow>) =>
          setDraft(d => ({ ...d, mappings: d.mappings.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
        return (
          <div key={i} className="ub-panel__map-row" style={ROW_STYLE}>
            <input style={ROW_INPUT_STYLE} aria-label={labels.mapFrom.replace('{n}', n)} value={row.from} onChange={e => setRow({ from: e.target.value })} placeholder={placeholders.from} />
            <span aria-hidden="true">→</span>
            <input style={ROW_INPUT_STYLE} aria-label={toLabel.mapping.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder={placeholders.to} />
            <button
              type="button"
              className="ub-action ub-action--icon"
              aria-label={labels.removeMapping.replace('{n}', n)}
              onClick={() => setDraft(d => ({ ...d, mappings: d.mappings.filter((_, j) => j !== i) }))}
            >
              ×
            </button>
          </div>
        );
      })}
      <button type="button" className="ub-action" onClick={() => setDraft(d => ({ ...d, mappings: [...d.mappings, { from: '', to: '' }] }))}>
        {labels.addMapping}
      </button>
      {draft.ranges.map((row, i) => {
        const n = String(i + 1);
        const setRow = (change: Partial<RangeRow>) =>
          setDraft(d => ({ ...d, ranges: d.ranges.map((r, j) => (j === i ? { ...r, ...change } : r)) }));
        return (
          <div key={i} className="ub-panel__map-row" style={ROW_STYLE}>
            <input type="number" style={ROW_INPUT_STYLE} aria-label={labels.rangeMin.replace('{n}', n)} value={row.min} onChange={e => setRow({ min: e.target.value })} placeholder="70" />
            <span aria-hidden="true">≤ x &lt;</span>
            <input type="number" style={ROW_INPUT_STYLE} aria-label={labels.rangeMax.replace('{n}', n)} value={row.max} onChange={e => setRow({ max: e.target.value })} placeholder="80" />
            <span aria-hidden="true">→</span>
            <input style={ROW_INPUT_STYLE} aria-label={toLabel.range.replace('{n}', n)} value={row.to} onChange={e => setRow({ to: e.target.value })} placeholder="warning" />
            <button
              type="button"
              className="ub-action ub-action--icon"
              aria-label={labels.removeRange.replace('{n}', n)}
              onClick={() => setDraft(d => ({ ...d, ranges: d.ranges.filter((_, j) => j !== i) }))}
            >
              ×
            </button>
          </div>
        );
      })}
      <button type="button" className="ub-action" onClick={() => setDraft(d => ({ ...d, ranges: [...d.ranges, { min: '', max: '', to: '' }] }))}>
        {labels.addRange}
      </button>
      {rangeIssues.map(n => (
        <p key={n} role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {labels.rangeInvalid.replace('{n}', String(n))}
        </p>
      ))}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.mapOtherwise}
        <input value={draft.otherwise} onChange={e => setDraft(d => ({ ...d, otherwise: e.target.value }))} placeholder={labels.mapOtherwisePlaceholder} />
      </label>
    </fieldset>
  );
}
