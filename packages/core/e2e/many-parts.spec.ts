import { test, expect } from '@playwright/test';

// A board with more parts than one view holds: zoomed out its markers are drawn as points on the canvas (more than 500 are
// in the view); zoomed in, the ones in view are parts of the page again and the parts well beyond the view are left out, and
// they come back as the view nears them. Only a browser draws the parts and moves the view.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Crowd', exact: true }).click();
  await expect(page.getByTestId('summary-status')).toContainText('800 parts are shown as a summary');
});

const parts = (page: import('@playwright/test').Page) => page.locator('[data-node-id^="crowd/"]');
const idsOf = (page: import('@playwright/test').Page) => parts(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-node-id')!));

test('draws the markers as points while the whole board is in view — none of them is a part of the page', async ({ page }) => {
  await expect(parts(page)).toHaveCount(0);
  await expect(page.getByTestId('summary-canvas')).toBeVisible();
  // Something is drawn on it: some pixel of the canvas is not transparent.
  const drawn = await page.getByTestId('summary-canvas').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true;
    return false;
  });
  expect(drawn).toBe(true);
});

test('leaves out the parts far from the view once zoomed in, and the part that was in view stays', async ({ page }) => {
  const view = page.getByRole('region', { name: 'Board' });
  const box = (await view.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120);
  // The points are parts again once fewer than 400 markers are in the view, and the ones far from it are left out.
  await expect.poll(async () => { const n = await parts(page).count(); return n > 0 && n < 400; }).toBe(true);
  await expect(page.getByTestId('summary-status')).toBeEmpty();
});

test('builds parts again as the view pans toward them', async ({ page }) => {
  const view = page.getByRole('region', { name: 'Board' });
  const box = (await view.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120);
  await expect.poll(async () => { const n = await parts(page).count(); return n > 0 && n < 400; }).toBe(true);
  const before = new Set(await idsOf(page));

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 380, cy - 200, { steps: 12 });
  await page.mouse.up();

  await expect.poll(async () => (await idsOf(page)).some(id => !before.has(id))).toBe(true);
  expect(await parts(page).count()).toBeLessThan(400);
});
