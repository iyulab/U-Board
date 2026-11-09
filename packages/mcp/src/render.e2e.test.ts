import { describe, expect, it } from 'vitest';
import type { Adapter, Board } from '@iyulab/u-board/domain';
import { renderBoard } from './render.js';

// `renderBoard` against a real browser: the page it draws in is the built one (`npm run build`), and the adapters run here.

const board: Board = {
  statuses: { running: { tone: 'ok', label: 'Running' }, stopped: { tone: 'alarm' } },
  data: { pump: { from: 'plant', ref: 'pump', fields: { value: { at: '', label: 'Pump', state: { running: 'running', '*': 'stopped' } } } } },
  parts: { pump: { as: 'status-card', of: 'pump', title: 'Pump', show: ['value'] } },
  layout: { kind: 'canvas', size: [400, 240], place: { pump: [40, 40, 200, 80] } },
};

const live = (asked: unknown[] = []): Adapter => ({
  id: 'plant',
  async resolve(ref) {
    asked.push(ref);
    return { value: 'running', quality: 'live', observedAt: '2026-11-05T09:00:00.000Z' };
  },
});

/** Width and height of a PNG, from its header. */
function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe('renderBoard', () => {
  it('takes the picture of a board whose values its adapters answer, at the size asked', async () => {
    const asked: unknown[] = [];
    const { png, report } = await renderBoard({ board, adapters: [live(asked)], width: 480, height: 320, now: Date.parse('2026-11-05T09:00:30.000Z') });
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(pngSize(png)).toEqual({ width: 480, height: 320 });
    expect(asked.length).toBeGreaterThan(0);
    expect(report.picture).toEqual({ width: 480, height: 320 });
    expect(report.quality).toEqual({});
    expect(report.console).toEqual([]);
    expect(report).not.toHaveProperty('unchecked');
  });

  it('draws a binding that no adapter answers for as disconnected, and says so in its report', async () => {
    const { report } = await renderBoard({ board, width: 480, height: 320 });
    expect(Object.values(report.quality).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('draws an adapter that throws as disconnected rather than failing', async () => {
    const broken: Adapter = {
      id: 'plant',
      async resolve() {
        throw new Error('source down');
      },
    };
    const { png, report } = await renderBoard({ board, adapters: [broken], width: 480, height: 320 });
    expect(pngSize(png).width).toBe(480);
    expect(report.quality).not.toEqual({});
  });

  it('says in its report what an adapter that throws said, once for the adapter and not once for each read', async () => {
    const broken: Adapter = {
      id: 'plant',
      async resolve() {
        throw new Error('token expired');
      },
    };
    const { report } = await renderBoard({ board, adapters: [broken], width: 480, height: 320 });
    const said = report.problems.filter(p => p.message.includes('adapter "plant" threw'));
    expect(said).toHaveLength(1);
    expect(said[0]!.message).toMatch(/threw on \d+ reads? — drawn as disconnected: "token expired"/);
    // An adapter that answers adds nothing of the kind.
    const fine = await renderBoard({ board, adapters: [live()], width: 480, height: 320 });
    expect(fine.report.problems.filter(p => p.message.includes('threw'))).toEqual([]);
  });

  it('names, for every source that answers short of live, the adapter, the way it answered and its reason — not only the ones that throw', async () => {
    const three: Board = {
      statuses: board.statuses,
      data: Object.fromEntries(['a', 'b', 'c'].map(id => [`pump-${id}`, { from: id, ref: 'pump', fields: { value: { at: '', label: `Pump ${id}`, state: { running: 'running', '*': 'stopped' } } } }])),
      parts: Object.fromEntries(['a', 'b', 'c'].map(id => [`pump-${id}`, { as: 'status-card', of: `pump-${id}`, title: `Pump ${id}`, show: ['value'] }])),
      layout: { kind: 'canvas', size: [800, 240], place: { 'pump-a': [20, 40, 240, 100], 'pump-b': [280, 40, 240, 100], 'pump-c': [540, 40, 240, 100] } },
    };
    const answering = (id: string, answer: Awaited<ReturnType<Adapter['resolve']>>): Adapter => ({ id, resolve: async () => answer });
    const { report } = await renderBoard({
      board: three,
      adapters: [
        answering('a', { value: 'running', quality: 'stale', reason: 'transport', message: 'timed out', observedAt: '2026-11-05T08:00:00.000Z' }),
        answering('b', { value: 'running', quality: 'stale', reason: 'lagging', observedAt: '2026-11-05T05:00:00.000Z' }),
        answering('c', { value: undefined, quality: 'disconnected', reason: 'auth', message: 'token refused' }),
      ],
      width: 800,
      height: 240,
      now: Date.parse('2026-11-05T09:00:30.000Z'),
    });
    const lines = report.problems.map(p => p.message);
    expect(lines.some(m => /^adapter "a" answered stale \(transport\) on \d+ reads? of pump: "timed out"/.test(m))).toBe(true);
    expect(lines.some(m => /^adapter "b" answered stale \(lagging\) on \d+ reads? of pump$/.test(m))).toBe(true);
    expect(lines.some(m => /^adapter "c" answered disconnected \(auth\) on \d+ reads? of pump: "token refused"/.test(m))).toBe(true);
    // One line for each adapter and way of answering, not one for each read.
    expect(lines.filter(m => m.startsWith('adapter "a" answered'))).toHaveLength(1);
    // A source that answers live says nothing of the kind.
    const fine = await renderBoard({ board, adapters: [live()], width: 480, height: 320 });
    expect(fine.report.problems.filter(p => p.message.includes('answered'))).toEqual([]);
  }, 60_000);

  it('draws the other paper when asked', async () => {
    const light = await renderBoard({ board, adapters: [live()], width: 480, height: 320, appearance: 'light' });
    const dark = await renderBoard({ board, adapters: [live()], width: 480, height: 320, appearance: 'dark' });
    expect(Buffer.from(light.png).equals(Buffer.from(dark.png))).toBe(false);
  });

  it('takes the picture of a board crowded enough that its markers are drawn as points', async () => {
    // Past the viewer's `summarizeParts` threshold (500) a marker is a point on the canvas, not an element of the page: nothing
    // is there to measure, and the picture must still come — it once waited out a browser timeout for each marker.
    const count = 520;
    const crowded: Board = {
      statuses: board.statuses,
      data: {},
      parts: {},
      layout: { kind: 'canvas', size: [2420, 560], place: {} },
    };
    for (let i = 0; i < count; i++) {
      crowded.data![`p${i}`] = { from: 'plant', ref: `p${i}`, fields: { value: { at: '', label: `P${i}`, state: { running: 'running', '*': 'stopped' } } } };
      crowded.parts![`p${i}`] = { as: 'marker', of: `p${i}`, show: ['value'] };
      (crowded.layout as { place: Record<string, number[]> }).place[`p${i}`] = [(i % 40) * 60 + 10, Math.floor(i / 40) * 40 + 10, 20, 20];
    }
    const { png, report } = await renderBoard({ board: crowded, adapters: [live()], width: 1600, height: 900 });
    expect(pngSize(png)).toEqual({ width: 1600, height: 900 });
    expect(report.picture).toEqual({ width: 1600, height: 900 });
    // Drawn as points, they are not page content: the report says how many it could not look at instead of «all fine».
    expect(report.unchecked).toBe(count);
  }, 60_000);

  it('reports the items a canvas leaves out because they fall outside the frame it places them by, instead of saying nothing', async () => {
    // Three zones, the frame covers the y values of two: the third is declared and never drawn — a picture that looks whole.
    const zones = [{ id: 'a', x: 20, y: 120 }, { id: 'b', x: 120, y: 200 }, { id: 'c', x: 40, y: 60 }];
    const placed: Board = {
      data: { zones: { from: 'plant', ref: 'zones', list: '/value', key: 'id', fields: { id: {}, x: {}, y: {} } } },
      parts: { zone: { as: 'status-card', each: 'zones', title: '{{id}}', show: ['x'] } },
      layout: { kind: 'canvas', size: [400, 240], place: { zone: { at: ['x', 'y'], frame: [0, 100, 200, 300], size: [80, 50] } } },
    };
    const adapter: Adapter = { id: 'plant', async resolve() { return { value: zones, quality: 'live' }; } };
    const { report } = await renderBoard({ board: placed, adapters: [adapter], width: 480, height: 320 });
    const said = report.problems.filter(p => p.message.includes('not drawn'));
    expect(said).toHaveLength(1);
    expect(said[0]!.message).toContain('1 item of "zone" is not drawn');
  }, 60_000);

  it('says in its report that a board with no part draws nothing, instead of reading as clean over blank paper', async () => {
    const blank: Board = { parts: {}, layout: { kind: 'grid', items: [] } };
    const { report } = await renderBoard({ board: blank, width: 480, height: 320 });
    expect(report.problems.map(p => p.message)).toEqual([expect.stringContaining('nothing is drawn')]);
  }, 60_000);

  it('refuses a size that is not a whole number of pixels', async () => {
    await expect(renderBoard({ board, width: 0, height: 100 })).rejects.toThrow(/width must be a whole number/);
    await expect(renderBoard({ board, width: 100, height: 1.5 })).rejects.toThrow(/height must be a whole number/);
  });
});
