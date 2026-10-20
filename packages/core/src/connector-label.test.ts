import { describe, expect, it } from 'vitest';
import { fillLabel, isLabelPattern, labelNamesValue, labelPatternError, shownLabel } from './connector-label.js';

describe('connector label patterns', () => {
  it('fills {{value}}, with fixed digits for a number or text that reads as one, and a dash for no value', () => {
    expect(fillLabel('{{value | fixed:2}} Gbps', 1.2)).toBe('1.20 Gbps');
    expect(fillLabel('{{value | fixed:0}} %', '87.6')).toBe('88 %');
    expect(fillLabel('{{value | fixed:1}}', 'down')).toBe('down');
    expect(fillLabel('{{value}} / {{value}}', 3)).toBe('3 / 3');
    expect(fillLabel('{{value}} Mbps', undefined)).toBe('— Mbps');
    expect(fillLabel('{{value}} Mbps', { a: 1 })).toBe('— Mbps');
  });

  it('shows a pattern that does not read as it is, and draws an unfilled one with a dash', () => {
    expect(fillLabel('{{value', 3)).toBe('{{value');
    expect(shownLabel('{{value | fixed:1}} Mbps')).toBe('— Mbps');
    expect(shownLabel('N/A')).toBe('N/A');
  });

  it('tells a pattern, what is wrong with one, and whether it has a place for the value — a parameter of that name taking it', () => {
    expect(isLabelPattern('Mbps')).toBe(false);
    expect(isLabelPattern('{{value}}')).toBe(true);
    expect(labelPatternError('{{value}} via {{name}}')).toContain('"{{name}}" names nothing');
    expect(labelPatternError('{{value}} via {{name}}', new Set(['name']))).toBeUndefined();
    expect(labelNamesValue('{{name}}', new Set(['name']))).toBe(false);
    expect(labelNamesValue('{{value}}')).toBe(true);
    expect(labelNamesValue('{{value}}', new Set(['value']))).toBe(false);
  });
});
