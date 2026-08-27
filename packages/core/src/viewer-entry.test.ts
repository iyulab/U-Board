import { describe, it, expect } from 'vitest';

describe('viewer entry ("./viewer")', () => {
  it('does not export DemoAdapter — it lives at the ./demo subpath, and no viewer consumer uses it', async () => {
    const mod = await import('./viewer-entry.js');
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('still re-exports the viewer surface', async () => {
    const mod = await import('./viewer-entry.js');
    expect(typeof mod.ViewerPage).toBe('function');
  });
});
