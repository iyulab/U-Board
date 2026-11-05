import { describe, expect, it } from 'vitest';
import type { Board } from '@iyulab/u-board/domain';
import { renderArgsOf, runRender, snapshotAdapters, type RenderIo } from './render-cli.js';

const base = ['board.json', '--width', '480', '--height', '320', '--out', 'board.png'];

describe('the arguments of u-board-render', () => {
  it('takes a board, a size and where the picture goes — and the options', () => {
    expect(renderArgsOf(base)).toEqual({ ok: true, args: { board: 'board.json', width: 480, height: 320, out: 'board.png' } });
    expect(renderArgsOf(['-', '--width=100', '--height=50', '--out=-', '--appearance', 'dark', '--locale', 'ko', '--now', '2026-11-05T09:00:00Z', '--variables', '{"line":"L2"}', '--data', 'a.json', '--report', 'r.json', '--browser', 'chrome']))
      .toEqual({ ok: true, args: { board: '-', width: 100, height: 50, out: '-', appearance: 'dark', locale: 'ko', now: Date.parse('2026-11-05T09:00:00Z'), variables: { line: 'L2' }, data: 'a.json', report: 'r.json', browser: 'chrome' } });
  });

  it('says what is wrong with a call, and what a call is', () => {
    const refused = (argv: string[]) => { const r = renderArgsOf(argv); return r.ok ? '' : r.message.split('\n')[0]; };
    expect(refused([])).toContain('give the board');
    expect(refused(['b.json', '--height', '10', '--out', 'x'])).toContain('--width is needed');
    expect(refused(['b.json', '--width', '0', '--height', '10', '--out', 'x'])).toContain('--width is a whole number of pixels from 1 to 10000');
    expect(refused(['b.json', '--width', '10', '--height', '10'])).toContain('--out is needed');
    expect(refused([...base, '--shape', 'x'])).toContain('unknown argument "--shape"');
    expect(refused([...base, '--appearance', 'sepia'])).toContain('light or dark');
    expect(refused([...base, '--now', 'tomorrow'])).toContain('--now is a time');
    expect(refused([...base, '--variables', '[1]'])).toContain('--variables is a JSON object of text values');
    expect(refused([...base, '--variables', '{"a":1}'])).toContain('--variables is a JSON object of text values');
    expect(refused([...base, 'second.json'])).toContain('one board at a time');
    expect(refused([...base, '--data'])).toContain('--data needs a value');
    expect(renderArgsOf([])).toMatchObject({ ok: false, message: expect.stringContaining('u-board-render draws a board') });
  });
});

describe('the answers a file holds', () => {
  const ref = (path: string) => ({ path, valuePath: '/state' });
  it('answers a reference to a path it holds from the body it holds, read at the time asked — and any other as disconnected', async () => {
    const [plant] = snapshotAdapters({ plant: { '/pump': { state: 'run' }, '/odd': { other: 1 } } }, Date.parse('2026-11-05T09:00:00Z'));
    expect(plant!.id).toBe('plant');
    expect(await plant!.resolve(ref('/pump'))).toMatchObject({ value: 'run', quality: 'live', observedAt: '2026-11-05T09:00:00.000Z' });
    expect(await plant!.resolve(ref('/none'))).toMatchObject({ quality: 'disconnected', reason: 'address' });
    expect(await plant!.resolve(ref('/odd'))).toMatchObject({ quality: 'disconnected' });
    expect(await plant!.resolve('not a reference')).toMatchObject({ quality: 'disconnected', reason: 'address' });
  });
});

describe('a call of u-board-render', () => {
  const board: Board = { parts: {}, layout: { kind: 'canvas', size: [200, 100], place: {} } };
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
  const report = { picture: { width: 480, height: 320 }, problems: [], quality: {}, console: [] };
  const io = (files: Record<string, string> = {}, stdin = '') => {
    const out: Record<string, Uint8Array | string> = {};
    const err: string[] = [];
    const stdout: Array<Uint8Array | string> = [];
    const options: unknown[] = [];
    const real: RenderIo = {
      readFile: async path => { if (!(path in files)) throw new Error(`no such file ${path}`); return files[path]!; },
      readStdin: async () => stdin,
      writeFile: async (path, data) => { out[path] = data; },
      stdout: data => { stdout.push(data); },
      stderr: text => { err.push(text); },
      render: async o => { options.push(o); return { png, report }; },
      clock: () => 1_000,
    };
    return { io: real, out, err, stdout, options };
  };

  it('draws the board of a file with the answers of another, writes the picture and says its report', async () => {
    const t = io({ 'board.json': JSON.stringify(board), 'a.json': JSON.stringify({ plant: { '/x': {} } }) });
    expect(await runRender([...base, '--data', 'a.json', '--appearance', 'dark'], t.io)).toBe(0);
    expect(t.out['board.png']).toBe(png);
    expect(JSON.parse(t.stdout[0] as string)).toEqual(report);
    expect(t.options[0]).toMatchObject({ board, width: 480, height: 320, now: 1_000, appearance: 'dark' });
    expect((t.options[0] as { adapters: Array<{ id: string }> }).adapters.map(a => a.id)).toEqual(['plant']);
  });

  it('reads the board from the standard input, and puts the picture on the standard output with the report on the standard error', async () => {
    const t = io({}, JSON.stringify(board));
    expect(await runRender(['-', '--width', '480', '--height', '320', '--out', '-'], t.io)).toBe(0);
    expect(t.stdout).toEqual([png]);
    expect(JSON.parse(t.err.join(''))).toEqual(report);
  });

  it('writes the report to a file when asked', async () => {
    const t = io({ 'board.json': JSON.stringify(board) });
    expect(await runRender([...base, '--report', 'r.json'], t.io)).toBe(0);
    expect(JSON.parse(t.out['r.json'] as string)).toEqual(report);
    expect(t.stdout).toEqual([]);
  });

  it('does not draw a board that has problems — it says where they are, and exits 2', async () => {
    const t = io({ 'board.json': JSON.stringify({ parts: { a: { as: 'nonsense' } }, layout: { kind: 'canvas', size: [200, 100], place: { a: [0, 0, 10, 10] } } }) });
    expect(await runRender(base, t.io)).toBe(2);
    expect(t.options).toEqual([]);
    expect(t.err.join('')).toMatch(/the board has 1 problem and was not drawn:\n {2}\/parts\/a\/as: unknown kind "nonsense"/);
  });

  it('says what it could not read or could not do, and exits 1', async () => {
    expect(await runRender(base, io().io)).toBe(1);
    const unreadable = io({ 'board.json': '{ not json' });
    expect(await runRender(base, unreadable.io)).toBe(1);
    expect(unreadable.err.join('')).toContain('the board "board.json" could not be read as JSON');
    const failing = io({ 'board.json': JSON.stringify(board) });
    failing.io.render = async () => { throw new Error('no Chrome or Edge found'); };
    expect(await runRender(base, failing.io)).toBe(1);
    expect(failing.err.join('')).toContain('no Chrome or Edge found');
    expect(await runRender(['--width', '1'], io().io)).toBe(1);
  });
});
