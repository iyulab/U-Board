import { describe, it, expect } from 'vitest';
import { frameQuality } from './quality-presentation.js';

describe('frameQuality', () => {
  it("uses the widget's own primary-field quality when the widget type has a known one (gauge → value)", () => {
    // Secondary bindings failing must not alarm the frame when the primary (displayed) value is
    // live — BD-20260828-04: worst-first-across-all-bindings hides root cause and raises nuisance
    // alarms on a widget whose headline value is fine.
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
