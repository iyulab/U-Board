import { describe, it, expect } from 'vitest';
import { seedWidget, defaultPropPath, WIDGET_TYPES } from './widget-catalog.js';

describe('seedWidget', () => {
  it('seeds a status widget with a visible placeholder value and no bindings', () => {
    expect(seedWidget('status')).toEqual({
      type: 'status',
      props: { data: { label: 'New node', level: 'neutral', value: 'Not bound' } },
    });
  });

  it('seeds a status widget in the words it is given', () => {
    expect(seedWidget('status', { label: '새 노드', value: '연결 전' }).props).toEqual({
      data: { label: '새 노드', level: 'neutral', value: '연결 전' },
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

describe('defaultPropPath', () => {
  it("starts on the widget's headline value while it is unbound", () => {
    expect(defaultPropPath(seedWidget('status'))).toBe('data.value');
    expect(defaultPropPath(seedWidget('gauge'))).toBe('data.value');
  });

  it('starts empty once the headline value is bound, or for a widget without one', () => {
    expect(defaultPropPath({ ...seedWidget('status'), bindings: { 'data.value': { adapter: 'a', ref: 'r' } } })).toBe('');
    expect(defaultPropPath(seedWidget('chart.line'))).toBe('');
  });
});
