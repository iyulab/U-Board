import { describe, it, expect } from 'vitest';
import { checkSpec } from '@iyulab/u-widgets/tools';
import { pictureOf, readerOf } from '@iyulab/u-board/domain';
import { checkBoard } from '@iyulab/u-board-designer/check';
import { isCanvasItem, isSourceErrorField, placedIn, resolveDocument, sizedNodes, sourceErrorIn, type CanvasView, type Node, type ViewDocument } from '@iyulab/u-board/picture';
import { SAMPLE_PACKS, isInstallable, isLiveConnector, snapshotAdapters } from './index.js';
import { keepPointers } from './prune.js';

const overlaps = (a: Node, b: Node) =>
  a.x < b.x + (b.width ?? 0) && b.x < a.x + (a.width ?? 0) && a.y < b.y + (b.height ?? 0) && b.y < a.y + (a.height ?? 0);

// Each sample's board as the renderer draws it — with the items its recording lists.
const pictures = new Map<string, ViewDocument>(
  await Promise.all(SAMPLE_PACKS.map(async pack => [pack.id, await pictureOf(pack.board, readerOf(snapshotAdapters(pack)))] as const))
);

describe.each(SAMPLE_PACKS.map(pack => [pack.id, pack] as const))('sample %s', (_id, pack) => {
  it('is a valid board', () => {
    expect(checkBoard(pack.board).issues).toEqual([]);
  });

  const drawn = pictures.get(pack.id)!;

  it('binds only to its own connectors, each crediting its source', () => {
    const keys = new Set(pack.connectors.map(c => c.key));
    for (const node of placedIn(drawn)) {
      for (const binding of Object.values(node.widget.bindings ?? {})) expect(keys, `${node.id} → ${binding.adapter}`).toContain(binding.adapter);
    }
    for (const connector of pack.connectors) {
      expect(connector.attribution.text.trim()).not.toBe('');
      if (!isLiveConnector(connector)) expect(connector.attribution.text, connector.key).toContain('예시 데이터');
      else if (connector.authType === 'path') expect(connector.baseUrl.split('{key}')).toHaveLength(2);
      // A source asked with a key carries either the key it publishes to try with or where to get one — never both.
      if (isLiveConnector(connector) && connector.authType !== 'none') {
        expect([connector.authValue, connector.ownKey].filter(v => v !== undefined), connector.key).toHaveLength(1);
      }
      // Where the source reports errors is a setting a data source accepts, and no recorded answer is one.
      if (isLiveConnector(connector) && connector.sourceError) {
        expect(isSourceErrorField(connector.sourceError), connector.key).toBe(true);
        for (const [path, answer] of Object.entries(pack.snapshot.responses[connector.key] ?? {})) {
          expect(sourceErrorIn(answer, connector.sourceError), `${connector.key} ${path}`).toBeUndefined();
        }
      }
      if (isLiveConnector(connector) && connector.ownKey) {
        expect(connector.ownKey.signUpUrl, connector.key).toMatch(/^https:\/\//);
        expect(connector.ownKey.env, connector.key).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }
    }
  });

  it('reads every binding live from its recording', async () => {
    expect(Date.parse(pack.snapshot.capturedAt)).toBeGreaterThan(Date.parse('2026-01-01'));
    const resolved = await resolveDocument(drawn, snapshotAdapters(pack));
    for (const node of placedIn(resolved)) {
      for (const [prop, quality] of Object.entries(node.widget.quality)) expect(quality, `${node.id} ${prop}`).toBe('live');
    }
    // A blank reading is how a source says "no value here" — an entry that reports nothing, picked by mistake.
    const adapters = new Map(snapshotAdapters(pack).map(a => [a.id, a]));
    for (const node of placedIn(drawn)) {
      for (const [prop, binding] of Object.entries(node.widget.bindings ?? {})) {
        // Unless the binding means to show "none" — a map whose `otherwise` draws it (a station under maintenance has no grade).
        if (binding.map?.otherwise !== undefined) continue;
        const { value } = await adapters.get(binding.adapter)!.resolve(binding.ref);
        expect(value === '' || value === null, `${node.id} ${prop} reads "${String(value)}"`).toBe(false);
      }
    }
  });

  it('writes every prepared widget as the widget library reads it — no option it does not have, none of the wrong type', async () => {
    // The library ignores what it does not know, so a misnamed option (`stacked` for `stack`) drew a different chart
    // with no error anywhere. Checked on the values the board shows, read from its recording.
    const resolved = await resolveDocument(drawn, snapshotAdapters(pack));
    for (const node of placedIn(resolved)) {
      if (node.widget.type.startsWith('element:')) continue;
      const { valid, errors, warnings } = checkSpec({ widget: node.widget.type, ...node.widget.props });
      expect({ valid, errors, warnings }, node.id).toEqual({ valid: true, errors: [], warnings: [] });
    }
  });

  it('says when the source observed each value it gives a time for — before the recording, within the hour or two a source lags', async () => {
    const adapters = new Map(snapshotAdapters(pack).map(a => [a.id, a]));
    const capturedAt = Date.parse(pack.snapshot.capturedAt);
    for (const node of placedIn(drawn)) {
      for (const [prop, binding] of Object.entries(node.widget.bindings ?? {})) {
        if ((binding.ref as { observedAtPath?: string }).observedAtPath === undefined) continue;
        const observedAt = Date.parse((await adapters.get(binding.adapter)!.resolve(binding.ref)).observedAt!);
        expect(observedAt, `${node.id} ${prop}`).toBeLessThanOrEqual(capturedAt);
        expect(capturedAt - observedAt, `${node.id} ${prop}`).toBeLessThan(2 * 60 * 60_000);
      }
    }
  });

  // A canvas board, or each canvas cell of a grid — drawn over its own background.
  const canvases: CanvasView[] =
    drawn.kind === 'canvas' ? [drawn] : drawn.items.filter(isCanvasItem).map(item => ({ kind: 'canvas', ...item.canvas }));
  it.runIf(canvases.some(canvas => canvas.background.image !== undefined))('places every node on its background, none over another', () => {
    for (const document of canvases.filter(canvas => canvas.background.image !== undefined)) {
      const { width, height } = document.background.image!;
      const nodes = document.nodes;
      for (const node of nodes) {
        expect(node.x, node.id).toBeGreaterThanOrEqual(0);
        expect(node.y, node.id).toBeGreaterThanOrEqual(0);
        expect(node.x + (node.width ?? 0), node.id).toBeLessThanOrEqual(width);
        expect(node.y + (node.height ?? 0), node.id).toBeLessThanOrEqual(height);
      }
      for (const [i, a] of nodes.entries()) for (const b of nodes.slice(i + 1)) expect(overlaps(a, b), `${a.id} × ${b.id}`).toBe(false);
    }
  });

  it.runIf(drawn.kind === 'canvas' && drawn.background.image === undefined)('places nothing over another part when there is no drawing', () => {
    const nodes = sizedNodes(drawn as CanvasView);
    for (const node of nodes) expect(Math.min(node.x, node.y), node.id).toBeGreaterThanOrEqual(0);
    for (const [i, a] of nodes.entries()) for (const b of nodes.slice(i + 1)) expect(overlaps(a, b), `${a.id} × ${b.id}`).toBe(false);
  });
});

describe('a list item bound by its fields', () => {
  it('reads the same item when the source lists them in another order', async () => {
    const pack = SAMPLE_PACKS.find(p => p.id === 'gwanghwamun')!;
    const picture = pictures.get(pack.id)!;
    const before = await resolveDocument(picture, snapshotAdapters(pack));
    const reordered = structuredClone(pack.snapshot);
    for (const answer of Object.values(reordered.responses['seoul-city-data'])) {
      const city = (answer as { CITYDATA: { SBIKE_STTS: unknown[] } }).CITYDATA;
      city.SBIKE_STTS.reverse();
    }
    const after = await resolveDocument(picture, snapshotAdapters({ ...pack, snapshot: reordered }));
    expect(placedIn(after).map(n => n.widget.props)).toEqual(placedIn(before).map(n => n.widget.props));
  });
});

describe('a recording', () => {
  it('keeps only what the pointers reach, rows in their places', () => {
    const body = { a: { rows: [{ n: 1, x: 'drop' }, { n: 2 }, { n: 3 }], other: 'drop' }, b: 'drop' };
    expect(keepPointers(body, ['/a/rows/0/n', '/a/rows/2'])).toEqual({ a: { rows: [{ n: 1 }, null, { n: 3 }] } });
    expect(keepPointers(body, [''])).toBe(body);
  });
});

describe('example data', () => {
  it('dates itself the day it is written as of, with that day’s weekday', () => {
    const weekdays = '일월화수목금토';
    for (const pack of SAMPLE_PACKS) {
      // The day the recording was made, in the time its words are written in (Korea).
      const day = new Date(Date.parse(pack.snapshot.capturedAt) + 9 * 3600_000);
      for (const [text, month, date, weekday] of JSON.stringify(pack.snapshot.responses).matchAll(/(\d{1,2})월 (\d{1,2})일 (.)요일/g)) {
        expect([Number(month), Number(date)], `${pack.id}: ${text}`).toEqual([day.getUTCMonth() + 1, day.getUTCDate()]);
        expect(weekday, `${pack.id}: ${text}`).toBe(weekdays[day.getUTCDay()]);
      }
    }
  });

  it('is never offered to an installation, and every pack on it says so in its summary', () => {
    for (const pack of SAMPLE_PACKS.filter(p => !isInstallable(p))) {
      expect(pack.summary.ko, pack.id).toContain('예시 데이터');
      expect(pack.summary.en, pack.id).toContain('Example data');
    }
    expect(SAMPLE_PACKS.filter(isInstallable).map(p => p.id)).toEqual(['gwanghwamun', 'seoul-air', 'seoul-districts-air', 'korea-weather-grid', 'seoul-subway']);
  });
});
