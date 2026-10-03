import type { Adapter, ResolvedBinding } from './adapter.js';

/** An adapter that serves fixed sample values, for previewing a board before a real data source is
 * connected. Its id is `demo-cmms`; a binding's `ref` is one of the string keys below —
 * `pump-a.state` and `pump-a.load` are live, `pump-b.state` is stale (a last-known value), and any
 * other key is disconnected. Exercises the resolution and connection-quality pipeline end to end. */
export class DemoAdapter implements Adapter {
  readonly id = 'demo-cmms';
  private data: Record<string, ResolvedBinding> = {
    'pump-a.state': { value: 'running', quality: 'live' },
    'pump-a.load': { value: 73, quality: 'live' },
    'pump-b.state': { value: 'stopped (last known)', quality: 'stale' },
  };

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    return this.data[key] ?? { value: undefined, quality: 'disconnected' };
  }
}
