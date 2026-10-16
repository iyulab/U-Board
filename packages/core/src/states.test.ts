import { describe, it, expect } from 'vitest';
import { stateOf } from './states';
import type { StateRule } from './view-document';

const rule: StateRule = {
  from: 'data.value',
  map: { values: { Fault: 'fault', Running: 'running' }, ranges: [{ min: 80, value: 'hot' }] },
};

describe('stateOf', () => {
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
