import { FIELD_STYLE } from './field-style.js';
import { type DesignerLabels } from '../labels.js';
import { useId, useState } from 'react';
import { isTriggerLink, placedIn, type Trigger, type TriggerAction, type TriggerEvent, type ViewDocument } from '@iyulab/u-board/picture';
import { partNamer } from './part-names.js';
import { stateNames } from './StatesEditor.js';
import { removeTrigger, replaceTrigger, withTrigger } from '../editing/trigger-editing.js';
import { ERROR_STYLE, GROUP_STYLE } from '@iyulab/u-board/toolkit';

export interface TriggersEditorProps {
  /** The part whose triggers are edited — or none, for the board's own: those that run when it opens. */
  node?: string;
  /** The board's whole list; the editor shows the ones on `node` (or the `open` ones) and changes them by index. */
  triggers: readonly Trigger[] | undefined;
  /** The board's parts, by id — what a trigger may wait on or bring into view. */
  parts: readonly string[];
  /** The state names a part's states give — offered for «enters», «leaves» and «only when». */
  stateNamesOf: (part: string) => readonly string[];
  /** How a part is named to the author; its id when left out. */
  nameOf?: (part: string) => string;
  /** The `each` part an item node belongs to — a trigger may then be for every item of it. */
  eachOf?: (node: string) => string | undefined;
  onAdd: (trigger: Trigger) => void;
  onReplace: (index: number, trigger: Trigger) => void;
  onRemove: (index: number) => void;
  labels: DesignerLabels;
}

/** A trigger as the form holds it: what it would write, possibly not yet complete. */
interface Draft {
  /** For every item of the part the node is an item of, not for the node alone. */
  every?: boolean;
  on: { event: TriggerEvent['event']; name: string; state: string };
  when?: { node: string; state: string };
  do: Array<{ action: TriggerAction['action']; value: string }>;
}

const ACTION_FIELD = { 'open-link': 'url', focus: 'node', emit: 'name', 'go-to-board': 'board' } as const;

function draftOf(trigger: Trigger, group?: string): Draft {
  const on = trigger.on;
  return {
    ...(group !== undefined && 'node' in on && on.node === group ? { every: true } : {}),
    on: { event: on.event, name: on.event === 'element' ? on.name : '', state: on.event === 'enter' || on.event === 'leave' ? on.state : '' },
    ...(trigger.when && { when: { node: trigger.when.node, state: ([] as string[]).concat(trigger.when.state).join(', ') } }),
    do: trigger.do.map(action => ({ action: action.action, value: (action as Record<string, string>)[ACTION_FIELD[action.action]] })),
  };
}

/** What is wrong with a draft — `incomplete` (a field left empty or too long), `link` (a link a board may not open) —
 *  or the trigger it describes. The same rules saving checks, so the editor never writes what would be refused. */
function triggerOf(draft: Draft, node: string | undefined): { problem: 'incomplete' | 'link' } | { trigger: Trigger } {
  const name = (text: string) => text.length >= 1 && text.length <= 64;
  const { event, name: eventName, state } = draft.on;
  let on: TriggerEvent;
  if (event === 'open' || node === undefined) on = { event: 'open' };
  else if (event === 'click') on = { event, node };
  else if (event === 'element') {
    if (!name(eventName.trim())) return { problem: 'incomplete' };
    on = { event, node, name: eventName.trim() };
  } else {
    if (state.trim() === '') return { problem: 'incomplete' };
    on = { event, node, state: state.trim() };
  }
  let when: Trigger['when'];
  if (draft.when) {
    const states = draft.when.state.split(',').map(s => s.trim()).filter(Boolean);
    if (draft.when.node === '' || states.length === 0) return { problem: 'incomplete' };
    when = { node: draft.when.node, state: states.length === 1 ? states[0] : states };
  }
  if (draft.do.length === 0) return { problem: 'incomplete' };
  const actions: TriggerAction[] = [];
  for (const { action, value } of draft.do) {
    const text = value.trim();
    if (text === '') return { problem: 'incomplete' };
    if (action === 'open-link') {
      if (!isTriggerLink(text)) return { problem: 'link' };
      actions.push({ action, url: text });
    } else if (action === 'emit') {
      if (!name(text)) return { problem: 'incomplete' };
      actions.push({ action, name: text });
    } else if (action === 'focus') actions.push({ action, node: text });
    else {
      if (text.length > 100) return { problem: 'incomplete' };
      actions.push({ action, board: text });
    }
  }
  return { trigger: { on, ...(when && { when }), do: actions } };
}

/**
 * A board's triggers, edited where an author thinks of them: on a part — clicked, an event of its element, a state
 * entered or left — or, without a part, when the board opens. Each trigger is written as soon as it is complete and
 * one a board may hold; until then the form says what is missing, and the document keeps what it had.
 */
