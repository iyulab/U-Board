import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';

// `u-board-render` as a program, against a real browser: the built binary reads a board and the answers of its sources from files and
// writes a picture and a report. The page it draws in is the built one (`npm run build`).

const bin = fileURLToPath(new URL('../dist/render-bin.js', import.meta.url));
const run = promisify(execFile);

const board: Board = {
  statuses: { running: { tone: 'ok', label: 'Running' }, stopped: { tone: 'alarm' } },
  data: { pump: { from: 'plant', path: '/pump', fields: { value: { at: '/state', label: 'Pump', state: { run: 'running', '*': 'stopped' } } } } },
  parts: { pump: { as: 'status-card', of: 'pump', title: 'Pump', show: ['value'] } },
  layout: { kind: 'canvas', size: [400, 240], place: { pump: [40, 40, 200, 80] } },
};

const pngSize = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'u-board-render-'));
  await writeFile(join(dir, 'board.json'), JSON.stringify(board));
  await writeFile(join(dir, 'answers.json'), JSON.stringify({ plant: { '/pump': { state: 'run' } } }));
});
afterAll(async () => { await rm(dir, { recursive: true, force: true }); });

describe('u-board-render', () => {
  it('draws the board of a file from the answers of another: the picture in a file, the report on the standard output', async () => {
    const { stdout } = await run(process.execPath, [bin, join(dir, 'board.json'), '--width', '480', '--height', '320', '--out', join(dir, 'a.png'), '--data', join(dir, 'answers.json'), '--now', '2026-11-05T09:00:00Z']);
    const png = await readFile(join(dir, 'a.png'));
    expect(Array.from(png.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(pngSize(png)).toEqual({ width: 480, height: 320 });
    const report = JSON.parse(stdout);
    expect(report.picture).toEqual({ width: 480, height: 320 });
    expect(report.quality).toEqual({});
    expect(report.console).toEqual([]);
  });

  it('draws a source it holds no answer for as disconnected, and says so in the report', async () => {
    const { stdout } = await run(process.execPath, [bin, join(dir, 'board.json'), '--width', '480', '--height', '320', '--out', join(dir, 'b.png')]);
    expect(Object.values(JSON.parse(stdout).quality as Record<string, number>).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('takes the board on the standard input and gives the picture on the standard output, the report on the standard error', async () => {
    const child = spawn(process.execPath, [bin, '-', '--width', '320', '--height', '200', '--out', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', chunk => out.push(chunk as Buffer));
    child.stderr.on('data', chunk => err.push(chunk as Buffer));
    child.stdin.end(JSON.stringify(board));
    const code = await new Promise<number | null>(resolve => child.on('close', resolve));
    expect(code).toBe(0);
    expect(pngSize(Buffer.concat(out))).toEqual({ width: 320, height: 200 });
    expect(JSON.parse(Buffer.concat(err).toString('utf8')).picture).toEqual({ width: 320, height: 200 });
  });

  it('exits 2 with the problems of a board that is wrong, drawing nothing', async () => {
    await writeFile(join(dir, 'wrong.json'), JSON.stringify({ parts: { a: { as: 'nonsense' } }, layout: { kind: 'canvas', size: [200, 100], place: { a: [0, 0, 10, 10] } } }));
    await expect(run(process.execPath, [bin, join(dir, 'wrong.json'), '--width', '100', '--height', '100', '--out', join(dir, 'c.png')])).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('/parts/a/as: unknown kind "nonsense"'),
    });
  });
});
