import { describe, it, expect } from 'vitest';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './index.js';

describe('index entry (".")', () => {
  it('does not export DemoAdapter — it lives at the ./demo subpath so a published build never ships a demo-only class on its main surface', () => {
    expect('DemoAdapter' in mod).toBe(false);
  });

  it('still re-exports the authoring surface', () => {
    expect(typeof mod.AuthoringView).toBe('function');
    expect(typeof mod.resolveDocument).toBe('function');
  });
});
