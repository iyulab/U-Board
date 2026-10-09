import { test, expect } from '@playwright/test';

// How the board looks, compared with a picture of it — the regressions a DOM assertion cannot see: a
// widget that renders but in the wrong colours, a frame that lost its border, a tag that covers what it
// names. Fonts and anti-aliasing differ between operating systems, so the reference pictures are made on
// Linux, as CI runs it (`npm run test:visual:update` makes them in the Playwright container), and the
// comparison runs on Linux only.
test.skip(process.platform !== 'linux', 'reference pictures are rendered on Linux, where CI runs');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.waitForFunction(() => customElements.get('u-widget') !== undefined, { timeout: 10_000 });
});

// The demo document: a stale and a never-resolving binding beside live ones, a chart, gauges, the
// placeholder background — each node's widget in place on the editor, with its type named above it.
test('the editor draws each widget in place, named', async ({ page }) => {
  const editor = page.locator('.ub-authoring__surface');
  await expect(page.locator('[data-testid^="designer-overlay-"] u-widget').first()).toBeVisible();
  await expect(editor).toHaveScreenshot('editor.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
});

test('view mode shows the board as a shared link does', async ({ page }) => {
  await page.locator('.ub-authoring__mode').getByRole('button', { name: 'View' }).click();
  const board = page.locator('.ub-authoring__surface');
  await expect(page.locator('[data-testid^="overlay-"] u-widget').first()).toBeVisible();
  await expect(board).toHaveScreenshot('view.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
});

test('a dark board keeps its values readable', async ({ page }) => {
  await page.getByText('Remove background').click();
  await page.locator('.ub-authoring__appearance select').selectOption('dark');
  await page.locator('.ub-authoring__mode').getByRole('button', { name: 'View' }).click();
  const board = page.locator('.ub-authoring__surface');
  await expect(page.locator('[data-testid^="overlay-"] u-widget').first()).toBeVisible();
  await expect(board).toHaveScreenshot('dark-board.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
});
