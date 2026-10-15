import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from 'playwright-core';
import { countQualityMarks, findLowContrast, findProblems } from './look-page.js';
import { launch } from './look.js';

// The page functions `look` runs inside the drawn board, run here against small hand-made pages in a real browser —
// layout, shadow roots and the picture are what they read, and none of that exists under jsdom.

let browser: Browser;
let page: Page;

beforeAll(async () => {
  // The browser `look` itself uses (installed Chrome or Edge, or UBOARD_BROWSER); else Playwright's own Chromium.
  browser = await launch().catch(async () => (await import('playwright-core')).chromium.launch());
  page = await browser.newPage({ viewport: { width: 800, height: 600 } });
});

afterAll(async () => {
  await browser?.close();
});

const node = (id: string, path = `/nodes/${id}`) => ({ id, path, attr: 'data-node-id' });

async function show(body: string): Promise<void> {
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:16px sans-serif">${body}</body></html>`);
}

describe('findProblems', () => {
  it('reports an element’s error and notice, by their title or else their text', async () => {
    await show(`
      <div data-node-id="a"><div data-element-error title="the script threw: boom"></div></div>
      <div data-node-id="b"><span data-element-notice>blocked by the instance’s policy</span></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/a', message: 'the script threw: boom' },
      { path: '/nodes/b', message: 'blocked by the instance’s policy' },
    ]);
  });

  it('reports how far an element draws past its box, and nothing for one that stays inside', async () => {
    await show(`
      <div data-node-id="a"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><style>p{color:red}</style><div style="position:absolute;left:0;top:0;width:160px;height:10px"></div></template>
      </div></div>
      <div data-node-id="b"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><div style="width:100px;height:50px"></div></template>
      </div></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/a', message: 'its element draws up to 60 px past its box — over its neighbours; give the node more room or draw smaller' },
    ]);
  });

  it('reports a widget whose content runs past its box, and one drawing its invalid-spec card', async () => {
    await show(`
      <div data-node-id="a"><u-widget style="display:block;width:100px;height:50px">
        <template shadowrootmode="open"><div style="width:100px;height:50px;overflow:hidden"><div style="width:300px;height:20px">wide</div></div></template>
      </u-widget></div>
      <div data-node-id="b"><u-widget style="display:block;width:200px;height:80px">
        <template shadowrootmode="open"><div style="width:200px;height:80px">Invalid widget spec: no data</div></template>
      </u-widget></div>
      <div data-node-id="c"><u-widget style="display:block;width:200px;height:80px">
        <template shadowrootmode="open"><div style="width:200px;height:80px">42 kW</div></template>
      </u-widget></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b'), node('c')])).toEqual([
      { path: '/nodes/a', message: 'its content runs past its box (300×50 in 100×50) — it scrolls or is cut off; give it more room' },
      { path: '/nodes/b', message: 'the widget draws its "invalid spec" card — validate the board and read its advice' },
    ]);
  });

  it('skips a part that is not on the page', async () => {
    await show('<div data-node-id="a"></div>');
    expect(await page.evaluate(findProblems, [node('a'), node('gone')])).toEqual([]);
  });

  it('finds grid items by their own attribute', async () => {
    await show('<div data-item-id="i1"><div data-element-error title="failed"></div></div>');
    expect(await page.evaluate(findProblems, [{ id: 'i1', path: '/items/0', attr: 'data-item-id' }])).toEqual([{ path: '/items/0', message: 'failed' }]);
  });
});

describe('countQualityMarks', () => {
  it('counts the marks by their word, a mark without one as "marked"', async () => {
    await show(`
      <span data-quality-badge>stale</span><span data-quality-badge> stale </span>
      <span data-quality-badge>disconnected</span><span data-quality-badge></span>`);
    expect(await page.evaluate(countQualityMarks)).toEqual({ stale: 2, disconnected: 1, marked: 1 });
  });

  it('is empty on a board with no marks', async () => {
    await show('<div data-node-id="a">42</div>');
    expect(await page.evaluate(countQualityMarks)).toEqual({});
  });
});

describe('findLowContrast', () => {
  async function lowContrast(placed: ReturnType<typeof node>[], limit = 10) {
    const picture = `data:image/png;base64,${(await page.screenshot({ type: 'png' })).toString('base64')}`;
    return page.evaluate(findLowContrast, { picture, ratio: 1, placed, limit });
  }

  it('reports faint text against what is drawn behind it — HTML by its colour, SVG by its fill, inside shadow roots too', async () => {
    await show(`
      <div data-node-id="html" style="padding:8px;font-size:24px"><span style="color:#ddd">faint</span></div>
      <div data-node-id="svg"><svg width="200" height="40"><text x="0" y="30" font-size="24" fill="#e0e0e0">faint svg</text></svg></div>
      <div data-node-id="shadow"><div><template shadowrootmode="open"><p style="color:#d8d8d8;font-size:24px;margin:0">faint inside</p></template></div></div>
      <div data-node-id="dark" style="padding:8px;font-size:24px;color:#111">readable</div>`);
    const found = await lowContrast([node('html'), node('svg'), node('shadow'), node('dark')]);
    expect(found.map(f => f.path).sort()).toEqual(['/nodes/html', '/nodes/shadow', '/nodes/svg']);
    expect(found.find(f => f.path === '/nodes/html')?.message).toMatch(/^its text "faint" reads at 1\.\d:1 against what is drawn behind it — under 3:1/);
  });

  it('reads the paper off the picture, so light text on a dark panel painted behind it passes', async () => {
    await show(`
      <div style="position:absolute;left:0;top:0;width:300px;height:60px;background:#1a1a1a"></div>
      <div data-node-id="a" style="position:absolute;left:0;top:0;padding:8px;font-size:24px;color:#f0f0f0">light on dark</div>`);
    expect(await lowContrast([node('a')])).toEqual([]);
  });

  it('skips text that is not drawn where it sits: in definitions, hidden, or transparent', async () => {
    await show(`
      <div data-node-id="a">
        <svg width="200" height="40"><defs><text id="t" font-size="24" fill="#eee">in defs</text></defs></svg>
        <span style="visibility:hidden;color:#eee;font-size:24px">hidden</span>
        <span style="color:rgba(0,0,0,0);font-size:24px">clear</span>
      </div>`);
    expect(await lowContrast([node('a')])).toEqual([]);
  });

  it('keeps the worst run per part, the worst parts first, at most the limit', async () => {
    await show(`
      <div data-node-id="a" style="font-size:24px"><span style="color:#bbb">medium</span> <span style="color:#eee">faintest</span></div>
      <div data-node-id="b" style="font-size:24px;color:#ccc">fainter</div>`);
    const all = await lowContrast([node('a'), node('b')]);
    expect(all.map(f => f.path)).toEqual(['/nodes/a', '/nodes/b']);
    expect(all[0].message).toContain('"faintest"');
    expect(await lowContrast([node('a'), node('b')], 1)).toHaveLength(1);
  });
});
