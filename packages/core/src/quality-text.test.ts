import { describe, it, expect } from 'vitest';
import { describeQuality, worstQuality } from './quality-text.js';

describe('describeQuality', () => {
  it('adds the cause to a single abnormal binding', () => {
    expect(describeQuality({ 'data.value': 'disconnected' }, { 'data.value': 'address' }))
      .toBe('disconnected — no value has been reached (bound value not found at the source)');
    expect(describeQuality({ 'data.value': 'stale' }, { 'data.value': 'throttled' }))
      .toBe('stale — showing last known value (rate limited)');
  });

  it('keeps the label unchanged when no cause is known', () => {
    expect(describeQuality({ 'data.value': 'disconnected' }, {})).toBe('disconnected — no value has been reached');
    expect(describeQuality({ 'data.value': 'disconnected' })).toBe('disconnected — no value has been reached');
  });

  it('names the cause per property when several bindings are at fault', () => {
    expect(describeQuality(
      { 'data.value': 'disconnected', 'data.threshold': 'disconnected', 'data.label': 'stale' },
      { 'data.value': 'auth', 'data.label': 'transport' }
    )).toBe(
      'disconnected — no value has been reached (data.value: credentials refused, data.threshold) · ' +
        'stale — showing last known value (data.label: data source unreachable)'
    );
  });
});

describe('worstQuality', () => {
  it('picks the least current quality, and nothing for a widget with no bindings', () => {
    expect(worstQuality({ a: 'live', b: 'stale' })).toBe('stale');
    expect(worstQuality({ a: 'stale', b: 'disconnected', c: 'live' })).toBe('disconnected');
    expect(worstQuality({})).toBeUndefined();
  });

  it('says nothing when every binding is live', () => {
    expect(describeQuality({ a: 'live' })).toBeUndefined();
  });
});
