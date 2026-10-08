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
    expect(typeof mod.serverClock).toBe('function');
  });

  it('offers the labels in Korean, ages and times of day included', () => {
    expect(mod.KO_LABELS.zoomIn).toBe('확대');
    expect(mod.KO_LABELS.qualityText.quality.disconnected).toMatch(/^연결 끊김/);
    expect(mod.KO_LABELS.qualityText.age(5 * 60_000)).toMatch(/분/);
    // Every key the English set has — a label added to one and not the other would fall back to English.
    expect(Object.keys(mod.KO_LABELS).sort()).toEqual(Object.keys(mod.DEFAULT_LABELS).sort());
  });
});
