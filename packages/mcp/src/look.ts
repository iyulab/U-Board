import type { Browser, Page } from 'playwright-core';
import { getByPointer } from '@iyulab/u-board/domain';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, nodeSize, type ViewDocument } from '@iyulab/u-board/picture';
import { countQualityMarks, findLowContrast, findProblems } from './look-page.js';
import { placedParts } from './look-parts.js';

export { placedParts } from './look-parts.js';

/** How a picture is taken: animations stopped at their start, so a blinking state is drawn on — a picture taken mid-blink
 *  would show a ring as missing, and the reader would build it again by other means. */
export const PICTURE = { type: 'png', animations: 'disabled' } as const;

/** What `look` is asked for: a saved board, optionally one part of it, optionally on the other paper. */
export interface LookRequest {
  board: string;
  /** A JSON Pointer to a node, grid item, connector or decoration ("/nodes/3", "/items/0", "/connectors/2",
   *  "/decorations/5") — only that part. */
  focus?: string;
  appearance?: 'light' | 'dark';
  width: number;
  height: number;
}

/** What `look` answers: the picture, and what the page reported while drawing it. */
export interface LookResult {
  /** A PNG, base64 — none from a looker that draws without taking a picture (`Looker.picture` false). */
  image?: string;
  report: LookReport;
}

export interface LookReport {
  /** How big the board was drawn: scene px per screen px (1 = actual size), and the screen size of the picture. */
  scale?: number;
  picture: { width: number; height: number };
  /** Parts that did not draw as written: an element's error or notice, a widget's content running past its box. */
  problems: Array<{ path?: string; message: string }>;
  /** How current the bound values are: how many parts — nodes, grid items, connectors — show each quality short of
   *  live (`stale`, `disconnected`). */
  quality: Record<string, number>;
  /** What the page itself complained about (script errors, failed requests), at most a few. */
  console: string[];
}

export interface Looker {
  look(request: LookRequest, document: ViewDocument): Promise<LookResult>;
  /** Whether it answers a picture. False for one that draws the board in a page it cannot photograph (a browser tab's
   *  own) and answers the report alone. True when left out. */
  readonly picture?: boolean;
}

/** Waits after the page settles so charts finish their drawing animation before the picture is taken. */
const SETTLE_MS = 1200;
/** How long a part that shows no value gets to finish its first read before it is reported — a source asked for the first time
 *  answers a moment after the page settles on a loaded machine, and a part still reading is not a part that is disconnected. */
const READ_GRACE_MS = 3000;
const READ_POLL_MS = 250;
const MAX_CONSOLE_LINES = 5;

/**
 * Draws a board as its viewers see it — the instance's own share viewer, in a browser on this computer (installed
 * Chrome or Edge, or `UBOARD_BROWSER`) — and takes a picture. The API token never enters the page or its address:
 * the page asks with a placeholder, and the browser puts the token on the instance's own API requests only.
 */
export class BrowserLooker implements Looker {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async look(request: LookRequest, document: ViewDocument): Promise<LookResult> {
    const origin = new URL(this.baseUrl).origin;
    const browser = await launch();
    try {
      // A part up close is taken at twice the pixels, so small marks and labels are legible in the picture.
      const context = await browser.newContext({ viewport: { width: request.width, height: request.height }, deviceScaleFactor: request.focus ? 2 : 1 });
      await context.route(`${origin}/api/**`, async route => {
        const headers = { ...route.request().headers(), authorization: `Bearer ${this.token}` };
        const isBoard = route.request().method() === 'GET' && new URL(route.request().url()).pathname === `/api/share/boards/${request.board}`;
        if (!isBoard || !request.appearance) return route.continue({ headers });
        const response = await route.fetch({ headers: { ...headers, 'if-none-match': '' } });
        const body = (await response.json()) as { document: ViewDocument };
        await route.fulfill({ response, json: { ...body, document: { ...body.document, appearance: request.appearance } } });
      });
      const page = await context.newPage();
      const console: string[] = [];
      page.on('console', message => message.type() === 'error' && console.push(message.text()));
      page.on('pageerror', error => console.push(error.message));
      await page.goto(`${origin}/share/?board=${encodeURIComponent(request.board)}&token=look`);
      await page.waitForSelector('.ub-viewer__surface', { timeout: 20_000 });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(SETTLE_MS);
      await untilReadsAnswer(page);

      const scale = await sceneScale(page, document);
      const clip = request.focus ? await focusClip(page, document, request.focus, scale) : undefined;
      // The whole view is taken in any case: the contrast check reads what is drawn behind each text off it.
      const whole = await page.screenshot(PICTURE);
      const png = clip ? await page.screenshot({ ...PICTURE, clip }) : whole;
      const lowContrast = await page.evaluate(findLowContrast, {
        picture: `data:image/png;base64,${whole.toString('base64')}`,
        ratio: request.focus ? 2 : 1,
        placed: placedParts(document),
        limit: MAX_CONTRAST_PROBLEMS,
      });
      return {
        image: png.toString('base64'),
        report: {
          ...(scale && { scale: Math.round(scale.factor * 1000) / 1000 }),
          picture: clip ? { width: Math.round(clip.width), height: Math.round(clip.height) } : { width: request.width, height: request.height },
          problems: [...(await problems(page, document)), ...lowContrast],
          quality: await quality(page),
          console: console.slice(0, MAX_CONSOLE_LINES),
        },
      };
    } finally {
      await browser.close();
    }
  }
}