export function TriggersEditor({ node, triggers, parts, stateNamesOf, nameOf, eachOf, onAdd, onReplace, onRemove, labels }: TriggersEditorProps) {
  const group = node === undefined ? undefined : eachOf?.(node);
  const shown = (triggers ?? []).flatMap((trigger, index) =>
    node === undefined
      ? (trigger.on.event === 'open' ? [{ trigger, index }] : [])
      : 'node' in trigger.on && (trigger.on.node === node || (group !== undefined && trigger.on.node === group)) ? [{ trigger, index }] : []
  );
  const [adding, setAdding] = useState(false);
  const fresh: Draft = { on: { event: node === undefined ? 'open' : 'click', name: '', state: '' }, do: [{ action: 'emit', value: '' }] };
  return (
    <section className="ub-panel__section">
      <h3 className="ub-panel__subheading">{node === undefined ? labels.triggersOnOpenHeading : labels.triggersHeading}</h3>
      {/* Keyed by place: a row that writes keeps its fields (and focus); a row being added becomes, once written, the
          row in the same place. */}
      {shown.map(({ trigger, index }, n) => (
        <TriggerRow
          key={`row-${n}`}
          n={n + 1}
          current={trigger}
          fresh={fresh}
          {...{ node, group, parts, stateNamesOf, nameOf, labels }}
          onWrite={next => onReplace(index, next)}
          onRemove={() => onRemove(index)}
        />
      ))}
      {adding && (
        <TriggerRow
          key={`row-${shown.length}`}
          n={shown.length + 1}
          current={undefined}
          fresh={fresh}
          {...{ node, group, parts, stateNamesOf, nameOf, labels }}
          onWrite={next => {
            onAdd(next);
            setAdding(false);
          }}
          onRemove={() => setAdding(false)}
        />
      )}
      {!adding && (
        <button type="button" className="ub-action" onClick={() => setAdding(true)}>
          {labels.addTrigger}
        </button>
      )}
    </section>
  );
}

