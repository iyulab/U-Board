import { describe, it, expect } from 'vitest';
import { resolveWidget, applyValueMap } from './adapter';
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

  it('records the cause an adapter gives for a binding that is not live', async () => {
    const source = new InMemoryAdapter('src', {
      a: { value: undefined, quality: 'disconnected', reason: 'address' },
      b: { value: 3, quality: 'stale', reason: 'transport' },
      c: { value: 1, quality: 'live', reason: 'throttled' },
    });
    const widget: Widget = {
      type: 'gauge',
      bindings: { 'data.a': { adapter: 'src', ref: 'a' }, 'data.b': { adapter: 'src', ref: 'b' }, 'data.c': { adapter: 'src', ref: 'c' } },
    };
    const resolved = await resolveWidget(widget, [source]);
    // A cause only means something next to an abnormal reading, so one on a live reading is dropped.
    expect(resolved.reasons).toEqual({ 'data.a': 'address', 'data.b': 'transport' });
  });

  it('carries no reasons at all when no binding reported a cause', async () => {
    const widget: Widget = { type: 'gauge', bindings: { 'data.value': { adapter: 'missing', ref: 'x' } } };
    const resolved = await resolveWidget(widget, []);
    // No matching adapter says nothing about why — the host may simply not have wired one.
    expect(resolved).toEqual({ type: 'gauge', props: {}, quality: { 'data.value': 'disconnected' } });
    expect('reasons' in resolved).toBe(false);
  });

  it('keeps the static default when an adapter reports a binding disconnected, whatever value it returns', async () => {
    const source = new InMemoryAdapter('src', {
      missing: { value: undefined, quality: 'disconnected', reason: 'address' },
      leftover: { value: 7, quality: 'disconnected' },
    });
    const widget: Widget = {
      type: 'gauge',
      props: { data: { value: '--', max: '--' } },
      bindings: { 'data.value': { adapter: 'src', ref: 'missing' }, 'data.max': { adapter: 'src', ref: 'leftover' } },
    };

    const resolved = await resolveWidget(widget, [source]);

    // A disconnected reading has no current value to show — the placeholder the author set stays,
    // and the cause still comes through for the renderer to explain it.
    expect(resolved.props).toEqual({ data: { value: '--', max: '--' } });
    expect(resolved.quality).toEqual({ 'data.value': 'disconnected', 'data.max': 'disconnected' });
    expect(resolved.reasons).toEqual({ 'data.value': 'address' });
  });

  it('adds no key for a disconnected binding that has no static default', async () => {
    const source = new InMemoryAdapter('src', { missing: { value: undefined, quality: 'disconnected' } });
    const widget: Widget = { type: 'status', props: { data: { label: 'Pump A' } }, bindings: { 'data.value': { adapter: 'src', ref: 'missing' } } };

    const resolved = await resolveWidget(widget, [source]);

    expect(resolved.props).toStrictEqual({ data: { label: 'Pump A' } });
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
  it('writes through a numeric path segment into an array without turning it into an object', async () => {
    const cmms = new InMemoryAdapter('cmms', { load: { value: 9, quality: 'live' } });
    const items = [{ v: 0 }, { v: 0 }];
    const widget: Widget = { type: 'chart.bar', props: { items }, bindings: { 'items.1.v': { adapter: 'cmms', ref: 'load' } } };

    const resolved = await resolveWidget(widget, [cmms]);

    expect(resolved.props).toEqual({ items: [{ v: 0 }, { v: 9 }] });
    expect(Array.isArray(resolved.props.items)).toBe(true);
    expect(items).toEqual([{ v: 0 }, { v: 0 }]);
  });
});

describe('resolveWidget observedAt', () => {
  const at = '2026-10-04T09:00:00.000Z';
  const fixed = (id: string, reading: ResolvedBinding): Adapter => ({ id, resolve: async () => reading });

  it('records when each live or stale value was observed, per prop path', async () => {
    const widget: Widget = {
      type: 'status',
      bindings: { 'data.value': { adapter: 'live', ref: 'a' }, 'data.limit': { adapter: 'stale', ref: 'b' } },
    };
    const resolved = await resolveWidget(widget, [
      fixed('live', { value: 1, quality: 'live', observedAt: at }),
      fixed('stale', { value: 2, quality: 'stale', reason: 'transport', observedAt: '2026-10-01T00:00:00.000Z' }),
    ]);
    expect(resolved.observedAt).toEqual({ 'data.value': at, 'data.limit': '2026-10-01T00:00:00.000Z' });
  });

  it('ignores observedAt on a disconnected reading, and is absent when no adapter reports one', async () => {
    const widget: Widget = { type: 'status', bindings: { 'data.value': { adapter: 'gone', ref: 'a' } } };
    const disconnected = await resolveWidget(widget, [fixed('gone', { value: undefined, quality: 'disconnected', observedAt: at })]);
    expect(disconnected.observedAt).toBeUndefined();
    const unknown = await resolveWidget(widget, [fixed('gone', { value: 1, quality: 'live' })]);
    expect('observedAt' in unknown).toBe(false);
  });
});

