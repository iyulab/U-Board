import { describe, it, expect, vi, beforeEach } from 'vitest';

const loaded = vi.fn();
vi.mock('@iyulab/u-widgets/charts', () => {
  loaded();
  return {};
});

beforeEach(() => {
  loaded.mockClear();
  vi.resetModules();
});

async function entry() {
  return import('./chart-entry.js');
}

describe('chart entry', () => {
  it('is not loaded by reading the module, nor by a board without a chart', async () => {
    const { needChartEntry } = await entry();
    needChartEntry(['metric', 'table', 'status-card']);
    await Promise.resolve();
    expect(loaded).not.toHaveBeenCalled();
  });

  it('is loaded once, when a chart is named', async () => {
    const { needChartEntry } = await entry();
    needChartEntry(['metric', 'chart.bar']);
    needChartEntry(['chart.line']);
    needChartEntry(['chart.gantt']);
    await vi.waitFor(() => expect(loaded).toHaveBeenCalledTimes(1));
  });

  it('knows a chart type by its family', async () => {
    const { isChartType } = await entry();
    expect(isChartType('chart.heatmap')).toBe(true);
    expect(isChartType('chart')).toBe(false);
    expect(isChartType('metric')).toBe(false);
  });
});
