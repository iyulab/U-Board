/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
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

/** Every module `entry` reaches through relative imports, and the packages those modules import. */
function moduleGraph(entry: string): { files: string[]; packages: Set<string> } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    for (const [, spec] of readFileSync(file, 'utf-8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      if (!spec.startsWith('.')) {
        packages.add(spec);
        continue;
      }
      const base = resolve(dirname(file), spec).replace(/\.js$/, '');
      const next = ['.ts', '.tsx'].map(ext => base + ext).find(existsSync);
      if (next) visit(next);
    }
  };
  visit(resolve(process.cwd(), 'src', entry));
  return { files: [...files].map(f => relative(resolve(process.cwd(), 'src'), f).replace(/\\/g, '/')), packages };
}

// docs/principles.md — the renderer never depends on the authoring tool. A viewer-only consumer must
// not load the editor, the designer, or the widget metadata the property panel reads.
describe.each(['viewer-entry.ts', 'domain-entry.ts'])('%s module graph', entry => {
  const { files, packages } = moduleGraph(entry);

  it('reaches no authoring module', () => {
    expect(files.filter(f => f.startsWith('authoring/'))).toEqual([]);
  });

  it('imports neither the designer nor the widget metadata', () => {
    expect([...packages].filter(p => p === '@canvas-kit/designer' || p === '@iyulab/u-widgets/tools')).toEqual([]);
  });
});