describe('value maps', () => {
  // A source speaks its own vocabulary ("Fault", 3, true); a widget prop wants its own (a status
  // level). A binding's map translates one into the other, before the value reaches the props.
  const levels = { values: { Fault: 'error', Running: 'success', '3': 'warning', true: 'info', null: 'neutral' }, otherwise: 'neutral' };

  it('looks a value up by its text, for strings, numbers, booleans and null', () => {
    expect(applyValueMap(levels, 'Fault')).toBe('error');
    expect(applyValueMap(levels, 3)).toBe('warning');
    expect(applyValueMap(levels, true)).toBe('info');
    expect(applyValueMap(levels, null)).toBe('neutral');
  });

  it('answers a value with no entry with `otherwise`, and passes it through when there is none', () => {
    expect(applyValueMap(levels, 'Idle')).toBe('neutral');
    expect(applyValueMap({ values: { Fault: 'error' } }, 'Idle')).toBe('Idle');
    expect(applyValueMap({ values: { Fault: 'error' } }, { nested: 1 })).toEqual({ nested: 1 });
  });

  it('passes the value through a map that is not one — a document that was never validated', () => {
    expect(applyValueMap({} as never, 'Fault')).toBe('Fault');
    expect(applyValueMap({ values: null } as never, 'Fault')).toBe('Fault');
  });

  describe('ranges', () => {
    // A bearing temperature: alarm at 80 and above, warning from 70, normal below.
    const temp = {
      ranges: [{ min: 80, value: 'error' }, { min: 70, max: 80, value: 'warning' }, { max: 70, value: 'success' }],
      otherwise: 'neutral',
    };

    it('gives a number the first range it falls in — min included, max not', () => {
      expect(applyValueMap(temp, 92.5)).toBe('error');
      expect(applyValueMap(temp, 80)).toBe('error');
      expect(applyValueMap(temp, 79.99)).toBe('warning');
      expect(applyValueMap(temp, 70)).toBe('warning');
      expect(applyValueMap(temp, -5)).toBe('success');
    });

    it('reads text that is a number as one, and nothing else', () => {
      expect(applyValueMap(temp, ' 92.5 ')).toBe('error');
      expect(applyValueMap(temp, '1e2')).toBe('error');
      expect(applyValueMap(temp, '-.5')).toBe('success');
      expect(applyValueMap(temp, '+75')).toBe('warning');
      for (const notANumber of ['', '  ', 'hot', '0x10', '0b11', '85 C', '1e999', true, null, NaN, Infinity, [85], { v: 85 }]) {
        expect(applyValueMap(temp, notANumber)).toBe('neutral');
      }
    });

    it('takes the first match when ranges overlap', () => {
      expect(applyValueMap({ ranges: [{ min: 0, value: 'a' }, { min: 50, value: 'b' }] }, 60)).toBe('a');
    });

    it('lets an exact value win over a range, and passes through a number no range holds', () => {
      const map = { values: { '0': 'off' }, ranges: [{ min: 0, max: 10, value: 'low' }] };
      expect(applyValueMap(map, 0)).toBe('off');
      expect(applyValueMap(map, 5)).toBe('low');
      expect(applyValueMap(map, 50)).toBe(50);
    });

    it('ignores a range with no numeric bound — a document that was never validated', () => {
      expect(applyValueMap({ ranges: [{ value: 'x' }, { min: '5', value: 'y' }, null] } as never, 7)).toBe(7);
    });
  });

  it('only looks up an entry the map itself has — never one inherited from Object', () => {
    expect(applyValueMap({ values: { Fault: 'error' } }, 'toString')).toBe('toString');
  });

  it('maps a bound value before it reaches the props, live or stale, and leaves a disconnected one alone', async () => {
    const plant = new InMemoryAdapter('plant', {
      a: { value: 'Fault', quality: 'live' },
      b: { value: 'Running', quality: 'stale' },
      c: { value: 'Fault', quality: 'disconnected' },
    });
    const widget = (ref: string): Widget => ({
      type: 'status',
      props: { data: { label: 'Pump', level: 'neutral', value: '?' } },
      bindings: {
        'data.value': { adapter: 'plant', ref },
        'data.level': { adapter: 'plant', ref, map: levels },
      },
    });
    expect((await resolveWidget(widget('a'), [plant])).props.data).toEqual({ label: 'Pump', level: 'error', value: 'Fault' });
    expect((await resolveWidget(widget('b'), [plant])).props.data).toEqual({ label: 'Pump', level: 'success', value: 'Running' });
    const disconnected = await resolveWidget(widget('c'), [plant]);
    expect(disconnected.props.data).toEqual({ label: 'Pump', level: 'neutral', value: '?' });
    expect(disconnected.quality['data.level']).toBe('disconnected');
  });
});

