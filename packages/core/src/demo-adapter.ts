import type { Adapter, ResolvedBinding } from './adapter.js';

/** A stand-in for a real CMMS adapter (실제 CMMS adapter 구현은 그 시스템 접근이 필요해 별도).
 * Exercises the resolution/connection-quality pipeline end-to-end without a real system — one
 * live value, one stale (last-known) value, and one that's never connected. */
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
