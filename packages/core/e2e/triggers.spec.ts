import { test, expect } from '@playwright/test';

// A click trigger on a part of a canvas board: a click runs it, a drag that starts on the part pans the board instead.
// Only a browser tells the two apart — the viewer's pointer handling decides whether a click follows the drag.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await expect(page.locator('[data-node-id="pump-a"] u-widget')).toBeVisible();
});

const status = (page: import('@playwright/test').Page) => page.getByRole('status').filter({ hasText: 'Board event:' });

test('a click on the part runs its trigger', async ({ page }) => {
  await page.getByRole('button', { name: 'pump-a', exact: true }).click();
  await expect(status(page)).toHaveText('Board event: pump-a-details (pump-a)');
});

test('a drag that starts on the part pans the board and runs nothing', async ({ page }) => {
  const part = page.locator('[data-node-id="pump-a"]');
  const before = (await part.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 60, before.y + before.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  const after = (await part.boundingBox())!;
  expect(Math.round(after.x - before.x)).toBe(60);
  await expect(status(page)).toHaveText('Board event: none yet — click Pump A');
});

test('the part takes Enter as a click', async ({ page }) => {
  await page.locator('[data-node-id="pump-a"]').focus();
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('Board event: pump-a-details (pump-a)');
});
