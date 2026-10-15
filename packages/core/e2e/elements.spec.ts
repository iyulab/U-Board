import { test, expect } from '@playwright/test';

// Elements drawn by templates: each in an isolated root — the page's CSS does not reach in, its own CSS does not
// reach out — in the board's theme. Only a browser computes styles across shadow roots.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Elements', exact: true }).click();
  await expect(page.locator('.ub-grid [data-element="pump"]').first()).toBeVisible();
});

test('draws each placed element from its one definition, with its props', async ({ page }) => {
  await expect(page.locator('.ub-grid [data-element]')).toHaveCount(7);
  const captions = await page.locator('[data-element="pump"]').evaluateAll(hosts => hosts.map(host => host.shadowRoot?.querySelector('figcaption')?.textContent));
  expect(captions).toEqual(['P-101 · 1450 rpm', 'P-102', 'P-103 · 0 rpm']);
});

test('keeps the page and the element styles apart, and takes the board theme', async ({ page }) => {
  await page.addStyleTag({ content: 'figcaption, b { color: rgb(255, 0, 0) !important; } .casing { stroke: rgb(255, 0, 0) !important; }' });
  const inside = await page.locator('[data-element="pump"]').nth(2).evaluate(host => {
    const root = host.shadowRoot!;
    return {
      caption: getComputedStyle(root.querySelector('figcaption')!).color,
      casing: getComputedStyle(root.querySelector('.casing')!).stroke,
    };
  });
  expect(inside.caption).toBe('rgb(91, 103, 119)'); // --u-widget-text-secondary, not the page's red
  expect(inside.casing).toBe('rgb(220, 38, 38)'); // --u-widget-negative for a fault
  // The tank's own `p { margin: 0 }` does not reach the page's paragraph above the board.
  const pageParagraph = await page.locator('p').first().evaluate(p => getComputedStyle(p).marginTop);
  expect(pageParagraph).not.toBe('0px');
});

test('fills a level from its value through CSS', async ({ page }) => {
  const share = await page.locator('[data-element="tank"]').first().evaluate(host => {
    const root = host.shadowRoot!;
    const fill = root.querySelector('.fill')!.getBoundingClientRect().height;
    const tank = root.querySelector('.tank')!.getBoundingClientRect().height;
    return fill / tank;
  });
  expect(share).toBeGreaterThan(0.6);
  expect(share).toBeLessThan(0.66);
});
