import { test, expect } from '@playwright/test';

// How the board looks, compared with a picture of it — the regressions a DOM assertion cannot see: a
// widget that renders but in the wrong colours, a frame that lost its border, a tag that covers what it
// names. Fonts and anti-aliasing differ between operating systems, so the reference pictures are made on
// Linux, as CI runs it (`npm run test:visual:update` in this package makes them in the Playwright
// container), and the comparison runs on Linux only.
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

test('a grid view lays its widgets out in cells, in order', async ({ page }) => {
  await page.getByRole('button', { name: 'Grid', exact: true }).click();
  await page.locator('[style*="resize"]').evaluate(box => ((box as HTMLElement).style.width = '1100px'));
  const board = page.locator('.ub-viewer__surface');
  await expect(page.locator('.ub-grid [data-item-id] u-widget').first()).toBeVisible();
  // A chart draws its line in over a second on its canvas, which `animations: 'disabled'` (CSS only) does not stop;
  // the cells are laid out at a new width just now, so the charts in them have just started drawing again.
  await page.waitForTimeout(1500);
  await expect(board).toHaveScreenshot('grid.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
});

// Grid authoring on a dark board: the cells, the selected one's outline, each widget's type tag and the badges a
// stale or empty value wears — all on the dark paper, where a light-only colour would vanish.
test('grid authoring on a dark board keeps its outlines and tags readable', async ({ page }) => {
  await page.getByRole('button', { name: 'Author grid', exact: true }).click();
  await page.locator('.ub-authoring__appearance select').selectOption('dark');
  await page.locator('.ub-grid [data-item-id]').nth(1).click();
  const board = page.locator('.ub-authoring__surface');
  await expect(page.locator('.ub-grid [data-item-id] u-widget').first()).toBeVisible();
  // The charts draw their lines in over a second on their canvas (see the grid view above).
  await page.waitForTimeout(1500);
  await expect(board).toHaveScreenshot('grid-dark-authoring.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
});
