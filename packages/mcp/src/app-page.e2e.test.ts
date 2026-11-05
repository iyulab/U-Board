import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, BrowserContext, Frame, Page } from 'playwright-core';
import type { Board } from '@iyulab/u-board/domain';
import { builtPage } from './app.js';
import { launch } from './look.js';

// The page `show_board` draws a board in, run as a host runs it: in a frame of its own, spoken to in the messages of MCP Apps. The host here is
// a few lines of script — it answers the page's `ui/initialize`, hands it a tool result, and answers the `read_sources` calls the page makes —
// so what is checked is the built file and the protocol it speaks, in a real browser, with no MCP server and no network.

const built = existsSync(new URL('../dist/app/board.html', import.meta.url));

const board: Board = {
  data: {
    pump: { from: 's1', path: '/pump', fields: { flow: { label: 'Flow', unit: 'm3/h', digits: 1 } } },
    fan: { from: 's1', path: '/fan', fields: { speed: { label: 'Speed', unit: 'rpm', digits: 0 } } },
  },
  parts: {
    a: { as: 'stat', of: 'pump', show: 'flow', title: 'Pump' },
    b: { as: 'stat', of: 'fan', show: 'speed', title: 'Fan' },
  },
  layout: { kind: 'canvas', size: [720, 240], place: { a: [40, 40, 300, 160], b: [380, 40, 300, 160] } },
};

/** What the host hands the page, and what it answers the page's reads with. */
const fixture = {
  shown: { board, name: 'Plant', adapters: [{ id: 's1', attribution: { text: 'Plant demo' } }] },
  answers: { '/pump': { quality: 'live', value: 128.46 }, '/fan': { quality: 'disconnected', reason: 'transport', message: 'connect ECONNREFUSED' } },
};

/** The host, as script: what a page does to a host in the three messages that matter. */
const HOST = `
  window.__reads = [];
  window.__sizes = [];
  const frame = document.getElementById('app');
  const send = message => frame.contentWindow.postMessage({ jsonrpc: '2.0', ...message }, '*');
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    const m = event.data;
    if (!m || m.jsonrpc !== '2.0') return;
    if (m.method === 'ui/initialize') {
      send({ id: m.id, result: { protocolVersion: m.params.protocolVersion, hostInfo: { name: 'test-host', version: '0' }, hostCapabilities: { serverTools: {} }, hostContext: { locale: 'en-US', theme: 'light' } } });
    } else if (m.method === 'ui/notifications/initialized') {
      send({ method: 'ui/notifications/tool-result', params: { content: [{ type: 'text', text: 'shown' }], structuredContent: window.__fixture.shown } });
    } else if (m.method === 'ui/notifications/size-changed') {
      window.__sizes.push(m.params);
    } else if (m.method === 'tools/call' && m.params.name === 'read_sources') {
      const reads = m.params.arguments.reads;
      window.__reads.push(reads.map(r => r.ref.path));
      send({ id: m.id, result: { content: [{ type: 'text', text: reads.length + ' reads' }], structuredContent: { answers: reads.map(r => window.__fixture.answers[r.ref.path]) } } });
    } else if (m.id !== undefined) {
      send({ id: m.id, result: {} });
    }
  });
`;

let browser: Browser;
let context: BrowserContext;
let page: Page;
let app: Frame;

beforeAll(async () => {
  if (!built) return;
  browser = await launch().catch(async () => (await import('playwright-core')).chromium.launch());
  context = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const pageHtml = await builtPage();
  // The host and the page live at two addresses, as a host and its sandbox do; nothing else is reachable.
  await context.route('https://host.invalid/**', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><body style="margin:0"><iframe id="app" src="https://app.invalid/board.html" style="border:0;width:720px;height:600px"></iframe><script>window.__fixture = ${JSON.stringify(fixture)};${HOST}</script></body>` }));
  await context.route('https://app.invalid/**', route => route.fulfill({ contentType: 'text/html', body: pageHtml }));
  page = await context.newPage();
  await page.goto('https://host.invalid/');
  await page.waitForFunction(() => document.querySelectorAll('iframe').length === 1);
  app = page.frames().find(f => f.url().startsWith('https://app.invalid'))!;
  await app.waitForSelector('.ub-viewer__surface', { timeout: 15_000 });
  // The values arrive after the first draw: wait for the one a source answered.
  await app.getByText('128.5').first().waitFor({ timeout: 15_000 });
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!built)('the board page, in a host', () => {
  it('draws the board it is handed, with the values the host read for it', async () => {
    expect(await app.getByText('Pump').first().isVisible()).toBe(true);
    expect(await app.getByText('128.5').first().isVisible()).toBe(true);
    // The data source names itself under the board.
    expect(await app.getByText('Plant demo').first().isVisible()).toBe(true);
  });

  it('draws a part whose read failed as disconnected, not as a failed page', async () => {
    expect(await app.getByText('Fan').first().isVisible()).toBe(true);
    // The viewer says so on the part, in its own words.
    expect(await app.getByText('No reply from source').first().isVisible()).toBe(true);
  });

  it('asks the host for what a board reads in one call, not one call for each part', async () => {
    const reads = await page.evaluate(() => (window as unknown as { __reads: string[][] }).__reads);
    // The first draw reads both references at once.
    expect(reads[0]?.slice().sort()).toEqual(['/fan', '/pump']);
  });

  it('makes the frame as tall as the board is shaped', async () => {
    // 720 wide, a 720 × 240 board: the board whole (240) and the controls (72).
    const height = await app.evaluate(() => document.getElementById('root')!.getBoundingClientRect().height);
    expect(height).toBe(312);
  });

  it('keeps the page within its frame: nothing is fetched from another address', async () => {
    const outside: string[] = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.hostname !== 'host.invalid' && url.hostname !== 'app.invalid') outside.push(request.url().slice(0, 80));
    });
    await page.reload();
    await page.waitForTimeout(1500);
    expect(outside).toEqual([]);
  });
});
