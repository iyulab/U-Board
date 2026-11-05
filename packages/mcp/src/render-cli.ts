import { readFile, writeFile } from 'node:fs/promises';
import type { Adapter, Board } from '@iyulab/u-board/domain';
import { isHttpRef, readHttpRef, resolvedReading } from '@iyulab/u-board/picture';
import { checkBoard } from '@iyulab/u-board/check';
import { renderBoard, type RenderedBoard } from './render.js';

/** What `u-board-render` is asked for, from its command line. */
export interface RenderArgs {
  /** The file the board is read from; `-` is the standard input. */
  board: string;
  width: number;
  height: number;
  /** Where the PNG goes: a file, or `-` for the standard output. */
  out: string;
  /** Where the report goes: a file; the standard output when left out (the standard error when the picture takes the standard output). */
  report?: string;
  /** A file of the answers the board's sources gave: `{ "<adapter id>": { "<path>": <the body that source answered> } }`. */
  data?: string;
  appearance?: 'light' | 'dark';
  variables?: Record<string, string>;
  now?: number;
  locale?: 'en' | 'ko';
  browser?: string;
}

export const RENDER_USAGE = [
  'u-board-render draws a board as its viewers see it and writes the picture, a PNG, with a report of what was drawn.',
  '  u-board-render <board.json | -> --width <px> --height <px> --out <file.png | ->',
  '    [--data <answers.json>]      what the board\'s sources answered: { "<adapter id>": { "<path>": <the body the source answered> } }; a source it',
  '                                 does not hold is drawn as disconnected',
  '    [--report <file.json>]       the report; on the standard output when left out (the standard error when --out is -)',
  '    [--appearance light|dark] [--variables \'{"line":"L1"}\'] [--now <ISO time>] [--locale en|ko] [--browser <path>]',
  'It needs Chrome or Edge on this computer (or UBOARD_BROWSER). Exit status 0: drawn; 1: could not run (the reason on the standard error);',
  '2: the board has problems, listed by where they are, and was not drawn.',
].join('\n');

export type RenderArgsResult = { ok: true; args: RenderArgs } | { ok: false; help?: boolean; message: string };

const VALUE_FLAGS = ['--width', '--height', '--out', '--report', '--data', '--appearance', '--variables', '--now', '--locale', '--browser'];

/** The arguments of a call of `u-board-render`, or why they are not one. */
export function renderArgsOf(argv: readonly string[]): RenderArgsResult {
  const fail = (message: string): RenderArgsResult => ({ ok: false, message: `u-board-render: ${message}\n${RENDER_USAGE}` });
  const given = new Map<string, string>();
  let board: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    // Asking how it is used is not a failure: the usage, and exit status 0.
    if (arg === '--help' || arg === '-h') return { ok: false, help: true, message: RENDER_USAGE };
    if (arg !== '-' && !arg.startsWith('--')) {
      if (board !== undefined) return fail(`one board at a time — "${arg}" comes after "${board}"`);
      board = arg;
      continue;
    }
    if (arg === '-') {
      if (board !== undefined) return fail('one board at a time');
      board = '-';
      continue;
    }
    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg : arg.slice(0, eq);
    if (!VALUE_FLAGS.includes(name)) return fail(`unknown argument "${arg}"`);
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === '') return fail(`${name} needs a value`);
    given.set(name, value);
  }
  if (board === undefined) return fail('give the board: a file, or - for the standard input');
  const side = (name: '--width' | '--height'): number | string => {
    const text = given.get(name);
    if (text === undefined) return `${name} is needed — the size of the picture in pixels`;
    const n = Number(text);
    return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : `${name} is a whole number of pixels from 1 to 10000, not "${text}"`;
  };
  const width = side('--width');
  const height = side('--height');
  if (typeof width === 'string') return fail(width);
  if (typeof height === 'string') return fail(height);
  const out = given.get('--out');
  if (out === undefined) return fail('--out is needed — a file for the picture, or - for the standard output');
  const args: RenderArgs = { board, width, height, out };
  const appearance = given.get('--appearance');
  if (appearance !== undefined) {
    if (appearance !== 'light' && appearance !== 'dark') return fail(`--appearance is light or dark, not "${appearance}"`);
    args.appearance = appearance;
  }
  const locale = given.get('--locale');
  if (locale !== undefined) {
    if (locale !== 'en' && locale !== 'ko') return fail(`--locale is en or ko, not "${locale}"`);
    args.locale = locale;
  }
  const now = given.get('--now');
  if (now !== undefined) {
    const at = Date.parse(now);
    if (Number.isNaN(at)) return fail(`--now is a time such as 2026-11-05T09:00:00Z, not "${now}"`);
    args.now = at;
  }
  const variables = given.get('--variables');
  if (variables !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(variables);
    } catch {
      return fail('--variables is a JSON object of text values, such as \'{"line":"L1"}\'');
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) || !Object.values(parsed).every(v => typeof v === 'string')) {
      return fail('--variables is a JSON object of text values, such as \'{"line":"L1"}\'');
    }
    args.variables = parsed as Record<string, string>;
  }
  for (const [flag, key] of [['--report', 'report'], ['--data', 'data'], ['--browser', 'browser']] as const) {
    const value = given.get(flag);
    if (value !== undefined) args[key] = value;
  }
  return { ok: true, args };
}

