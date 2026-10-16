import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTriggers, type TriggerHandlers } from './use-triggers';
import type { GridView } from '../view-document';
import type { ResolvedGridView } from '../resolve-document';

const doc: GridView = {
  kind: 'grid',
  items: [{ id: 'pump', widget: { type: 'status' } }, { id: 'valve', widget: { type: 'status' } }],
  triggers: [
    { on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'pump-clicked' }, { action: 'open-link', url: 'https://cmms.example.com/assets/{{node}}' }] },
    { on: { event: 'open' }, do: [{ action: 'emit', name: 'opened' }] },
    { on: { event: 'enter', node: 'pump', state: 'fault' }, do: [{ action: 'focus', node: 'pump' }, { action: 'emit', name: 'fault' }] },
    { on: { event: 'click', node: 'valve' }, do: [{ action: 'go-to-board', board: 'b2' }] },
  ],
};
const resolved = (pump?: string): ResolvedGridView => ({
  kind: 'grid',
  items: [
    { id: 'pump', widget: { type: 'status', props: {}, quality: {} }, ...(pump !== undefined && { state: pump }) },
    { id: 'valve', widget: { type: 'status', props: {}, quality: {} } },
  ],
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setup(handlers: TriggerHandlers = {}) {
  const onTrigger = vi.fn();
  const focus = vi.fn();
  const all = { onTrigger, focus, boardId: 'b1', ...handlers };
  const hook = renderHook(({ r }) => useTriggers(doc, r, all), { initialProps: { r: resolved('ok') as ResolvedGridView | null } });
  return { hook, onTrigger, focus };
}

describe('useTriggers', () => {
  it('names the parts a click does something on', () => {
    const { hook } = setup();
    expect([...hook.result.current.activatable].sort()).toEqual(['pump', 'valve']);
  });

  it('fires open once, when the board is first drawn', () => {
    const { hook, onTrigger } = setup();
    expect(onTrigger.mock.calls.map(c => c[0].name)).toEqual(['opened']);
    hook.rerender({ r: resolved('ok') });
    expect(onTrigger.mock.calls.map(c => c[0].name)).toEqual(['opened']);
  });

  it('runs a click: the host hears the event, the link opens filled in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { hook, onTrigger } = setup();
    act(() => hook.result.current.activate('pump'));
    expect(onTrigger).toHaveBeenLastCalledWith({ name: 'pump-clicked', node: 'pump', state: 'ok', board: 'b1' });
    expect(open).toHaveBeenCalledWith('https://cmms.example.com/assets/pump', '_blank', 'noopener,noreferrer');
  });

  it('enters a state once when it changes between draws, and brings the part into view', () => {
    vi.useFakeTimers({ now: 0 });
    const { hook, onTrigger, focus } = setup();
    hook.rerender({ r: resolved('fault') });
    expect(focus).toHaveBeenCalledWith('pump');
    expect(onTrigger).toHaveBeenLastCalledWith({ name: 'fault', node: 'pump', state: 'fault', board: 'b1' });
    // Back and forth within a second: the trigger holds.
    hook.rerender({ r: resolved('ok') });
    hook.rerender({ r: resolved('fault') });
    expect(focus).toHaveBeenCalledTimes(1);
    vi.setSystemTime(1000);
    hook.rerender({ r: resolved('ok') });
    hook.rerender({ r: resolved('fault') });
    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('asks the host to go to another board, and does nothing when no host listens', () => {
    const onNavigate = vi.fn();
    const withHost = setup({ onNavigate });
    act(() => withHost.hook.result.current.activate('valve'));
    expect(onNavigate).toHaveBeenCalledWith({ board: 'b2' });
    const without = setup();
    expect(() => act(() => without.hook.result.current.activate('valve'))).not.toThrow();
  });

  it('opens no link outside the origins a host allows', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { hook } = setup({ linkOrigins: ['https://other.example.com'] });
    act(() => hook.result.current.activate('pump'));
    expect(open).not.toHaveBeenCalled();
  });
});
