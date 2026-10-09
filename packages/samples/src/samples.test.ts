import { describe, it, expect } from 'vitest';
import { coordinateOf, resolveDocument, validateViewDocument, type Node } from '@iyulab/u-board/domain';
import { SAMPLE_PACKS, snapshotAdapters } from './index.js';
import { BIKE_STATIONS } from './packs/gwanghwamun.js';
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
    // A blank reading is how a source says "no value here" — an entry that reports nothing, picked by mistake.
    const adapters = new Map(snapshotAdapters(pack).map(a => [a.id, a]));
    for (const node of pack.document.nodes) {
      for (const [prop, binding] of Object.entries(node.widget.bindings ?? {})) {
        const { value } = await adapters.get(binding.adapter)!.resolve(binding.ref);
        expect(value === '' || value === null, `${node.id} ${prop} reads "${String(value)}"`).toBe(false);
      }
    }
  });

  it('says when the source observed each value it gives a time for — before the recording, within the hour or two a source lags', async () => {
    const adapters = new Map(snapshotAdapters(pack).map(a => [a.id, a]));
    const capturedAt = Date.parse(pack.snapshot.capturedAt);
    for (const node of pack.document.nodes) {
      for (const [prop, binding] of Object.entries(node.widget.bindings ?? {})) {
        if ((binding.ref as { observedAtPath?: string }).observedAtPath === undefined) continue;
        const observedAt = Date.parse((await adapters.get(binding.adapter)!.resolve(binding.ref)).observedAt!);
        expect(observedAt, `${node.id} ${prop}`).toBeLessThanOrEqual(capturedAt);
        expect(capturedAt - observedAt, `${node.id} ${prop}`).toBeLessThan(2 * 60 * 60_000);
      }
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

describe('a list item bound by its fields', () => {
  it('reads the same item when the source lists them in another order', async () => {
    const pack = SAMPLE_PACKS.find(p => p.id === 'gwanghwamun')!;
    const before = await resolveDocument(pack.document, snapshotAdapters(pack));
    const reordered = structuredClone(pack.snapshot);
    for (const answer of Object.values(reordered.responses['seoul-city-data'])) {
      const city = (answer as { CITYDATA: { SBIKE_STTS: unknown[] } }).CITYDATA;
      city.SBIKE_STTS.reverse();
    }
    const after = await resolveDocument(pack.document, snapshotAdapters({ ...pack, snapshot: reordered }));
    expect(after.nodes.map(n => n.widget.props)).toEqual(before.nodes.map(n => n.widget.props));
  });
});

describe('a map whose anchors are coordinates', () => {
  it('reads each bike station back at its longitude and latitude, within the rounding of its place on the drawing', () => {
    const pack = SAMPLE_PACKS.find(p => p.id === 'gwanghwamun')!;
    for (const { id, lat, lng } of BIKE_STATIONS) {
      const node = pack.document.nodes.find(n => n.id === `bike-${id}`)!;
      expect(node.anchored, id).toBe(true);
      const coordinate = coordinateOf(pack.document.background, node)!;
      // Half a scene unit on this drawing is about a metre either way.
      expect(Math.abs(coordinate.x - lng), id).toBeLessThan(0.00002);
      expect(Math.abs(coordinate.y - lat), id).toBeLessThan(0.00002);
    }
  });
});

describe('a recording', () => {
  it('keeps only what the pointers reach, rows in their places', () => {
    const body = { a: { rows: [{ n: 1, x: 'drop' }, { n: 2 }, { n: 3 }], other: 'drop' }, b: 'drop' };
    expect(keepPointers(body, ['/a/rows/0/n', '/a/rows/2'])).toEqual({ a: { rows: [{ n: 1 }, null, { n: 3 }] } });
    expect(keepPointers(body, [''])).toBe(body);
  });
});
