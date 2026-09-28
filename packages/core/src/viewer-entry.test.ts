import { describe, it, expect } from 'vitest';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './viewer-entry.js';

describe('viewer entry ("./viewer")', () => {
  it('does not export DemoAdapter — it lives at the ./demo subpath, and no viewer consumer uses it', () => {
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('still re-exports the viewer surface', () => {
    expect(typeof mod.ViewerPage).toBe('function');
  });
});
