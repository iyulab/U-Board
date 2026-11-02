import { test, expect } from '@playwright/test';

// An input part tells its host what is typed into it — through the real widget, in a real browser: the widget's own event is
// the one the host hears, and the board does nothing else with it.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Input', exact: true }).click();
  await expect(page.locator('[data-node-id="order"] u-widget')).toBeVisible();
});

const heard = (page: import('@playwright/test').Page) => page.getByRole('status').filter({ hasText: 'Input:' });

test('says none yet before anything is typed', async ({ page }) => {
  await expect(heard(page)).toHaveText('Input: none yet');
});

test('tells the host a field edited, with the part and the value', async ({ page }) => {
  await page.locator('[data-node-id="order"] input').first().fill('Ada');
  await expect(heard(page)).toHaveText('Input: order: name = Ada');
});