export async function launch(): Promise<Browser> {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.UBOARD_BROWSER;
  if (executablePath) return chromium.launch({ executablePath });
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // not installed — try the next
    }
  }
  throw new Error('no browser to draw the board with — install Chrome or Edge, or set UBOARD_BROWSER to a Chromium-based browser');
}

interface Scale {
  factor: number;
  /** Where scene 0, 0 is on screen. */
  originX: number;
  originY: number;
}

/** How the viewer placed the scene, read off a drawn node: its screen box against its scene box. */
async function sceneScale(page: Page, document: ViewDocument): Promise<Scale | undefined> {
  if (document.kind !== 'canvas') return undefined;
  for (const node of document.nodes) {
    const box = await page.locator(`[data-node-id="${cssString(node.id)}"]`).first().boundingBox().catch(() => null);
    if (!box) continue;
    const factor = box.width / nodeSize(node, document.elements).width;
    return { factor, originX: box.x - node.x * factor, originY: box.y - node.y * factor };
  }
  return undefined;
}

/** Room around a focused part — at least half its size, so what spills past its box shows in the picture. */
const FOCUS_MARGIN = 48;
const MAX_CONTRAST_PROBLEMS = 10;

async function focusClip(page: Page, document: ViewDocument, focus: string, scale: Scale | undefined) {
  const part = getByPointer(document, focus) as { id?: string; type?: string; x?: number; y?: number; width?: number; height?: number; text?: string; fontSize?: number } | undefined;
  if (!part || typeof part !== 'object') throw new Error(`nothing at ${focus} — focus a node ("/nodes/3"), a grid item ("/items/0"), a connector ("/connectors/2") or a decoration ("/decorations/5")`);
  let box: { x: number; y: number; width: number; height: number } | null = null;
  if (focus.startsWith('/nodes/') && part.id) box = await page.locator(`[data-node-id="${cssString(part.id)}"]`).first().boundingBox();
  else if (focus.startsWith('/items/') && part.id) box = await page.locator(`[data-item-id="${cssString(part.id)}"]`).first().boundingBox();
  else if (focus.startsWith('/connectors/') && part.id) box = await page.locator(`[data-connector-id="${cssString(part.id)}"]`).first().boundingBox();
  else if (focus.startsWith('/decorations/') && scale && typeof part.x === 'number' && typeof part.y === 'number') {
    const size = part.fontSize ?? 16;
    const width = part.type === 'text' ? [...(part.text ?? '')].length * size * 0.6 : (part.width ?? DEFAULT_NODE_WIDTH);
    const height = part.type === 'text' ? size : (part.height ?? DEFAULT_NODE_HEIGHT);
    box = { x: scale.originX + part.x * scale.factor, y: scale.originY + part.y * scale.factor, width: width * scale.factor, height: height * scale.factor };
  }
  if (!box) throw new Error(`could not find ${focus} on the drawn board — focus a node, a grid item, a connector or a decoration`);
  const viewport = page.viewportSize() ?? { width: box.x + box.width, height: box.y + box.height };
  const margin = Math.max(FOCUS_MARGIN, Math.max(box.width, box.height) / 2);
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  const clip = { x, y, width: Math.min(viewport.width - x, box.width + 2 * margin), height: Math.min(viewport.height - y, box.height + 2 * margin) };
  // A part placed past the screen, or one with no size, has nothing to take a picture of — said so rather than a
  // failed screenshot.
  if (clip.width <= 0 || clip.height <= 0 || box.width <= 0 || box.height <= 0) {
    throw new Error(`${focus} is drawn at ${Math.round(box.x)}, ${Math.round(box.y)} (${Math.round(box.width)} × ${Math.round(box.height)} px), outside the ${viewport.width} × ${viewport.height} screen or with no size — look at the whole board, or with a larger width or height`);
  }
  return clip;
}

/** Elements that failed or were held back, and widgets whose content runs past their box or is cut off inside it. */
async function problems(page: Page, doc: ViewDocument): Promise<LookReport['problems']> {
  return page.evaluate(findProblems, placedParts(doc));
}

async function quality(page: Pick<Page, 'evaluate'>): Promise<Record<string, number>> {
  return page.evaluate(countQualityMarks);
}

/** Gives the parts that show no value a moment to get one: returns as soon as none is marked, else after the grace (a part
 *  that is really disconnected stays marked, and is reported). */
export async function untilReadsAnswer(page: Pick<Page, 'evaluate' | 'waitForTimeout'>): Promise<void> {
  for (let waited = 0; waited < READ_GRACE_MS; waited += READ_POLL_MS) {
    if (Object.keys(await quality(page)).length === 0) return;
    await page.waitForTimeout(READ_POLL_MS);
  }
}

function cssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