function TriggerRow({
  n,
  current,
  fresh,
  node,
  group,
  parts,
  stateNamesOf,
  nameOf,
  labels,
  onWrite,
  onRemove,
}: {
  n: number;
  /** The trigger as the board has it — none while it is being added. */
  current: Trigger | undefined;
  /** Where a new trigger starts. */
  fresh: Draft;
  node?: string;
  /** The `each` part `node` is an item of, if it is. */
  group?: string;
  parts: readonly string[];
  stateNamesOf: (part: string) => readonly string[];
  nameOf?: (part: string) => string;
  labels: DesignerLabels;
  onWrite: (trigger: Trigger) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(() => (current ? draftOf(current, group) : fresh));
  // A trigger arriving that this row did not write (Undo, a row removed above it) replaces the draft.
  const [seen, setSeen] = useState(current);
  const [written, setWritten] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current !== written) setDraft(current ? draftOf(current, group) : fresh);
  }
  const statesId = useId();
  /** The node the trigger is about: the one being edited, or — for every item — the part they belong to. */
  const target = (d: Draft) => (d.every && group !== undefined ? group : node);
  const result = triggerOf(draft, target(draft));
  const change = (next: Draft) => {
    setDraft(next);
    const made = triggerOf(next, target(next));
    if ('trigger' in made) {
      setWritten(made.trigger);
      onWrite(made.trigger);
    }
  };
  const label = (text: string) => text.replace('{n}', String(n));
  const ownStates = node === undefined ? [] : stateNamesOf(node);
  return (
    <fieldset className="ub-panel__trigger" style={{ minWidth: 0 }}>
      <legend>{label(labels.triggerHeading)}</legend>
      {node !== undefined && (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.triggerEvent}
          <select value={draft.on.event} onChange={e => change({ ...draft, on: { ...draft.on, event: e.target.value as Draft['on']['event'] } })}>
            <option value="click">{labels.triggerOnClick}</option>
            <option value="element">{labels.triggerOnElement}</option>
            <option value="enter">{labels.triggerOnEnter}</option>
            <option value="leave">{labels.triggerOnLeave}</option>
          </select>
        </label>
      )}
      {group !== undefined && (
        <label>
          <input type="checkbox" checked={!!draft.every} onChange={e => change({ ...draft, every: e.target.checked })} />
          {labels.triggerEveryItem.replace('{part}', group)}
        </label>
      )}
      {draft.on.event === 'element' && (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.triggerEventName}
          <input value={draft.on.name} onChange={e => change({ ...draft, on: { ...draft.on, name: e.target.value } })} placeholder="open-valve" />
        </label>
      )}
      {(draft.on.event === 'enter' || draft.on.event === 'leave') && (
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.triggerState}
          <input list={`${statesId}-own`} value={draft.on.state} onChange={e => change({ ...draft, on: { ...draft.on, state: e.target.value } })} placeholder="fault" />
        </label>
      )}
      {/* Outside the label: its options' text would otherwise become part of the field's name. */}
      {(draft.on.event === 'enter' || draft.on.event === 'leave') && (
        <datalist id={`${statesId}-own`}>
          {ownStates.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </datalist>
      )}
      <label>
        <input type="checkbox" checked={!!draft.when} onChange={e => change({ ...draft, when: e.target.checked ? { node: node ?? parts[0] ?? '', state: '' } : undefined })} />
        {labels.triggerOnlyWhen}
      </label>
      {draft.when && (
        <div style={GROUP_STYLE}>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.triggerWhenPart}
            <select value={draft.when.node} onChange={e => change({ ...draft, when: { ...draft.when!, node: e.target.value } })}>
              {parts.map(p => (
                <option key={p} value={p}>
                  {optionName(p, nameOf)}
                </option>
              ))}
            </select>
          </label>
          <label className="ub-panel__field" style={FIELD_STYLE}>
            {labels.triggerWhenState}
            <input list={`${statesId}-when`} value={draft.when.state} onChange={e => change({ ...draft, when: { ...draft.when!, state: e.target.value } })} placeholder="fault, hot" />
          </label>
          <datalist id={`${statesId}-when`}>
            {stateNamesOf(draft.when.node).map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </datalist>
        </div>
      )}
      {draft.do.map((action, i) => {
        const setAction = (next: Draft['do'][number]) => change({ ...draft, do: draft.do.map((a, j) => (j === i ? next : a)) });
        const k = String(i + 1);
        return (
          <div key={i} className="ub-panel__trigger-action" style={GROUP_STYLE}>
            <label className="ub-panel__field" style={FIELD_STYLE}>
              {labels.triggerAction.replace('{n}', k)}
              <select value={action.action} onChange={e => setAction({ action: e.target.value as TriggerAction['action'], value: '' })}>
                <option value="open-link">{labels.triggerOpenLink}</option>
                <option value="focus">{labels.triggerFocus}</option>
                <option value="emit">{labels.triggerEmit}</option>
                <option value="go-to-board">{labels.triggerGoToBoard}</option>
              </select>
            </label>
            {action.action === 'focus' ? (
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {labels.triggerFocusPart.replace('{n}', k)}
                <select value={action.value} onChange={e => setAction({ ...action, value: e.target.value })}>
                  <option value="">—</option>
                  {parts.map(p => (
                    <option key={p} value={p}>
                      {optionName(p, nameOf)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="ub-panel__field" style={FIELD_STYLE}>
                {(action.action === 'open-link' ? labels.triggerLinkUrl : action.action === 'emit' ? labels.triggerEmitName : labels.triggerBoardId).replace('{n}', k)}
                <input
                  value={action.value}
                  onChange={e => setAction({ ...action, value: e.target.value })}
                  placeholder={action.action === 'open-link' ? 'https://example.com/asset/{{node}}' : action.action === 'emit' ? 'details' : ''}
                />
              </label>
            )}
            <button type="button" className="ub-action ub-action--icon" aria-label={labels.removeTriggerAction.replace('{n}', k)} onClick={() => change({ ...draft, do: draft.do.filter((_, j) => j !== i) })}>
              ×
            </button>
          </div>
        );
      })}
      <div style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={() => change({ ...draft, do: [...draft.do, { action: 'emit', value: '' }] })}>
          {labels.addTriggerAction}
        </button>
        <button type="button" className="ub-action" onClick={onRemove}>
          {label(labels.removeTrigger)}
        </button>
      </div>
      {'problem' in result && (
        <p className="ub-panel__hint" style={result.problem === 'link' ? ERROR_STYLE : undefined}>
          {result.problem === 'link' ? labels.triggerLinkRefused : labels.triggerIncomplete}
        </p>
      )}
    </fieldset>
  );
}

/** What a panel needs to edit `doc`'s triggers — its list, its parts and their states, and edits through `updateDoc`. */
export type TriggerEditing = Omit<TriggersEditorProps, 'node' | 'labels'>;

/** A part as a choice reads: its name and, when that is not its id, the id a trigger keeps. */
function optionName(part: string, nameOf: ((part: string) => string) | undefined): string {
  const name = nameOf?.(part) ?? part;
  return name === part ? part : `${name} (${part})`;
}

/** The parts a trigger may name are the parts the board places. */
export function triggerEditing<D extends ViewDocument>(doc: D, updateDoc: (update: (current: D) => D) => void, locale?: string): TriggerEditing {
  const placed = placedIn(doc);
  return {
    triggers: doc.triggers,
    parts: placed.map(part => part.id),
    stateNamesOf: id => stateNames(placed.find(part => part.id === id)?.states?.map),
    ...(doc.kind === 'canvas' && { nameOf: partNamer(doc, locale) }),
    onAdd: trigger => updateDoc(current => withTrigger(current, trigger)),
    onReplace: (index, trigger) => updateDoc(current => replaceTrigger(current, index, trigger)),
    onRemove: index => updateDoc(current => removeTrigger(current, index)),
  };
}
