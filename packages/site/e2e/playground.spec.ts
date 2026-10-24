import { test, expect } from '@playwright/test';

// The JSON playground draws a gallery board from its published files, names a mistake by its path, draws again once it
// is fixed — and a board's page opens it there.
test('the playground draws a board from its JSON and points at what is wrong', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/gallery/heating-nixie/');
  await page.getByRole('link', { name: /플레이그라운드에서 열기/ }).click();
  await expect(page).toHaveURL(/\/playground\/\?board=heating-nixie$/);
  // The page's own status line (the board's widgets have status roles of their own).
  const status = page.locator('[data-status]');
  await expect(status).toHaveText(/문제 없음/);
  await expect(page.locator('[data-view] [data-node-id]').first()).toBeAttached();

  const definition = page.locator('[data-field="definition"]');
  const text = await definition.inputValue();
  await definition.fill(text.replace('"theme": "dark"', '"theme": "dim"'));
  await expect(status).toHaveText(/문제 1개/);
  await expect(page.locator('[data-problems] li')).toHaveText([/\/board\/theme/]);

  await definition.fill(text);
  await expect(status).toHaveText(/문제 없음/);
  expect(errors).toEqual([]);
});
