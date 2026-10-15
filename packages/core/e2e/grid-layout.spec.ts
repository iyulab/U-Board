import { test, expect, type Page } from '@playwright/test';

// A grid view lays out to the width of its own container — container queries, which only a browser computes.
// The demo's grid: seven items, the first two spanning 6 of 12 columns, the rest 4.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Grid' }).click();
  await expect(page.locator('.ub-grid [data-item-id] u-widget').first()).toBeVisible();
});

/** Each item's left edge and width, rounded, after giving the board's container `width` pixels. */
async function layoutAt(page: Page, width: number) {
  await page.locator('[style*="resize"]').evaluate((box, w) => ((box as HTMLElement).style.width = `${w}px`), width);
  return page.locator('.ub-grid__item').evaluateAll(items =>
    items.map(item => {
      const box = item.getBoundingClientRect();
      return { id: (item as HTMLElement).dataset.itemId, x: Math.round(box.x), width: Math.round(box.width) };
    })
  );
}

const rowsOf = (items: { x: number }[]) => items.reduce((rows, item, i) => rows + (i > 0 && item.x <= items[i - 1].x ? 1 : 0), 1);

test('a wide board spans 12 columns: two halves, then thirds', async ({ page }) => {
  const items = await layoutAt(page, 1200);
  expect(items.map(item => item.id)).toEqual(['pump-a', 'pump-a-load', 'pump-b', 'pump-c', 'pump-a-load-trend', 'seed-gauge-check', 'seed-chart-line-check']);
  expect(rowsOf(items)).toBe(3);
  expect(items[0].width).toBeGreaterThan(items[2].width * 1.4);
});

test('a medium board spans 6 columns, each item half its span', async ({ page }) => {
  const items = await layoutAt(page, 800);
  // 6-column spans: 3, 3 | 2, 2, 2 | 2, 2 — the same rows as at full width, narrower.
  expect(rowsOf(items)).toBe(3);
  expect(Math.abs(items[0].width - (items[2].width * 3) / 2)).toBeLessThan(12);
});

test('a narrow board puts one item on each row, in order, full width', async ({ page }) => {
  const items = await layoutAt(page, 400);
  expect(rowsOf(items)).toBe(items.length);
  expect(new Set(items.map(item => item.width)).size).toBe(1);
});

test('a widget with nothing to show still keeps its cell, so its quality mark stays in view', async ({ page }) => {
  await layoutAt(page, 400);
  const height = await page.locator('[data-item-id="pump-c"]').evaluate(item => item.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(48);
  await expect(page.locator('[data-item-id="pump-c"] [data-quality-badge]')).toBeVisible();
});
