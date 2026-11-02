import { test, expect } from '@playwright/test';

// A board with more parts than one view holds: zoomed out every part is in the page; zoomed in, the parts well beyond the
// view are left out and come back as the view nears them. Only a browser draws the parts and moves the view.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Crowd', exact: true }).click();
  await expect(page.locator('[data-node-id="crowd/c0"]')).toBeVisible();
});

const parts = (page: import('@playwright/test').Page) => page.locator('[data-node-id^="crowd/"]');
const idsOf = (page: import('@playwright/test').Page) => parts(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-node-id')!));

test('draws every part while the whole board is in view', async ({ page }) => {
  await expect(parts(page)).toHaveCount(800);
});

test('leaves out the parts far from the view once zoomed in, and the part that was in view stays', async ({ page }) => {
  const view = page.getByRole('region', { name: 'Board' });
  const box = (await view.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120);
  await expect.poll(async () => (await parts(page).count()) < 400).toBe(true);
  expect(await parts(page).count()).toBeGreaterThan(0);
});

test('builds parts again as the view pans toward them', async ({ page }) => {
  const view = page.getByRole('region', { name: 'Board' });
  const box = (await view.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120);
  await expect.poll(async () => (await parts(page).count()) < 400).toBe(true);
  const before = new Set(await idsOf(page));

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 380, cy - 200, { steps: 12 });
  await page.mouse.up();

  await expect.poll(async () => (await idsOf(page)).some(id => !before.has(id))).toBe(true);
  expect(await parts(page).count()).toBeLessThan(400);
});
