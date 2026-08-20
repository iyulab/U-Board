import { describe, it, expect } from 'vitest';
import { DemoAdapter } from './demo-adapter';

describe('DemoAdapter', () => {
  it('resolves a known key as live', async () => {
    const adapter = new DemoAdapter();
    await expect(adapter.resolve('pump-a.state')).resolves.toEqual({ value: 'running', quality: 'live' });
  });

  it('resolves an unknown key as disconnected', async () => {
    const adapter = new DemoAdapter();
    await expect(adapter.resolve('unknown.key')).resolves.toEqual({ value: undefined, quality: 'disconnected' });
  });

  it('has id "demo-cmms"', () => {
    expect(new DemoAdapter().id).toBe('demo-cmms');
  });
});
