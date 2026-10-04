import { describe, it, expect } from 'vitest';
import { describeQuality, worstQuality, ageText, DEFAULT_QUALITY_TEXT } from './quality-text.js';

describe('describeQuality', () => {
  it('adds the cause to a single abnormal binding', () => {
    expect(describeQuality({ quality: { 'data.value': 'disconnected' }, reasons: { 'data.value': 'address' } }))
      .toBe('disconnected — no value has been reached (bound value not found at the source)');
    expect(describeQuality({ quality: { 'data.value': 'stale' }, reasons: { 'data.value': 'throttled' } }))
      .toBe('stale — showing last known value (rate limited)');
  });

  it('keeps the label unchanged when no cause is known', () => {
    expect(describeQuality({ quality: { 'data.value': 'disconnected' }, reasons: {} })).toBe('disconnected — no value has been reached');
    expect(describeQuality({ quality: { 'data.value': 'disconnected' } })).toBe('disconnected — no value has been reached');
  });

  it('names the cause per property when several bindings are at fault', () => {
    expect(describeQuality({
      quality: { 'data.value': 'disconnected', 'data.threshold': 'disconnected', 'data.label': 'stale' },
      reasons: { 'data.value': 'auth', 'data.label': 'transport' },
    })).toBe(
      'disconnected — no value has been reached (data.value: credentials refused; data.threshold) · ' +
        'stale — showing last known value (data.label: data source unreachable)'
    );
  });
});

describe('describeQuality — how old a stale value is', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');

  it('says how long ago a stale value was obtained, after its cause', () => {
    expect(describeQuality(
      { quality: { v: 'stale' }, reasons: { v: 'transport' }, observedAt: { v: '2026-10-04T11:55:00Z' } },
      { now }
    )).toBe('stale — showing last known value (data source unreachable, 5 minutes ago)');
    expect(describeQuality({ quality: { v: 'stale' }, observedAt: { v: '2026-10-02T09:00:00Z' } }, { now }))
      .toBe('stale — showing last known value (2 days ago)');
  });

  it('gives each stale property its own age when several are at fault', () => {
    expect(describeQuality({
      quality: { a: 'disconnected', b: 'stale', c: 'stale' },
      reasons: { a: 'auth', b: 'transport' },
      observedAt: { b: '2026-10-04T11:00:00Z', c: '2026-10-04T11:59:30Z' },
    }, { now })).toBe(
      'disconnected — no value has been reached (a: credentials refused) · ' +
        'stale — showing last known value (b: data source unreachable, 1 hour ago; c: 30 seconds ago)'
    );
  });

  it('gives no age to a live binding or an unreadable time', () => {
    expect(describeQuality({ quality: { v: 'live' }, observedAt: { v: '2026-10-04T11:00:00Z' } }, { now })).toBeUndefined();
    expect(describeQuality({ quality: { v: 'stale' }, observedAt: { v: 'not a time' } }, { now }))
      .toBe('stale — showing last known value');
  });

  it('reads a value from the future (a clock ahead of the host) as just now', () => {
    expect(describeQuality({ quality: { v: 'stale' }, observedAt: { v: '2026-10-04T12:00:05Z' } }, { now }))
      .toBe('stale — showing last known value (now)');
  });
});

describe('ageText', () => {
  it('uses the largest whole unit, in the given language', () => {
    const en = ageText('en');
    expect(en(0)).toBe('now');
    expect(en(45_000)).toBe('45 seconds ago');
    expect(en(90_000)).toBe('1 minute ago');
    expect(en(3 * 3_600_000)).toBe('3 hours ago');
    expect(en(26 * 3_600_000)).toBe('yesterday');
    expect(ageText('ko')(5 * 60_000)).toBe('5분 전');
  });
});

describe('worstQuality', () => {
  it('picks the least current quality, and nothing for a widget with no bindings', () => {
    expect(worstQuality({ a: 'live', b: 'stale' })).toBe('stale');
    expect(worstQuality({ a: 'stale', b: 'disconnected', c: 'live' })).toBe('disconnected');
    expect(worstQuality({})).toBeUndefined();
  });

  it('says nothing when every binding is live', () => {
    expect(describeQuality({ quality: { a: 'live' } })).toBeUndefined();
  });
});

describe('describeQuality with other words', () => {
  const text = {
    quality: { stale: 'S', disconnected: 'D' },
    reason: { transport: 'T', auth: 'A', address: 'AD', throttled: 'TH' },
    age: (ms: number) => `${ms}ms`,
  };

  it('builds the line from the given text', () => {
    expect(describeQuality({ quality: { 'data.value': 'disconnected' }, reasons: { 'data.value': 'auth' } }, { text })).toBe('D (A)');
    expect(describeQuality({ quality: { a: 'disconnected', b: 'stale' }, reasons: { a: 'address' } }, { text })).toBe('D (a: AD) · S (b)');
    expect(describeQuality({ quality: { v: 'stale' }, observedAt: { v: '1970-01-01T00:00:01Z' } }, { text, now: 1500 })).toBe('S (500ms)');
  });

  it('defaults to the English text', () => {
    expect(describeQuality({ quality: { v: 'stale' } }, { text: DEFAULT_QUALITY_TEXT })).toBe(describeQuality({ quality: { v: 'stale' } }));
  });
});