/** The adapters a file of answers stands for: each adapter id answers the references to its paths from the body it holds for the path — read as a
 *  source answering at `readAt` — and a path it holds nothing for is disconnected. */
export function snapshotAdapters(answers: Record<string, Record<string, unknown>>, readAt: number): Adapter[] {
  return Object.entries(answers).map(([id, bodies]) => ({
    id,
    async resolve(ref) {
      if (!isHttpRef(ref) || !Object.hasOwn(bodies, ref.path)) return { value: undefined, quality: 'disconnected', reason: 'address' };
      const reading = readHttpRef(bodies[ref.path], ref, readAt);
      return reading.ok ? resolvedReading(reading) : { value: undefined, quality: 'disconnected', reason: reading.reason, message: reading.message };
    },
  }));
}

/** What a call of `u-board-render` reaches outside itself — here so that a test can stand in for the browser and the files. */
export interface RenderIo {
  readFile(path: string): Promise<string>;
  readStdin(): Promise<string>;
  writeFile(path: string, data: Uint8Array | string): Promise<void>;
  stdout(data: Uint8Array | string): void;
  stderr(text: string): void;
  render(options: Parameters<typeof renderBoard>[0]): Promise<RenderedBoard>;
  clock(): number;
}

async function readAllStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export const REAL_IO: RenderIo = {
  readFile: path => readFile(path, 'utf8'),
  readStdin: readAllStdin,
  writeFile: (path, data) => writeFile(path, data),
  stdout: data => void process.stdout.write(data),
  stderr: text => void process.stderr.write(text),
  render: renderBoard,
  clock: () => Date.now(),
};

/** Runs `u-board-render` on its command-line arguments and returns its exit status. */
export async function runRender(argv: readonly string[], io: RenderIo = REAL_IO): Promise<number> {
  const parsed = renderArgsOf(argv);
  if (!parsed.ok) {
    if (parsed.help) {
      io.stdout(`${parsed.message}\n`);
      return 0;
    }
    io.stderr(`${parsed.message}\n`);
    return 1;
  }
  const { args } = parsed;
  const read = async <T>(what: string, path: string, text: () => Promise<string>): Promise<T | undefined> => {
    try {
      return JSON.parse(await text()) as T;
    } catch (error) {
      io.stderr(`u-board-render: ${what} ${path === '-' ? 'on the standard input' : `"${path}"`} could not be read as JSON — ${error instanceof Error ? error.message : String(error)}\n`);
      return undefined;
    }
  };
  const board = await read<Board>('the board', args.board, () => (args.board === '-' ? io.readStdin() : io.readFile(args.board)));
  if (board === undefined) return 1;
  const answers = args.data === undefined ? {} : await read<Record<string, Record<string, unknown>>>('the answers', args.data, () => io.readFile(args.data!));
  if (answers === undefined) return 1;

  // A board with problems is not drawn: the picture would be a blank or a half, and the caller wants to hear where the board is wrong.
  const { issues } = checkBoard(board);
  if (issues.length > 0) {
    io.stderr(`u-board-render: the board has ${issues.length} problem${issues.length === 1 ? '' : 's'} and was not drawn:\n${issues.map(i => `  ${i.path}: ${i.message}`).join('\n')}\n`);
    return 2;
  }

  const now = args.now ?? io.clock();
  let drawn: RenderedBoard;
  try {
    drawn = await io.render({
      board, adapters: snapshotAdapters(answers, now), width: args.width, height: args.height, now,
      ...(args.appearance && { appearance: args.appearance }), ...(args.variables && { variables: args.variables }),
      ...(args.locale && { locale: args.locale }), ...(args.browser && { browser: args.browser }),
    });
  } catch (error) {
    io.stderr(`u-board-render: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
  const report = `${JSON.stringify(drawn.report, null, 2)}\n`;
  if (args.out === '-') io.stdout(drawn.png);
  else await io.writeFile(args.out, drawn.png);
  if (args.report !== undefined) await io.writeFile(args.report, report);
  else if (args.out === '-') io.stderr(report);
  else io.stdout(report);
  return 0;
}
