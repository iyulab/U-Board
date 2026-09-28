import { describe, it, expect } from 'vitest';
import { frameQuality, qualityTooltip } from './quality-presentation.js';

describe('frameQuality', () => {
  it("uses the widget's own primary-field quality when the widget type has a known one (gauge → value)", () => {
    // Secondary bindings failing must not alarm the frame when the primary (displayed) value is
    // live — worst-first-across-all-bindings hides root cause and raises nuisance alarms on a
    // widget whose headline value is fine.
    const quality = {
      'data.value': 'live',
      'data.threshold': 'disconnected',
    } as const;
    expect(frameQuality(quality, 'gauge')).toBe('live');
  });

  it('reflects a disconnected primary field even when secondary fields are live', () => {
    const quality = {
      'data.value': 'disconnected',
      'data.threshold': 'live',
    } as const;
    expect(frameQuality(quality, 'gauge')).toBe('disconnected');
  });

  it('picks "value" as the primary field for status, not the also-required "label"', () => {
    const quality = {
      'data.label': 'disconnected',
      'data.value': 'live',
    } as const;
    expect(frameQuality(quality, 'status')).toBe('live');
  });

  it('treats an unbound primary field as nothing to alarm on, even if a secondary field failed', () => {
    const quality = { 'data.threshold': 'disconnected' } as const;
    expect(frameQuality(quality, 'gauge')).toBeUndefined();
  });

  it('falls back to worst-first across all bindings for a widget type with no known primary field', () => {
    const quality = { x: 'live', y: 'stale', color: 'disconnected' } as const;
    expect(frameQuality(quality, 'chart.line')).toBe('disconnected');
  });

  it('falls back to worst-first for an unknown/custom widget type', () => {
    const quality = { state: 'stale' } as const;
    expect(frameQuality(quality, 'some-custom-widget')).toBe('stale');
  });

  it('returns undefined for a widget with no bindings at all', () => {
    expect(frameQuality({}, 'gauge')).toBeUndefined();
    expect(frameQuality({}, 'chart.line')).toBeUndefined();
  });
});

describe('qualityTooltip with reasons', () => {
  it('adds the cause to a single abnormal binding', () => {
    expect(qualityTooltip({ 'data.value': 'disconnected' }, { 'data.value': 'address' }))
      .toBe('disconnected — no value has been reached (bound value not found at the source)');
    expect(qualityTooltip({ 'data.value': 'stale' }, { 'data.value': 'throttled' }))
      .toBe('stale — showing last known value (rate limited)');
  });

  it('keeps the label unchanged when no cause is known', () => {
    expect(qualityTooltip({ 'data.value': 'disconnected' }, {})).toBe('disconnected — no value has been reached');
    expect(qualityTooltip({ 'data.value': 'disconnected' })).toBe('disconnected — no value has been reached');
  });

  it('names the cause per property when several bindings are at fault', () => {
    expect(qualityTooltip(
      { 'data.value': 'disconnected', 'data.threshold': 'disconnected', 'data.label': 'stale' },
      { 'data.value': 'auth', 'data.label': 'transport' }
    )).toBe(
      'disconnected — no value has been reached (data.value: credentials refused, data.threshold) · ' +
        'stale — showing last known value (data.label: data source unreachable)'
    );
  });
});
