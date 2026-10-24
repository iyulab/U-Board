import { describe, it, expect } from 'vitest';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './index.js';

describe('index entry (".")', () => {
  it("does not export FixtureAdapter — the fixture serves only this package's demo app and tests", () => {
    expect('FixtureAdapter' in mod).toBe(false);
  });

  it('re-exports the authoring surface and the board language', () => {
    expect(typeof mod.BoardAuthoring).toBe('function');
    expect(typeof mod.checkBoard).toBe('function');
  });
});
