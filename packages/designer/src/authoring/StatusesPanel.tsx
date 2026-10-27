import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useState } from 'react';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { EMPHASES, TONES, type Emphasis, type Status, type Tone } from '@iyulab/u-board/toolkit';

export interface StatusesPanelProps {
  statuses: Readonly<Record<string, Status>> | undefined;
  /** The board's statuses as the panel made them — none left: `undefined`. */
  onChange: (statuses: Record<string, Status> | undefined) => void;
  labels?: DesignerLabels;
}

/** Whether a new status may take `name`: any word a field's state may give, but not an empty one or one taken. */
const usable = (name: string, taken: Readonly<Record<string, unknown>>) => name.trim() !== '' && !Object.hasOwn(taken, name.trim());

/**
 * The board's statuses — each name a field's state gives, with the tone it is drawn in, its words, its mark and a second
 * channel besides colour. A status is added by name and removed; its name is not changed here, since the states of
 * the board's fields name it.
 */
export function StatusesPanel({ statuses = {}, onChange, labels = DEFAULT_DESIGNER_LABELS }: StatusesPanelProps) {
  const [name, setName] = useState('');
  const write = (next: Record<string, Status>) => onChange(Object.keys(next).length > 0 ? next : undefined);
  const set = (key: string, change: Partial<Status>) => {
    const status = { ...statuses[key]!, ...change };
    for (const field of ['label', 'glyph', 'emphasis'] as const) if (status[field] === undefined || status[field] === '') delete status[field];
    write({ ...statuses, [key]: status });
  };
  const remove = (key: string) => {
    const { [key]: _gone, ...rest } = statuses;
    write(rest);
  };
  return (
    <div className="ub-panel ub-panel--statuses">
      <h2 className="ub-panel__heading">{labels.statusesHeading}</h2>
      {Object.entries(statuses).map(([key, status]) => (
        <fieldset key={key} className="ub-panel__group" style={{ minWidth: 0 }}>
          <legend>
            <code>{key}</code>
          </legend>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.statusTone}
            <select value={status.tone} onChange={e => set(key, { tone: e.target.value as Tone })}>
              {TONES.map(tone => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </label>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.statusLabel}
            <input type="text" value={status.label ?? ''} onChange={e => set(key, { label: e.target.value })} />
          </label>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.statusGlyph}
            <input type="text" value={status.glyph ?? ''} onChange={e => set(key, { glyph: e.target.value })} />
          </label>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.statusEmphasis}
            <select value={status.emphasis ?? ''} onChange={e => set(key, { emphasis: (e.target.value || undefined) as Emphasis | undefined })}>
              <option value="">{labels.statusEmphasisNone}</option>
              {EMPHASES.map(emphasis => (
                <option key={emphasis} value={emphasis}>
                  {emphasis}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ub-action" onClick={() => remove(key)}>
            {labels.statusRemove.replace('{name}', key)}
          </button>
        </fieldset>
      ))}
      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.statusNew}
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <button
          type="button"
          className="ub-action"
          disabled={!usable(name, statuses)}
          onClick={() => {
            write({ ...statuses, [name.trim()]: { tone: 'info' } });
            setName('');
          }}
        >
          {labels.statusAdd}
        </button>
      </div>
    </div>
  );
}
