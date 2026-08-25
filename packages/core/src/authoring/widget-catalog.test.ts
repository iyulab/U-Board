import { describe, it, expect } from 'vitest';
import { seedWidget, WIDGET_TYPES } from './widget-catalog.js';

describe('seedWidget', () => {
  it('seeds a status widget with a visible placeholder value and no bindings', () => {
    expect(seedWidget('status')).toEqual({
      type: 'status',
      props: { data: { label: 'New node', level: 'neutral', value: 'unbound' } },
    });
  });

  it('seeds a gauge widget with a numeric value', () => {
    expect(seedWidget('gauge')).toEqual({ type: 'gauge', props: { data: { value: 0 } } });
  });

  it('seeds a chart.line widget with a minimal single-point series', () => {
    expect(seedWidget('chart.line')).toEqual({
      type: 'chart.line',
      props: { data: [{ t: '00:00', value: 0 }], mapping: { x: 't', y: 'value' } },
    });
  });

  it('lists exactly the three known widget types', () => {
    expect(WIDGET_TYPES).toEqual(['status', 'gauge', 'chart.line']);
  });
});
