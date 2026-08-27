import { describe, it, expect } from 'vitest';

describe('index entry (".")', () => {
  it('does not export DemoAdapter — it lives at the ./demo subpath so a published build never ships a demo-only class on its main surface', async () => {
    const mod = await import('./index.js');
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('still re-exports the authoring surface', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.AuthoringView).toBe('function');
    expect(typeof mod.resolveDocument).toBe('function');
  });
});
