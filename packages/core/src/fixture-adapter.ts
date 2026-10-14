import type { Adapter, AdapterReference, ResolvedBinding } from './adapter.js';

/** An adapter that serves fixed values, for this package's own demo app and tests — not part of the
 * published library. Its id is `fixture`; a binding's `ref` is one of the string keys below —
 * `pump-a.state` and `pump-a.load` are live, `pump-b.state` is stale (a last-known value), and any
 * other key is disconnected. Exercises the resolution and connection-quality pipeline end to end. */
export class FixtureAdapter implements Adapter {
  readonly id = 'fixture';
  private data: Record<string, ResolvedBinding> = {
    'pump-a.state': { value: 'running', quality: 'live' },
    'pump-a.load': { value: 73, quality: 'live' },
    'pump-b.state': { value: 'stopped (last known)', quality: 'stale' },
  };

  async references(): Promise<readonly AdapterReference[]> {
    return Object.keys(this.data).map(ref => ({ ref }));
  }

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    return this.data[key] ?? { value: undefined, quality: 'disconnected' };
  }
}
