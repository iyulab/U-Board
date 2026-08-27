import { describe, it, expect } from 'vitest';

describe('demo entry ("./demo")', () => {
  it('exports DemoAdapter, for callers doing pipeline validation before a real connector is configured', async () => {
    const mod = await import('./demo-entry.js');
    expect(typeof mod.DemoAdapter).toBe('function');
  });
});
