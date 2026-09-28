import { describe, it, expect } from 'vitest';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './domain-entry.js';

describe('domain entry', () => {
  it('does not export AuthoringView or ViewerPage, so importing it never pulls in React/canvas-kit', () => {
    expect('AuthoringView' in mod).toBe(false);
    expect('ViewerPage' in mod).toBe(false);
  });

  it('does not export DemoAdapter — no server process consumes it, it lives at ./demo instead', () => {
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('re-exports the domain surface a server process needs', () => {
    expect(typeof mod.resolveDocument).toBe('function');
    expect(typeof mod.isViewDocumentShape).toBe('function');
  });
});
