import { test, expect, type Page } from '@playwright/test';

// Regression class this guards: u-widgets keeps `chart.*` behind an opt-in subpath
// (`@iyulab/u-widgets/charts`, echarts is an optional peer dep) — without that import, a node
// whose widget.type starts with "chart." silently renders as a "u-widget" custom element with
// its built-in "Unknown widget: <type>" fallback instead of a chart, and nothing in the
// jsdom-based unit suite can tell the two apart (jsdom doesn't implement <canvas> rendering, so
// it can't distinguish "a chart drew a canvas" from "nothing drew a canvas"). This has happened
// before and was found only by looking at a browser.

/** Wait until <u-widget> is registered and this project's demo document has rendered. */
async function waitForWidgets(page: Page) {
  await page.waitForFunction(() => customElements.get('u-widget') !== undefined, { timeout: 10_000 });
}

/** Whether a selector exists anywhere in an overlay's u-widget shadow tree (u-widgets nests a
 * second shadow root per widget kind under the outer <u-widget> shadow root). */
async function overlayShadowHas(page: Page, overlayTestId: string, selector: string): Promise<boolean> {
  return page.evaluate(
    ([testId, sel]) => {
      const host = document.querySelector(`[data-testid="${testId}"] u-widget`);
      if (!host?.shadowRoot) return false;
      if (host.shadowRoot.querySelector(sel)) return true;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot?.querySelector(sel)) return true;
      }
      return false;
    },
    [overlayTestId, selector] as const
  );
}

async function overlayShadowText(page: Page, overlayTestId: string): Promise<string> {
  return page.evaluate((testId) => {
    const host = document.querySelector(`[data-testid="${testId}"] u-widget`);
    if (!host?.shadowRoot) return '';
    const parts: string[] = [host.shadowRoot.textContent?.trim() ?? ''];
    for (const child of host.shadowRoot.querySelectorAll('*')) {
      if (child.shadowRoot) parts.push(child.shadowRoot.textContent?.trim() ?? '');
    }
    return parts.filter(Boolean).join(' ');
  }, overlayTestId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForWidgets(page);
  await page.waitForTimeout(1000); // let the async chart render settle, matches u-widgets' own e2e convention
});

test('page loads without JS errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await waitForWidgets(page);
  expect(errors).toEqual([]);
});

test('the demo document\'s chart.line node renders a canvas, not the "Unknown widget" fallback', async ({ page }) => {
  // node id from src/App.tsx's demoDocument — the authoring editor draws each node's widget in place
  // as a canvas-kit designer overlay, data-testid="designer-overlay-<node.id>", not a plain DOM id.
  const overlayTestId = 'designer-overlay-pump-a-load-trend';

  const hasCanvas = await overlayShadowHas(page, overlayTestId, 'canvas');
  expect(hasCanvas).toBe(true);

  const text = await overlayShadowText(page, overlayTestId);
  expect(text).not.toContain('Unknown widget');
});

// widget-catalog.ts's seedWidget() shape (what a freshly type-switched node gets before an
// author touches anything) differs from the hand-authored sample data above — a shape mismatch
// there wouldn't be caught by the tests above, and jsdom's unit suite can't tell a real render
// from the "Unknown widget" fallback for canvas-based widgets either (same reason as the file
// banner comment). App.tsx's `seed-gauge-check`/`seed-chart-line-check` demo nodes exist to close
// exactly this gap (bindings-editor final review, 2026-08-25).
test('the authoring seed shape for gauge renders through the real pipeline, not the "Unknown widget" fallback', async ({ page }) => {
  const text = await overlayShadowText(page, 'designer-overlay-seed-gauge-check');
  expect(text).not.toContain('Unknown widget');
});

test('the authoring seed shape for chart.line renders a canvas, not the "Unknown widget" fallback', async ({ page }) => {
  const overlayTestId = 'designer-overlay-seed-chart-line-check';

  const hasCanvas = await overlayShadowHas(page, overlayTestId, 'canvas');
  expect(hasCanvas).toBe(true);

  const text = await overlayShadowText(page, overlayTestId);
  expect(text).not.toContain('Unknown widget');
});

/** On-screen heights of a node's box and of the widget drawn in it. */
async function heights(page: Page, nodeId: string) {
  return page.evaluate(id => {
    const overlay = document.querySelector(`[data-testid="designer-overlay-${id}"]`) as HTMLElement;
    const widget = overlay.querySelector('u-widget') as HTMLElement;
    return { overlay: overlay.getBoundingClientRect().height, widget: widget.getBoundingClientRect().height };
  }, nodeId);
}

// A node's box is the author's: its widget fills it, rather than keeping its own default height and
// leaving the box half empty.
test('a widget fills a node taller than its own default — the chart is as tall as the node', async ({ page }) => {
  const sizes = await heights(page, 'pump-a-load-trend');
  expect(sizes.overlay).toBeGreaterThan(0);
  expect(Math.abs(sizes.widget - sizes.overlay)).toBeLessThan(2);
});

// …and stays inside a node smaller than it would draw itself: nothing spills over a neighbour. The widget
// fits the box rather than being cut by it — a gauge's whole dial is in view with nothing scrolled away,
// and a chart keeps a plot to read rather than one pressed flat.
test('a widget stays whole inside a node smaller than its own size', async ({ page }) => {
  for (const id of ['seed-chart-line-check', 'seed-gauge-check']) {
    const sizes = await heights(page, id);
    expect(Math.abs(sizes.widget - sizes.overlay), id).toBeLessThan(2);
  }

  const fit = await page.evaluate(() => {
    const overlay = (id: string) => document.querySelector(`[data-testid="designer-overlay-${id}"]`) as HTMLElement;
    const deep = (root: ParentNode, sel: string): Element | null => {
      const hit = root.querySelector(sel);
      if (hit) return hit;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) { const d = deep(el.shadowRoot, sel); if (d) return d; }
      }
      return null;
    };
    const gaugeBox = overlay('seed-gauge-check').getBoundingClientRect();
    const dial = deep(overlay('seed-gauge-check'), 'svg.gauge-svg')!.getBoundingClientRect();
    const scroller = deep(overlay('seed-gauge-check'), '.gauge-container') as HTMLElement;
    type Grid = { coordinateSystem: { getRect(): { height: number } } };
    const chart = deep(overlay('seed-chart-line-check'), 'uw-chart') as HTMLElement & {
      _chart?: { getModel(): { getComponent(t: string): Grid } };
    };
    return {
      dialInside: dial.bottom <= gaugeBox.bottom + 1 && dial.top >= gaugeBox.top - 1,
      dialScrolls: scroller.scrollHeight > scroller.clientHeight + 1,
      plot: chart._chart?.getModel().getComponent('grid').coordinateSystem.getRect().height ?? 0,
    };
  });
  expect(fit.dialInside, JSON.stringify(fit)).toBe(true);
  expect(fit.dialScrolls, JSON.stringify(fit)).toBe(false);
  expect(fit.plot, JSON.stringify(fit)).toBeGreaterThan(40);
});
