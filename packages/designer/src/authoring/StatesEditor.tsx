import { FIELD_STYLE } from './field-style.js';
import { type DesignerLabels } from '../labels.js';
import { useId, useState } from 'react';
import type { StateLook, StateRule, ValueMap, Widget } from '@iyulab/u-board/picture';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { ValueMapFields, draftMap, invalidRanges, mapFromDraft, type MapDraft } from './ValueMapFields.js';
import { THEME_COLORS } from '@iyulab/u-board/toolkit';

export interface StatesEditorProps {
  /** The part's widget — its bindings are what a state can be read from. */
  widget: Widget;
  states: StateRule | undefined;
  /** A new rule, or `undefined` to take the part's states away. */
  onChange: (states: StateRule | undefined) => void;
  labels: DesignerLabels;
}

/** The state names a map gives, each once, in the order the map tries them: values, ranges, then anything else. */
export function stateNames(map: ValueMap<unknown> | undefined): string[] {
  if (!map) return [];
  const names = [...Object.values(map.values ?? {}), ...(map.ranges ?? []).map(r => r.value), ...('otherwise' in map ? [map.otherwise] : [])];
  return [...new Set(names.filter((name): name is string => typeof name === 'string' && name !== ''))];
}

/** `looks` kept to the names the map still gives — and, when one name was replaced by one other, carried to it. */
function followNames(looks: Record<string, StateLook>, before: readonly string[], after: readonly string[]): Record<string, StateLook> {
  const gone = before.filter(name => !after.includes(name));
  const added = after.filter(name => !before.includes(name));
  const kept = Object.fromEntries(Object.entries(looks).filter(([name]) => after.includes(name)));
  if (gone.length === 1 && added.length === 1 && looks[gone[0]] && !kept[added[0]]) kept[added[0]] = looks[gone[0]];
  return kept;
}

/** A look with nothing in it is no look. */
const isEmptyLook = (look: StateLook) => !look.outline && !look.blink && !look.hidden;

/**
 * A part's states: which of its widget's bindings they are read from, the map from that value to a state's name — the
 * same rows a binding's value map has — and how each named state is shown (a ring, blinking, hidden). Written as the
 * author edits; a draft that names no state yet, or has a range that is not one, is held here until it does.
 */
export function StatesEditor({ widget, states, onChange, labels }: StatesEditorProps) {
  const keys = Object.keys(widget.bindings ?? {});
  const themeColorsId = useId();
  const [from, setFrom] = useState(states?.from ?? '');
  const [draft, setDraft] = useState<MapDraft>(() => draftMap(states?.map));
  const [looks, setLooks] = useState<Record<string, StateLook>>(states?.looks ?? {});
  // The rule last seen, and the one this editor last wrote: a rule arriving that is not what it wrote came from
  // elsewhere (Undo, another panel) and replaces the draft; its own leaves the draft alone, empty rows included.
  const [seen, setSeen] = useState(states);
  const [written, setWritten] = useState(states);
  if (states !== seen) {
    setSeen(states);
    if (states !== written) {
      setFrom(states?.from ?? '');
      setDraft(draftMap(states?.map));
      setLooks(states?.looks ?? {});
    }
  }

  const write = (nextFrom: string, nextDraft: MapDraft, nextLooks: Record<string, StateLook>) => {
    const map = invalidRanges(nextDraft).length === 0 ? mapFromDraft(nextDraft) : undefined;
    const names = stateNames(map);
    if (!nextFrom || !map || names.length === 0) return;
    const kept = Object.fromEntries(Object.entries(nextLooks).filter(([name, look]) => names.includes(name) && !isEmptyLook(look)));
    const rule: StateRule = { from: nextFrom, map: map as ValueMap<string>, ...(Object.keys(kept).length > 0 && { looks: kept }) };
    setWritten(rule);
    onChange(rule);
  };

  if (keys.length === 0 && !states) {
    return (
      <section className="ub-panel__section">
        <h3 className="ub-panel__subheading">{labels.statesHeading}</h3>
        <p className="ub-panel__hint">{labels.statesNeedBinding}</p>
      </section>
    );
  }

  const names = stateNames(invalidRanges(draft).length === 0 ? mapFromDraft(draft) : undefined);
  const setLook = (name: string, change: StateLook) => {
    const next = { ...looks, [name]: { ...looks[name], ...change } };
    setLooks(next);
    write(from, draft, next);
  };

  return (
    <section className="ub-panel__section">
      <h3 className="ub-panel__subheading">{labels.statesHeading}</h3>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.statesFrom}
        <select
          value={from}
          onChange={e => {
            setFrom(e.target.value);
            write(e.target.value, draft, looks);
          }}
        >
          <option value="">{labels.statesNone}</option>
          {[...new Set([...keys, ...(from ? [from] : [])])].map(key => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      {from !== '' && (
        <>
          <ValueMapFields
            draft={draft}
            onChange={update => {
              const next = update(draft);
              const before = stateNames(invalidRanges(draft).length === 0 ? mapFromDraft(draft) : undefined);
              const after = stateNames(invalidRanges(next).length === 0 ? mapFromDraft(next) : undefined);
              const nextLooks = followNames(looks, before, after);
              setDraft(next);
              setLooks(nextLooks);
              write(from, next, nextLooks);
            }}
            labels={labels}
            heading={labels.statesMapHeading}
            toLabel={{ mapping: labels.stateForValue, range: labels.stateForRange }}
            placeholders={{ from: 'Fault', to: 'fault' }}
          />
          {names.length > 0 && (
            <fieldset className="ub-panel__state-looks" style={{ minWidth: 0 }}>
              <legend>{labels.statesLooks}</legend>
              {/* The theme's colours, offered as the ring's. Outside the labels: its options' text would otherwise become part of a field's name. */}
              <datalist id={themeColorsId}>
                {THEME_COLORS.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </datalist>
              {names.map(name => (
                <div key={name} className="ub-panel__state-look" style={GROUP_STYLE}>
                  <label style={FIELD_STYLE}>
                    {labels.stateOutline.replace('{state}', name)}
                    <input value={looks[name]?.outline ?? ''} onChange={e => setLook(name, { outline: e.target.value || undefined })} placeholder="negative, #dc2626" list={themeColorsId} />
                  </label>
                  <label>
                    <input type="checkbox" checked={!!looks[name]?.blink} onChange={e => setLook(name, { blink: e.target.checked || undefined })} />
                    {labels.stateBlink.replace('{state}', name)}
                  </label>
                  <label>
                    <input type="checkbox" checked={!!looks[name]?.hidden} onChange={e => setLook(name, { hidden: e.target.checked || undefined })} />
                    {labels.stateHidden.replace('{state}', name)}
                  </label>
                </div>
              ))}
            </fieldset>
          )}
        </>
      )}
      {states && (
        <button type="button" className="ub-action" onClick={() => onChange(undefined)}>
          {labels.removeStates}
        </button>
      )}
    </section>
  );
}
