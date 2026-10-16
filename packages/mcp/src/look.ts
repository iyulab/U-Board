import type { Browser, Page } from 'playwright-core';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, expandComponents, getByPointer, instancePartId, nodeSize, type ViewDocument } from '@iyulab/u-board/domain';
import { countQualityMarks, findLowContrast, findProblems } from './look-page.js';

/** What `look` is asked for: a saved board, optionally one part of it, optionally on the other paper. */
export interface LookRequest {
  board: string;
  /** A JSON Pointer to a node, grid item, connector, decoration or component instance ("/nodes/3", "/items/0",
   *  "/connectors/2", "/decorations/5", "/instances/1") — only that part. */
  focus?: string;
  appearance?: 'light' | 'dark';
  width: number;
  height: number;
}

/** What `look` answers: the picture, and what the page reported while drawing it. */
export interface LookResult {
  /** A PNG, base64. */
  image: string;
  report: LookReport;
}

export interface LookReport {
  /** How big the board was drawn: scene px per screen px (1 = actual size), and the screen size of the picture. */
  scale?: number;
  picture: { width: number; height: number };
  /** Parts that did not draw as written: an element's error or notice, a widget's content running past its box. A part
   *  a component instance draws is reported at its node in the component, naming the instance. */
  problems: Array<{ path?: string; message: string }>;
  /** How current the bound values are: how many parts — nodes, grid items, connectors — show each quality short of
   *  live (`stale`, `disconnected`). */
  quality: Record<string, number>;
  /** What the page itself complained about (script errors, failed requests), at most a few. */
  console: string[];
}

export interface Looker {
  look(request: LookRequest, document: ViewDocument): Promise<LookResult>;
}

/** Waits after the page settles so charts finish their drawing animation before the picture is taken. */
const SETTLE_MS = 1200;
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

      const scale = await sceneScale(page, document);
      const clip = request.focus ? await focusClip(page, document, request.focus, scale) : undefined;
      // The whole view is taken in any case: the contrast check reads what is drawn behind each text off it.
      const whole = await page.screenshot({ type: 'png' });
      const png = clip ? await page.screenshot({ type: 'png', clip }) : whole;
      const lowContrast = await page.evaluate(findLowContrast, {
        picture: `data:image/png;base64,${whole.toString('base64')}`,
        ratio: request.focus ? 2 : 1,
        placed: placedParts(document),
        limit: MAX_CONTRAST_PROBLEMS,
      }).then(found => found.map(problem => inDocument(document, problem)));
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
  for (const node of expandComponents(document).nodes) {
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
  if (!part || typeof part !== 'object') throw new Error(`nothing at ${focus} — focus a node ("/nodes/3"), a grid item ("/items/0"), a connector ("/connectors/2"), a decoration ("/decorations/5") or an instance ("/instances/1")`);
  let box: { x: number; y: number; width: number; height: number } | null = null;
  if (focus.startsWith('/nodes/') && part.id) box = await page.locator(`[data-node-id="${cssString(part.id)}"]`).first().boundingBox();
  else if (/^\/instances\/\d+$/.test(focus) && part.id) box = await unionBox(page.locator(`[data-node-id^="${cssString(instancePartId(part.id, ''))}"]`));
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
  return { x, y, width: Math.min(viewport.width - x, box.width + 2 * margin), height: Math.min(viewport.height - y, box.height + 2 * margin) };
}

/** The box around every element `parts` finds — an instance's parts, together. */
async function unionBox(parts: ReturnType<Page['locator']>): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const boxes = (await Promise.all((await parts.all()).map(part => part.boundingBox()))).filter(box => box !== null);
  if (boxes.length === 0) return null;
  const x = Math.min(...boxes.map(b => b.x));
  const y = Math.min(...boxes.map(b => b.y));
  return { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y };
}

/** Elements that failed or were held back, and widgets whose content runs past their box. */
async function problems(page: Page, doc: ViewDocument): Promise<LookReport['problems']> {
  return (await page.evaluate(findProblems, placedParts(doc))).map(problem => inDocument(doc, problem));
}

/** Each node or grid item the viewer draws, with where it is and the attribute its frame carries on the page — a part a
 *  component instance draws at `/instances/<i>/<part id>`, which `inDocument` turns into a place in the document. */
export function placedParts(doc: ViewDocument): Array<{ id: string; path: string; attr: string }> {
  if (doc.kind !== 'canvas') return doc.items.map((n, i) => ({ id: n.id, path: `/items/${i}`, attr: 'data-item-id' }));
  const own = doc.nodes.map((n, i) => ({ id: n.id, path: `/nodes/${i}`, attr: 'data-node-id' }));
  const drawn = (doc.instances ?? []).flatMap((instance, i) =>
    (doc.components?.[instance.component]?.nodes ?? []).map(node => ({ id: instancePartId(instance.id, node.id), path: `/instances/${i}/${node.id}`, attr: 'data-node-id' }))
  );
  return [...own, ...drawn];
}

/** A problem with a part an instance draws, at the part's node in the component — what to change to fix it — naming
 *  the instance it was seen in. */
export function inDocument<P extends { path?: string; message: string }>(doc: ViewDocument, problem: P): P {
  const drawn = /^\/instances\/(\d+)\/(.+)$/.exec(problem.path ?? '');
  if (!drawn || doc.kind !== 'canvas') return problem;
  const instance = doc.instances?.[Number(drawn[1])];
  const nodes = instance ? doc.components?.[instance.component]?.nodes : undefined;
  if (!instance || !nodes) return problem;
  const component = instance.component.replace(/~/g, '~0').replace(/\//g, '~1');
  return { ...problem, path: `/components/${component}/nodes/${nodes.findIndex(n => n.id === drawn[2])}`, message: `${problem.message} — in the instance "${instance.id}" (/instances/${drawn[1]})` };
}

async function quality(page: Page): Promise<Record<string, number>> {
  return page.evaluate(countQualityMarks);
}

function cssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
