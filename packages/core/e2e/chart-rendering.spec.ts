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
  // node id from src/App.tsx's demoDocument — canvas-kit's Viewer exposes each overlay via
  // data-testid="overlay-<node.id>" (packages/viewer/src/viewer.tsx), not a plain DOM id.
  const overlayTestId = 'overlay-pump-a-load-trend';

  const hasCanvas = await overlayShadowHas(page, overlayTestId, 'canvas');
  expect(hasCanvas).toBe(true);

  const text = await overlayShadowText(page, overlayTestId);
  expect(text).not.toContain('Unknown widget');
});
