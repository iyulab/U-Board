import { describe, expect, it } from 'vitest';
import { THEME_PALETTE, drawingColor, isThemeColor } from './theme-colors.js';
import { ELEMENT_THEME } from './renderer/element-template.js';

describe('theme colours', () => {
  it('draws a name as the palette has it in the board’s tone, in any case, and any other colour as it is', () => {
    expect(drawingColor('positive')).toBe('#15803d');
    expect(drawingColor(' WARNING ', 'dark')).toBe('#fbbf24');
    expect(drawingColor('#123456', 'dark')).toBe('#123456');
    expect(drawingColor('steelblue')).toBe('steelblue');
  });

  it('draws a tone as the widgets colour it, on either theme', () => {
    expect(['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'past', 'now', 'next'].map(t => drawingColor(t))).toEqual([
      '#15803d', '#2563eb', '#a16207', '#d97706', '#dc2626', '#78716c', '#64748b', '#5b6777', '#2563eb', '#1a1a2e',
    ]);
    expect(drawingColor('alarm', 'dark')).toBe('#f87171');
    expect(drawingColor('accent', 'dark', '#22d3ee')).toBe('#22d3ee');
  });

  it('draws accent as the board’s own, else the palette’s primary', () => {
    expect(drawingColor('accent', 'light', '#0f766e')).toBe('#0f766e');
    expect(drawingColor('accent', 'dark')).toBe('#818cf8');
    expect(drawingColor('accent', 'light', 'none')).toBe('#4f46e5');
    expect(drawingColor('accent', 'light', 'accent')).toBe('#4f46e5');
  });

  it('is the palette an element draws with — a ring and an element mean the same colour', () => {
    for (const tone of ['light', 'dark'] as const) {
      expect(ELEMENT_THEME[tone]['--u-widget-positive']).toBe(THEME_PALETTE[tone].positive);
      expect(ELEMENT_THEME[tone]['--u-widget-primary']).toBe(THEME_PALETTE[tone].primary);
    }
    expect(isThemeColor('negative')).toBe(true);
    expect(isThemeColor('red')).toBe(false);
  });
});
