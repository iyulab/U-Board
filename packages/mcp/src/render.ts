import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pictureOf, readerOf, type Adapter, type Board, type ResolvedBinding } from '@iyulab/u-board/domain';
import { launch, photograph, type LookReport } from './look.js';

/** What a board is drawn from: the board, the adapters its bindings read through, and the size of the picture. */
export interface RenderBoardOptions {
  /** The board to draw, as `BoardView` takes it. */
  board: Board;
  /** The adapters the board's bindings are read through — the host's own, which stay in this process: the page asks them, one
   *  reference at a time, and nothing of them crosses but the answers. A binding no adapter answers for is drawn as disconnected. */
  adapters?: readonly Adapter[];
  /** The size of the picture in pixels; the board is fitted to it. */
  width: number;
  height: number;
  /** Draw it on this paper instead of the board's own — to see the other one. */
  appearance?: 'light' | 'dark';
  /** The values the board's variables take, by name (see `BoardView`). */
  variables?: Readonly<Record<string, string>>;
  /** The moment the board reads "now" by — "N minutes ago", a state read against the clock — as a `Date` or epoch milliseconds. The
   *  machine's clock when left out. */
  now?: Date | number;
  /** The words the viewer's own controls and notices speak in. English when left out. */
  locale?: 'en' | 'ko';
  /** The path of the Chromium-based browser to draw with. Chrome or Edge installed on this computer, or `UBOARD_BROWSER`, when left out. */
  browser?: string;
}

export interface RenderedBoard {
  /** The picture, a PNG. */
  png: Uint8Array;
  /** What the page reported while drawing: parts that did not draw as written, how current the values were, what the page complained of. */
  report: LookReport;
}

/** The address the page is served under. Nothing is fetched from it: a request for it is answered from the files of this package. */
const ORIGIN = 'https://render.invalid';
const MAX_SIDE = 10_000;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/** Where the page lives: next to this module in a published package, or in the build output when run from source. */
function pageDirectory(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [join(here, 'render-page'), join(here, '..', 'dist', 'render-page')]) {
    if (existsSync(join(candidate, 'index.html'))) return candidate;
  }
  throw new Error('the page to draw a board in is not built — run `npm run build` in the package');
}

/**
 * Draws a board as its viewers see it and takes its picture — the library's own viewer in a browser on this computer
 * (installed Chrome or Edge, or `browser`/`UBOARD_BROWSER`), with no U-Board server and no network: the page is served from this
 * package, and the board's values are read through `adapters`, which run here. The browser draws it, so what is in the picture is
 * what a viewer shows, a blinking state stopped at its start.
 *
 * The same picture and report `look` answers, for a host that keeps its boards itself (a report, a record, a share) and wants
 * the picture of one as a file.
 */
export async function renderBoard(options: RenderBoardOptions): Promise<RenderedBoard> {
  const { adapters = [], width, height } = options;
  for (const [name, side] of [['width', width], ['height', height]] as const) {
    if (!Number.isInteger(side) || side < 1 || side > MAX_SIDE) throw new Error(`${name} must be a whole number of pixels from 1 to ${MAX_SIDE}, got ${String(side)}`);
  }
  const board: Board = options.appearance ? { ...options.board, board: { ...options.board.board, theme: options.appearance } } : options.board;
  // The same picture the viewer draws, made here: `look` finds the parts it names and reports on them by it.
  const document = await pictureOf(board, readerOf(adapters), { ...(options.variables && { variables: { ...options.variables } }) });
  const directory = pageDirectory();
  const byId = new Map(adapters.map(a => [a.id, a]));
  const now = options.now instanceof Date ? options.now.getTime() : options.now;

  const browser = await launch(options.browser);
  try {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await context.route(`${ORIGIN}/**`, async route => {
      const path = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = normalize(join(directory, path === '/' ? 'index.html' : path));
      if (!file.startsWith(directory + sep) || !existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
      return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? 'application/octet-stream', body: await readFile(file) });
    });
    const page = await context.newPage();
    const console: string[] = [];
    page.on('console', message => message.type() === 'error' && console.push(message.text()));
    page.on('pageerror', error => console.push(error.message));
    await page.exposeFunction('__ubResolve', async (id: string, ref: unknown): Promise<ResolvedBinding> => {
      const adapter = byId.get(id);
      if (!adapter) return { value: undefined, quality: 'disconnected', reason: 'address' };
      try {
        return await adapter.resolve(ref);
      } catch (error) {
        return { value: undefined, quality: 'disconnected', reason: 'transport', message: error instanceof Error ? error.message : String(error) };
      }
    });
    await page.addInitScript(
      job => {
        (window as unknown as { __ubJob: unknown }).__ubJob = job;
      },
      {
        board,
        adapters: adapters.map(a => ({ id: a.id, ...(a.attribution && { attribution: a.attribution }), ...(a.sample !== undefined && { sample: a.sample }) })),
        width,
        height,
        ...(options.variables && { variables: { ...options.variables } }),
        ...(now !== undefined && { now }),
        ...(options.locale === 'ko' && { korean: true }),
      }
    );
    await page.goto(`${ORIGIN}/index.html`);
    const { image, report } = await photograph(page, document, { width, height }, console);
    return { png: Buffer.from(image ?? '', 'base64'), report };
  } finally {
    await browser.close();
  }
}
