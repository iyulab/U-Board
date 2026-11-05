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

  it('refuses a size that is not a whole number of pixels', async () => {
    await expect(renderBoard({ board, width: 0, height: 100 })).rejects.toThrow(/width must be a whole number/);
    await expect(renderBoard({ board, width: 100, height: 1.5 })).rejects.toThrow(/height must be a whole number/);
  });
});
