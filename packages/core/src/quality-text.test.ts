import { describe, it, expect } from 'vitest';
import { describeQuality, worstQuality, DEFAULT_QUALITY_TEXT } from './quality-text.js';

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

describe('describeQuality with other words', () => {
  const text = {
    quality: { stale: 'S', disconnected: 'D' },
    reason: { transport: 'T', auth: 'A', address: 'AD', throttled: 'TH' },
  };

  it('builds the line from the given text', () => {
    expect(describeQuality({ 'data.value': 'disconnected' }, { 'data.value': 'auth' }, text)).toBe('D (A)');
    expect(describeQuality({ a: 'disconnected', b: 'stale' }, { a: 'address' }, text)).toBe('D (a: AD) · S (b)');
  });

  it('defaults to the English text', () => {
    expect(describeQuality({ v: 'stale' }, {}, DEFAULT_QUALITY_TEXT)).toBe(describeQuality({ v: 'stale' }));
  });
});
