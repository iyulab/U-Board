import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from 'playwright-core';
import { countQualityMarks, findLowContrast, findProblems } from './look-page.js';
import { PICTURE, launch } from './look.js';

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

  it('reports a text an element cuts short with an ellipsis — nothing spills, the reader sees "Ex…" — and none that fits', async () => {
    const line = (width: number) => `<template shadowrootmode="open"><div style="width:${width}px;display:grid"><b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Excavator A</b></div></template>`;
    await show(`
      <div data-node-id="a"><div data-element style="position:relative;width:40px;height:20px">${line(40)}</div></div>
      <div data-node-id="b"><div data-element style="position:relative;width:200px;height:20px">${line(200)}</div></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/a', message: 'its element cuts a text short with "…" — the box is too narrow for it; give the node more width (its size) rather than a shorter text' },
    ]);
  });

  it('does not count what the element cuts off itself — but does count a positioned part its static clip does not cut', async () => {
    await show(`
      <div data-node-id="a"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><div style="position:relative;width:100px;height:50px;overflow:hidden"><i style="position:absolute;right:-40px;top:0;width:80px;height:20px;display:block"></i><p style="margin:0;width:300px">a long line, cut</p></div></template>
      </div></div>
      <div data-node-id="b"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><div style="position:relative;width:100px;height:50px"><div style="width:100px;height:50px;overflow:hidden"><i style="position:absolute;right:-40px;top:0;width:80px;height:20px;display:block"></i></div></div></template>
      </div></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/b', message: 'its element draws up to 40 px past its box — over its neighbours; give the node more room or draw smaller' },
    ]);
  });

  it('reports an element drawing past its box only beyond the tolerance it is given', async () => {
    await show(`
      <div data-node-id="a"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><div style="position:absolute;left:0;top:0;width:106px;height:10px"></div></template>
      </div></div>
      <div data-node-id="b"><div data-element style="position:relative;width:100px;height:50px">
        <template shadowrootmode="open"><div style="position:absolute;left:0;top:0;width:130px;height:10px"></div></template>
      </div></div>`);
    // `page.evaluate` ships one argument; the third goes with the function's source, as a host page would call it.
    const problems = await page.evaluate(
      ({ source, placed }) => (new Function(`return (${source})`)() as typeof findProblems)(placed, document, { spillTolerancePx: 10 }),
      { source: findProblems.toString(), placed: [node('a'), node('b')] },
    );
    expect(problems).toEqual([
      { path: '/nodes/b', message: 'its element draws up to 30 px past its box — over its neighbours; give the node more room or draw smaller' },
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

  it('reports rows running past the bottom, inside a widget’s own shadow root too — and not a line whose font is taller than its line height', async () => {
    await show(`
      <div data-node-id="a"><u-widget style="display:block;width:200px;height:60px">
        <template shadowrootmode="open"><uw-list style="display:block;height:60px;overflow:hidden">
          <template shadowrootmode="open"><div style="height:40px">one</div><div style="height:40px">two</div></template>
        </uw-list></template>
      </u-widget></div>
      <div data-node-id="b"><u-widget style="display:block;width:200px">
        <template shadowrootmode="open"><uw-metric style="display:flex;flex-direction:column">
          <template shadowrootmode="open"><div><div style="font:32px 'Segoe UI',system-ui,sans-serif;line-height:1">4210</div></div></template>
        </uw-metric></template>
      </u-widget></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/a', message: 'its content runs past its box (200×80 in 200×60) — it scrolls or is cut off; give it more room' },
    ]);
  });

  it('reports content a widget cuts off inside itself — past an inner box that clips it, though still inside the widget’s own box — and not what fits or only scrolls', async () => {
    // A card shrinks the box its readings sit in when it is short of height, and that box clips: the bar is there and cut
    // off, the widget's own box holds what is left, so the content's reach says nothing of it.
    await show(`
      <div data-node-id="a"><u-widget style="display:block;width:200px;height:100px">
        <template shadowrootmode="open"><div style="width:200px;height:100px"><div style="height:20px;overflow:hidden"><div style="height:40px">bar</div></div></div></template>
      </u-widget></div>
      <div data-node-id="b"><u-widget style="display:block;width:200px;height:100px">
        <template shadowrootmode="open"><div style="width:200px;height:100px"><div style="height:40px;overflow:hidden"><div style="height:40px">bar</div></div></div></template>
      </u-widget></div>
      <div data-node-id="c"><u-widget style="display:block;width:200px;height:100px">
        <template shadowrootmode="open"><div style="width:200px;height:100px"><div style="height:20px;overflow:auto"><div style="height:40px">rows</div></div></div></template>
      </u-widget></div>
      <div data-node-id="d"><u-widget style="display:block;width:200px;height:100px">
        <template shadowrootmode="open"><uw-card style="display:block;height:100px"><template shadowrootmode="open"><div style="height:30px;overflow:hidden"><div style="height:10px"></div><div style="height:30px">meter</div></div></template></uw-card></template>
      </u-widget></div>
      <div data-node-id="e"><u-widget style="display:block;width:200px;height:100px">
        <template shadowrootmode="open"><div style="width:200px;height:100px"><div style="width:100px;height:40px;overflow:hidden"><div style="margin-left:150px;height:30px">aside</div></div></div></template>
      </u-widget></div>`);
    // `e` is a box pushed out of its clip sideways: it keeps its height, nothing of it is cut off downward.
    expect(await page.evaluate(findProblems, [node('a'), node('b'), node('c'), node('d'), node('e')])).toEqual([
      { path: '/nodes/a', message: 'its content is cut off inside the widget — up to 20 px of it sits past a box that clips it; give it more room' },
      { path: '/nodes/d', message: 'its content is cut off inside the widget — up to 10 px of it sits past a box that clips it; give it more room' },
    ]);
  });

  it('reports a text a widget cuts short with an ellipsis, in a shadow root within its own too — and none that fits', async () => {
    // A grid of chips keeps its columns at any width: on a narrow screen the reader sees "API 게이…" and nothing spills.
    await show(`
      <div data-node-id="a"><u-widget style="display:block;width:60px">
        <template shadowrootmode="open"><uw-grid style="display:block"><template shadowrootmode="open"><b style="display:block;width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Excavator A</b><i style="display:block;width:30px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Pump B</i></template></uw-grid></template>
      </u-widget></div>
      <div data-node-id="b"><u-widget style="display:block;width:200px">
        <template shadowrootmode="open"><uw-grid style="display:block"><template shadowrootmode="open"><b style="display:block;width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Excavator A</b></template></uw-grid></template>
      </u-widget></div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/a', message: 'its widget cuts 2 texts short with "…" — the box is too narrow for them; give the part more width' },
    ]);
  });

  it('measures a widget in a canvas drawn larger than its size in the widget’s own px — the scale is not overflow', async () => {
    await show(`
      <div style="transform:scale(2.6);transform-origin:0 0">
        <div data-node-id="a"><u-widget style="display:block;width:200px;height:80px">
          <template shadowrootmode="open"><div style="width:200px;height:80px"><div style="height:70px">fits</div></div></template>
        </u-widget></div>
        <div data-node-id="b"><u-widget style="display:block;width:200px;height:80px">
          <template shadowrootmode="open"><div style="width:200px;height:80px;overflow:hidden"><div style="height:120px">too tall</div></div></template>
        </u-widget></div>
      </div>`);
    expect(await page.evaluate(findProblems, [node('a'), node('b')])).toEqual([
      { path: '/nodes/b', message: 'its content runs past its box (200×120 in 200×80) — it scrolls or is cut off; give it more room' },
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
  it('counts the parts by the quality they show — nodes, grid items and connectors alike', async () => {
    await show(`
      <div data-node-id="a" data-quality="stale"></div><div data-item-id="b" data-quality="stale"></div>
      <div data-connector-id="c" data-quality="disconnected"></div><div data-connector-id="d"></div><div data-quality=""></div>`);
    expect(await page.evaluate(countQualityMarks)).toEqual({ stale: 2, disconnected: 1, marked: 1 });
  });

  it('is empty on a board with no marks', async () => {
    await show('<div data-node-id="a">42</div>');
    expect(await page.evaluate(countQualityMarks)).toEqual({});
  });
});

describe('PICTURE', () => {
  it('takes a blinking ring on, whenever the picture is taken', async () => {
    await show(`<style>@keyframes blink{50%{box-shadow:none}} .ring{animation:blink 0.2s step-end infinite}</style>
      <div class="ring" style="position:absolute;left:40px;top:40px;width:40px;height:40px;box-shadow:0 0 0 10px rgb(255,0,0)"></div>`);
    const red = async () => {
      const picture = `data:image/png;base64,${(await page.screenshot(PICTURE)).toString('base64')}`;
      return page.evaluate(async src => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const [r, g, b] = context.getImageData(35, 60, 1, 1).data; // inside the ring, left of the box
        return r > 200 && g < 60 && b < 60;
      }, picture);
    };
    for (let i = 0; i < 4; i++) {
      expect(await red()).toBe(true);
      await page.waitForTimeout(70);
    }
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

  it('reads the paper around the glyph, not the glyph — bold ink on a gradient passes, ink on its own colour does not', async () => {
    // A node badge: dark bold digit on a radial gradient. Every gradient step is a colour of its own, so the glyph's one
    // solid ink can outnumber each of them inside the text's box.
    const badge = (n: number) => `
      <div data-node-id="n${n}" style="position:absolute;left:${(n - 1) * 50}px;top:0;width:36px;height:36px">
        <svg viewBox="0 0 36 36" width="100%" height="100%"><defs><radialGradient id="g${n}" cx="38%" cy="34%" r="72%"><stop offset="0%" stop-color="#ffd25a"/><stop offset="55%" stop-color="#f6a71a"/><stop offset="100%" stop-color="#b9760c"/></radialGradient></defs>
          <circle cx="18" cy="18" r="17" fill="#1f8f4a"/><circle cx="18" cy="18" r="15" fill="url(#g${n})" stroke="#ffe28a" stroke-width="1.4"/>
          <text x="18" y="18.5" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#2b1a00">${n}</text></svg>
      </div>`;
    await show(`<div style="position:absolute;inset:0;background:#141a28"></div>${Array.from({ length: 14 }, (_, i) => badge(i + 1)).join('')}
      <div data-node-id="alert" style="position:absolute;left:0;top:60px"><svg width="24" height="24"><rect width="24" height="24" fill="#d32f2f"/><text x="12" y="18" text-anchor="middle" font-size="16" font-weight="700" fill="#d32f2f">!</text></svg></div>`);
    const found = await lowContrast([...Array.from({ length: 14 }, (_, i) => node(`n${i + 1}`)), node('alert')]);
    expect(found.map(f => f.path)).toEqual(['/nodes/alert']);
    expect(found[0].message).toContain('reads at 1.0:1');
  });

  it('skips text that is not drawn where it sits: in definitions, hidden, transparent, or kept for a screen reader', async () => {
    await show(`
      <div data-node-id="a">
        <svg width="200" height="40"><defs><text id="t" font-size="24" fill="#eee">in defs</text></defs></svg>
        <span style="visibility:hidden;color:#eee;font-size:24px">hidden</span>
        <span style="color:rgba(0,0,0,0);font-size:24px">clear</span>
        <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);color:#eee">for a screen reader</span>
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
