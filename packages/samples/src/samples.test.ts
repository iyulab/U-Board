import { describe, it, expect } from 'vitest';
import { resolveDocument, validateViewDocument, type Node } from '@iyulab/u-board/domain';
import { SAMPLE_PACKS, snapshotAdapters, valueAtPointer } from './index.js';
import { keepPointers } from './prune.js';

const overlaps = (a: Node, b: Node) =>
  a.x < b.x + (b.width ?? 0) && b.x < a.x + (a.width ?? 0) && a.y < b.y + (b.height ?? 0) && b.y < a.y + (a.height ?? 0);

describe.each(SAMPLE_PACKS.map(pack => [pack.id, pack] as const))('sample %s', (_id, pack) => {
  it('is a valid view document', () => {
    expect(validateViewDocument(pack.document)).toEqual([]);
  });

  it('binds only to its own connectors, each crediting its source', () => {
    const keys = new Set(pack.connectors.map(c => c.key));
    for (const node of pack.document.nodes) {
      for (const binding of Object.values(node.widget.bindings ?? {})) expect(keys, `${node.id} → ${binding.adapter}`).toContain(binding.adapter);
    }
    for (const connector of pack.connectors) {
      expect(connector.attribution.text.trim()).not.toBe('');
      if (connector.authType === 'path') expect(connector.baseUrl.split('{key}')).toHaveLength(2);
    }
  });

  it('reads every binding live from its recording', async () => {
    expect(Date.parse(pack.snapshot.capturedAt)).toBeGreaterThan(Date.parse('2026-01-01'));
    const resolved = await resolveDocument(pack.document, snapshotAdapters(pack));
    for (const node of resolved.nodes) {
      for (const [prop, quality] of Object.entries(node.widget.quality)) expect(quality, `${node.id} ${prop}`).toBe('live');
    }
  });

  it('places every node on its background, none over another', () => {
    const { width, height } = pack.document.background.image!;
    const nodes = pack.document.nodes;
    for (const node of nodes) {
      expect(node.x, node.id).toBeGreaterThanOrEqual(0);
      expect(node.y, node.id).toBeGreaterThanOrEqual(0);
      expect(node.x + (node.width ?? 0), node.id).toBeLessThanOrEqual(width);
      expect(node.y + (node.height ?? 0), node.id).toBeLessThanOrEqual(height);
    }
    for (const [i, a] of nodes.entries()) for (const b of nodes.slice(i + 1)) expect(overlaps(a, b), `${a.id} × ${b.id}`).toBe(false);
  });
});

describe('a recording', () => {
  it('keeps only what the pointers reach, rows in their places', () => {
    const body = { a: { rows: [{ n: 1, x: 'drop' }, { n: 2 }, { n: 3 }], other: 'drop' }, b: 'drop' };
    expect(keepPointers(body, ['/a/rows/0/n', '/a/rows/2'])).toEqual({ a: { rows: [{ n: 1 }, null, { n: 3 }] } });
    expect(keepPointers(body, [''])).toBe(body);
  });

  it('is read by JSON Pointer, escapes included', () => {
    expect(valueAtPointer({ 'a/b': { '~c': 1 } }, '/a~1b/~0c')).toEqual({ found: true, value: 1 });
    expect(valueAtPointer({ a: 1 }, '/b')).toEqual({ found: false });
  });
});
