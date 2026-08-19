import { describe, it, expect } from 'vitest';
import { resolveWidget } from './adapter';
import type { Adapter, ResolvedBinding } from './adapter';
import type { Widget } from './view-document';

class InMemoryAdapter implements Adapter {
  readonly id: string;
  private data: Map<string, ResolvedBinding>;

  constructor(id: string, data: Record<string, ResolvedBinding>) {
    this.id = id;
    this.data = new Map(Object.entries(data));
  }

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    return this.data.get(key) ?? { value: undefined, quality: 'disconnected' };
  }
}

describe('resolveWidget', () => {
  it('returns static props unchanged for a widget with no bindings', async () => {
    const widget: Widget = { type: 'uw-metric', props: { label: 'Note' } };
    const resolved = await resolveWidget(widget, []);
    expect(resolved).toEqual({ type: 'uw-metric', props: { label: 'Note' }, quality: {} });
  });

  it('carries the widget type through unchanged', async () => {
    const widget: Widget = { type: 'gauge', props: {} };
    const resolved = await resolveWidget(widget, []);
    expect(resolved.type).toBe('gauge');
  });

  it('merges a resolved binding value into props and marks it live', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      'pump-a.runningState': { value: 'running', quality: 'live' },
    });
    const widget: Widget = {
      type: 'uw-status',
      props: { label: 'Pump A' },
      bindings: { value: { adapter: 'cmms', ref: 'pump-a.runningState' } },
    };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props).toEqual({ label: 'Pump A', value: 'running' });
    expect(resolved.quality).toEqual({ value: 'live' });
  });

  it('passes through a stale last-known value from the adapter without collapsing it to disconnected', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      'pump-a.runningState': { value: 'running (last known)', quality: 'stale' },
    });
    const widget: Widget = {
      type: 'uw-status',
      bindings: { value: { adapter: 'cmms', ref: 'pump-a.runningState' } },
    };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props.value).toBe('running (last known)');
    expect(resolved.quality.value).toBe('stale');
  });

  it('marks a binding disconnected and leaves props untouched when no adapter matches its id', async () => {
    const widget: Widget = {
      type: 'uw-status',
      props: { value: 'last-known' },
      bindings: { value: { adapter: 'missing-adapter', ref: 'x' } },
    };

    const resolved = await resolveWidget(widget, []);

    expect(resolved.props.value).toBe('last-known');
    expect(resolved.quality.value).toBe('disconnected');
  });

  it('reports disconnected instead of throwing when an adapter rejects', async () => {
    const flaky: Adapter = {
      id: 'flaky',
      resolve: async () => {
        throw new Error('network timeout');
      },
    };
    const widget: Widget = {
      type: 'uw-status',
      props: { value: 'last-known' },
      bindings: { value: { adapter: 'flaky', ref: 'x' } },
    };

    const resolved = await resolveWidget(widget, [flaky]);

    expect(resolved.props.value).toBe('last-known');
    expect(resolved.quality.value).toBe('disconnected');
  });

  it('does not let one binding rejecting stop the others from resolving', async () => {
    const flaky: Adapter = {
      id: 'flaky',
      resolve: async () => {
        throw new Error('network timeout');
      },
    };
    const cmms = new InMemoryAdapter('cmms', { temp: { value: 42, quality: 'live' } });
    const widget: Widget = {
      type: 'uw-metric',
      bindings: {
        broken: { adapter: 'flaky', ref: 'x' },
        ok: { adapter: 'cmms', ref: 'temp' },
      },
    };

    const resolved = await resolveWidget(widget, [flaky, cmms]);

    expect(resolved.quality).toEqual({ broken: 'disconnected', ok: 'live' });
    expect(resolved.props.ok).toBe(42);
  });

  it('resolves multiple bindings against different adapters concurrently', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      temp: { value: 42, quality: 'live' },
    });
    const weather = new InMemoryAdapter('weather', {
      outsideTemp: { value: 18, quality: 'live' },
    });
    const widget: Widget = {
      type: 'uw-metric',
      bindings: {
        insideTemp: { adapter: 'cmms', ref: 'temp' },
        outsideTemp: { adapter: 'weather', ref: 'outsideTemp' },
      },
    };

    const resolved = await resolveWidget(widget, [cmms, weather]);

    expect(resolved.props).toEqual({ insideTemp: 42, outsideTemp: 18 });
    expect(resolved.quality).toEqual({ insideTemp: 'live', outsideTemp: 'live' });
  });

  it('does not add a quality entry for props that have no binding', async () => {
    const widget: Widget = { type: 'uw-metric', props: { label: 'static' } };
    const resolved = await resolveWidget(widget, []);
    expect(resolved.quality).toEqual({});
    expect('label' in resolved.quality).toBe(false);
  });

  it('resolves a dotted binding path into a nested field without disturbing its siblings', async () => {
    const cmms = new InMemoryAdapter('cmms', { state: { value: 'running', quality: 'live' } });
    const widget: Widget = {
      type: 'status',
      props: { data: { label: 'Pump A' } },
      bindings: { 'data.status': { adapter: 'cmms', ref: 'state' } },
    };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props).toEqual({ data: { label: 'Pump A', status: 'running' } });
    expect(resolved.quality).toEqual({ 'data.status': 'live' });
  });

  it('does not mutate the original widget when resolving a nested binding path', async () => {
    const cmms = new InMemoryAdapter('cmms', { state: { value: 'running', quality: 'live' } });
    const originalData = { label: 'Pump A' };
    const widget: Widget = {
      type: 'status',
      props: { data: originalData },
      bindings: { 'data.status': { adapter: 'cmms', ref: 'state' } },
    };

    await resolveWidget(widget, [cmms]);

    expect(originalData).toEqual({ label: 'Pump A' });
    expect('status' in originalData).toBe(false);
  });
});
