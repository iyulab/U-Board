import { describe, it, expect } from 'vitest';

describe('domain entry', () => {
  it('does not export AuthoringView or ViewerPage, so importing it never pulls in React/canvas-kit', async () => {
    const mod = await import('./domain-entry.js');
    expect('AuthoringView' in mod).toBe(false);
    expect('ViewerPage' in mod).toBe(false);
  });

  it('does not export DemoAdapter — no server process consumes it, it lives at ./demo instead', async () => {
    const mod = await import('./domain-entry.js');
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('re-exports the domain surface a server process needs', async () => {
    const mod = await import('./domain-entry.js');
    expect(typeof mod.resolveDocument).toBe('function');
    expect(typeof mod.isViewDocumentShape).toBe('function');
  });
});
