// The triggers of a board, edited with the triggers editor of its picture: each trigger
// shown in the picture's words (a part is a node, a status a state, a link fills in `{{node}}` and `{{state}}`) and
// written back in the board's — keeping the `field` a trigger reads a status of while it still names the same part.

import type { Trigger as ViewTrigger, TriggerAction as ViewTriggerAction } from '@iyulab/u-board/picture';
import type { Board, Trigger, TriggerAction } from '@iyulab/u-board/toolkit';
import type { TriggerEditing } from './TriggersEditor.js';

/** What the triggers editor needs to edit `board`'s triggers: them in its words, the parts and statuses it offers, and
 *  how each change is written back (`edit`). `parts` are the ids a trigger may name — a part made per item by item. */
export function boardTriggerEditing(board: Board, parts: readonly string[], edit: (update: (current: Board) => Board) => void): TriggerEditing {
  const statuses = Object.keys(board.statuses ?? {});
  const write = (update: (triggers: Trigger[]) => Trigger[]) =>
    edit(current => {
      const triggers = update([...(current.triggers ?? [])]);
      const { triggers: _gone, ...rest } = current;
      return triggers.length > 0 ? { ...rest, triggers } : rest;
    });
  return {
    triggers: board.triggers?.map(shown),
    parts,
    // An item of an `each` part is a node `<part>/<key>`: a trigger on it may be for every item of the part.
    eachOf: node => (node.includes('/') && board.parts[node.split('/')[0]!]?.each !== undefined ? node.split('/')[0] : undefined),
    stateNamesOf: () => statuses,
    onAdd: trigger => write(triggers => [...triggers, written(trigger)]),
    onReplace: (index, trigger) => write(triggers => triggers.map((t, i) => (i === index ? written(trigger, t) : t))),
    onRemove: index => write(triggers => triggers.filter((_, i) => i !== index)),
  };
}

/** A board's trigger in its picture's words. */
function shown(t: Trigger): ViewTrigger {
  const on: ViewTrigger['on'] = t.on.event === 'open' ? { event: 'open' }
    : t.on.event === 'click' ? { event: 'click', node: t.on.part }
      : t.on.event === 'element' ? { event: 'element', node: t.on.part, name: t.on.name }
        : { event: t.on.event, node: t.on.part, state: t.on.status };
  return {
    on,
    ...(t.when !== undefined ? { when: { node: t.when.part, state: t.when.status } } : {}),
    do: t.do.map((a): ViewTriggerAction => (a.action === 'focus' ? { action: 'focus', node: a.part }
      : a.action === 'open-link' ? { action: 'open-link', url: a.url.replace(/\{\{\s*part\s*\}\}/g, '{{node}}').replace(/\{\{\s*status\s*\}\}/g, '{{state}}') }
        : a)),
  };
}

/** A trigger the editor wrote, in the board's words — the `field` of `was` kept where it still names the same part. */
function written(t: ViewTrigger, was?: Trigger): Trigger {
  const field = (part: string, before: { part: string; field?: string } | undefined) =>
    before?.field !== undefined && before.part === part ? { field: before.field } : {};
  const before = was && 'part' in was.on ? (was.on as { part: string; field?: string }) : undefined;
  const on: Trigger['on'] = t.on.event === 'open' ? { event: 'open' }
    : t.on.event === 'click' ? { event: 'click', part: t.on.node }
      : t.on.event === 'element' ? { event: 'element', part: t.on.node, name: t.on.name }
        : { event: t.on.event, part: t.on.node, ...field(t.on.node, before), status: t.on.state };
  return {
    on,
    ...(t.when !== undefined
      ? { when: { part: t.when.node, ...field(t.when.node, was?.when), status: Array.isArray(t.when.state) && t.when.state.length === 1 ? t.when.state[0]! : t.when.state } }
      : {}),
    do: t.do.map((a): TriggerAction => (a.action === 'focus' ? { action: 'focus', part: a.node }
      : a.action === 'open-link' ? { action: 'open-link', url: a.url.replace(/\{\{\s*node\s*\}\}/g, '{{part}}').replace(/\{\{\s*state\s*\}\}/g, '{{status}}') }
        : a)),
  };
}
