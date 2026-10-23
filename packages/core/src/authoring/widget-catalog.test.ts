import { describe, it, expect } from 'vitest';
import { seedWidget, headlinePropPath, WIDGET_TYPES } from './widget-catalog.js';

describe('seedWidget', () => {
  it('seeds a status widget with a visible placeholder value and no bindings', () => {
    expect(seedWidget('status')).toEqual({
      type: 'status',
      props: { data: { label: 'New node', tone: 'idle', value: 'Not bound' } },
    });
  });

  it('seeds a status widget in the words it is given', () => {
    expect(seedWidget('status', { label: '새 노드', value: '연결 전' }).props).toEqual({
      data: { label: '새 노드', tone: 'idle', value: '연결 전' },
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

describe('headlinePropPath', () => {
  it("names a widget type's headline value, and none for a type without one", () => {
    expect(headlinePropPath('status')).toBe('data.value');
    expect(headlinePropPath('gauge')).toBe('data.value');
    expect(headlinePropPath('chart.line')).toBeUndefined();
  });
});
