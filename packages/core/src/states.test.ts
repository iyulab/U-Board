import { describe, it, expect } from 'vitest';
import { stateOf } from './states';
import type { StateRule } from './view-document';

const rule: StateRule = {
  from: 'data.value',
  map: { values: { Fault: 'fault', Running: 'running' }, ranges: [{ min: 80, value: 'hot' }] },
};

describe('stateOf', () => {
  it('names a state from the clock when its map is read against it', () => {
    const NOW = Date.parse('2026-10-23T03:00:00Z');
    const timed: StateRule = {
      from: 'data.at',
      map: { relativeTo: 'now', ranges: [{ max: -2700, value: 'past' }, { min: -2700, max: 1, value: 'now' }, { min: 1, max: 2700, value: 'next' }], otherwise: 'later' },
    };
    const at = (iso: string) => stateOf(timed, { 'data.at': iso }, { 'data.at': 'live' }, NOW);
    expect(at('2026-10-23T02:00:00Z')).toBe('past');
    expect(at('2026-10-23T02:30:00Z')).toBe('now');
    expect(at('2026-10-23T03:20:00Z')).toBe('next');
    expect(at('2026-10-23T05:00:00Z')).toBe('later');
    // A reading that is no time names the otherwise, never itself.
    expect(at('soon')).toBe('later');
  });

  it('names the state its map gives the reading of the binding it reads from', () => {
    expect(stateOf(rule, { 'data.value': 'Fault' }, { 'data.value': 'live' })).toBe('fault');
    expect(stateOf(rule, { 'data.value': 85 }, { 'data.value': 'live' })).toBe('hot');
  });

  it('reads a number sent as text through the ranges, as a prop’s map does', () => {
    expect(stateOf(rule, { 'data.value': ' 92.5 ' }, { 'data.value': 'stale' })).toBe('hot');
  });

  it('names no state for a reading its map does not name — never the reading itself', () => {
    expect(stateOf(rule, { 'data.value': 'Idle' }, { 'data.value': 'live' })).toBeUndefined();
    expect(stateOf(rule, { 'data.value': 12 }, { 'data.value': 'live' })).toBeUndefined();
  });

  it('takes otherwise for a reading nothing else names', () => {
    expect(stateOf({ ...rule, map: { ...rule.map, otherwise: 'ok' } }, { 'data.value': 'Idle' }, { 'data.value': 'live' })).toBe('ok');
  });

  it('names no state when the binding read no value — disconnected, or no such binding', () => {
    expect(stateOf(rule, {}, { 'data.value': 'disconnected' })).toBeUndefined();
    expect(stateOf(rule, {}, {})).toBeUndefined();
    expect(stateOf(undefined, { 'data.value': 'Fault' }, { 'data.value': 'live' })).toBeUndefined();
  });

  it('names no state when the map gives something that is not a name', () => {
    const odd = { from: 'v', map: { values: { a: 2 as unknown as string, b: '' } } };
    expect(stateOf(odd, { v: 'a' }, { v: 'live' })).toBeUndefined();
    expect(stateOf(odd, { v: 'b' }, { v: 'live' })).toBeUndefined();
    expect(stateOf({ from: 'v', map: 'x' as never }, { v: 'a' }, { v: 'live' })).toBeUndefined();
  });
});
