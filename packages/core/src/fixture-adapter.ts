import type { Adapter, ResolvedBinding } from './adapter.js';
import { isHttpRef, readHttpRef, resolvedReading } from './http-ref.js';

/** An adapter that serves fixed values, for this package's own demo app and tests — not part of the
 * published library. Its id is `fixture`; a binding's `ref` is one of the string keys below —
 * `pump-a.state` and `pump-a.load` are live, `pump-b.state` is stale (a last-known value), and any
 * other key is disconnected — and, as an HTTP connector answers a request, `/pump-a/load` answers Pump A's load by the
 * hour. Exercises the resolution and connection-quality pipeline end to end. */
export class FixtureAdapter implements Adapter {
  readonly id = 'fixture';
  private data: Record<string, ResolvedBinding> = {
    'pump-a.state': { value: 'running', quality: 'live' },
    'pump-a.load': { value: 73, quality: 'live' },
    'pump-b.state': { value: 'stopped (last known)', quality: 'stale' },
  };

  private answers: Record<string, unknown> = {
    '/pump-a/load': { value: [{ t: '09:00', load: 61 }, { t: '10:00', load: 68 }, { t: '11:00', load: 73 }, { t: '12:00', load: 70 }] },
  };

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    if (isHttpRef(ref)) {
      const reading = Object.hasOwn(this.answers, ref.path) ? readHttpRef(this.answers[ref.path], ref, Date.now()) : undefined;
      return reading?.ok ? resolvedReading(reading) : { value: undefined, quality: 'disconnected' };
    }
    return this.data[ref as string] ?? { value: undefined, quality: 'disconnected' };
  }
}
