import { useId } from 'react';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { FIELD_STYLE } from '../ui-style.js';
import { PART_KINDS } from '../board-v2/kinds.js';
import type { BoardFinding } from '../board-v2/check.js';
import type { BoardV2, Part } from '../board-v2/types.js';

export interface PartPanelProps {
  /** The part's id in the board's `parts`. */
  id: string;
  board: BoardV2;
  /** Replaces the part with what the panel made of it. */
  onChange: (part: Part) => void;
  /** What the board's check finds at this part — shown under it, where it is fixed. */
  findings?: readonly BoardFinding[];
  labels?: UBoardLabels;
}

/** `<data>` or `<data>[<key>]`, as a part names what it reads. */
const OF = /^([\w-]+)(?:\[([^\]]+)\])?$/;

/**
 * The panel of a part of a board in the language's second version: its title, its kind, what it reads (a data read,
 * and one item of it by key) and which fields it shows. A setting left empty goes from the part, so the board keeps
 * only what was set. A part made per item reads the items its `each` names, shown and not changed here.
 */
export function PartPanel({ id, board, onChange, findings = [], labels = DEFAULT_LABELS }: PartPanelProps) {
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
