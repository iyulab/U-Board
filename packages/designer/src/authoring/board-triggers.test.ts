import { describe, expect, it, vi } from 'vitest';
import type { Board, Trigger } from '@iyulab/u-board/toolkit';
import { boardTriggerEditing } from './board-triggers.js';

const triggers: Trigger[] = [
  { on: { event: 'click', part: 'card' }, when: { part: 'card', field: 'state', status: 'fault' }, do: [{ action: 'open-link', url: '/x/{{part}}/{{status}}' }, { action: 'focus', part: 'pump/P1' }] },
  { on: { event: 'enter', part: 'card', field: 'state', status: 'fault' }, do: [{ action: 'emit', name: 'fault' }] },
];
const board: Board = { statuses: { fault: { tone: 'alarm' }, ok: { tone: 'ok' } }, parts: {}, layout: { kind: 'grid', items: [] }, triggers };

describe('boardTriggerEditing', () => {
  it('shows a board’s triggers in the first version’s words, with its statuses offered for any part', () => {
    const editing = boardTriggerEditing(board, ['card', 'pump/P1'], () => {});
    expect(editing.triggers).toEqual([
      { on: { event: 'click', node: 'card' }, when: { node: 'card', state: 'fault' }, do: [{ action: 'open-link', url: '/x/{{node}}/{{state}}' }, { action: 'focus', node: 'pump/P1' }] },
      { on: { event: 'enter', node: 'card', state: 'fault' }, do: [{ action: 'emit', name: 'fault' }] },
    ]);
    expect(editing.parts).toEqual(['card', 'pump/P1']);
    expect(editing.stateNamesOf('card')).toEqual(['fault', 'ok']);
  });

  it('writes a change back in the board’s words, keeping the field a trigger reads while it names the same part', () => {
    let current = board;
    const editing = boardTriggerEditing(board, ['card', 'other'], update => (current = update(current)));
    editing.onReplace(1, { on: { event: 'enter', node: 'card', state: 'ok' }, do: [{ action: 'emit', name: 'fine' }] });
    expect(current.triggers![1]).toEqual({ on: { event: 'enter', part: 'card', field: 'state', status: 'ok' }, do: [{ action: 'emit', name: 'fine' }] });
    editing.onReplace(1, { on: { event: 'enter', node: 'other', state: 'ok' }, do: [{ action: 'emit', name: 'fine' }] });
    expect(current.triggers![1]!.on).toEqual({ event: 'enter', part: 'other', status: 'ok' });
    editing.onAdd({ on: { event: 'open' }, do: [{ action: 'open-link', url: '/board/{{node}}' }] });
    expect(current.triggers![2]).toEqual({ on: { event: 'open' }, do: [{ action: 'open-link', url: '/board/{{part}}' }] });
    editing.onRemove(0);
    editing.onRemove(0);
    editing.onRemove(0);
    expect(current.triggers).toBeUndefined();
  });

  it('changes nothing until it is asked to', () => {
    const edit = vi.fn();
    boardTriggerEditing(board, [], edit);
    expect(edit).not.toHaveBeenCalled();
  });
});
