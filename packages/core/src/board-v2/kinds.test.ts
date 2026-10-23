import { describe, expect, it } from 'vitest';
import { help } from '@iyulab/u-widgets/tools';
import { PART_KINDS, boardWordFor, partKind } from './kinds.js';

describe('part kinds', () => {
  it("names the general built-ins by the board's words, each drawn by a widget of the library", () => {
    expect(partKind('stat')).toMatchObject({ widget: 'metric', of: 'needs' });
    expect(partKind('stat-list')).toMatchObject({ widget: 'kv', of: 'needs' });
    expect(partKind('status-card')?.shows).toMatch(/asset or place/);
    expect(partKind('gauge')?.options).toEqual(expect.arrayContaining(['min', 'max', 'form']));
  });

  it("lists every chart the library has, so a chart it adds is a kind at once", () => {
    const charts = (help() as { widget: string; category: string }[]).filter(w => w.category === 'chart').map(w => w.widget);
    expect(charts).toContain('chart.gantt');
    for (const chart of charts) expect(partKind(chart)?.widget).toBe(chart);
  });

  it("has the board's own kinds, which no widget draws", () => {
    for (const kind of ['marker', 'label', 'legend', 'group', 'element']) expect(partKind(kind)?.widget).toBeUndefined();
    expect(partKind('legend')?.of).toBe('no');
  });

  it("does not take the library's names where the board has its own word, and says the board's word", () => {
    for (const name of ['metric', 'kv', 'status', 'timeline']) expect(partKind(name)).toBeUndefined();
    expect(['metric', 'kv', 'status', 'timeline'].map(boardWordFor)).toEqual(['stat', 'stat-list', 'stat-list', undefined]);
    expect(new Set(PART_KINDS.map(k => k.kind)).size).toBe(PART_KINDS.length);
  });
});
