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
    return this.data.get(key) ?? { value: undefined, connected: false };
  }
}

describe('resolveWidget', () => {
  it('returns static props unchanged for a widget with no bindings', async () => {
    const widget: Widget = { type: 'uw-metric', props: { label: 'Note' } };
    const resolved = await resolveWidget(widget, []);
    expect(resolved).toEqual({ props: { label: 'Note' }, connected: {} });
  });

  it('merges a resolved binding value into props and marks it connected', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      'pump-a.runningState': { value: 'running', connected: true },
    });
    const widget: Widget = {
      type: 'uw-status',
      props: { label: 'Pump A' },
      bindings: { value: { adapter: 'cmms', ref: 'pump-a.runningState' } },
    };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props).toEqual({ label: 'Pump A', value: 'running' });
    expect(resolved.connected).toEqual({ value: true });
  });

  it('surfaces a disconnected source without discarding the last-known value', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      'pump-a.runningState': { value: 'stopped', connected: false },
    });
    const widget: Widget = {
      type: 'uw-status',
      bindings: { value: { adapter: 'cmms', ref: 'pump-a.runningState' } },
    };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props.value).toBe('stopped');
    expect(resolved.connected.value).toBe(false);
  });

  it('marks a binding disconnected and leaves props untouched when no adapter matches its id', async () => {
    const widget: Widget = {
      type: 'uw-status',
      props: { value: 'last-known' },
      bindings: { value: { adapter: 'missing-adapter', ref: 'x' } },
    };

    const resolved = await resolveWidget(widget, []);

    expect(resolved.props.value).toBe('last-known');
    expect(resolved.connected.value).toBe(false);
  });

  it('resolves multiple bindings against different adapters concurrently', async () => {
    const cmms = new InMemoryAdapter('cmms', {
      temp: { value: 42, connected: true },
    });
    const weather = new InMemoryAdapter('weather', {
      outsideTemp: { value: 18, connected: true },
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
    expect(resolved.connected).toEqual({ insideTemp: true, outsideTemp: true });
  });

  it('does not add a connected entry for props that have no binding', async () => {
    const widget: Widget = { type: 'uw-metric', props: { label: 'static' } };
    const resolved = await resolveWidget(widget, []);
    expect(resolved.connected).toEqual({});
    expect('label' in resolved.connected).toBe(false);
  });
});
