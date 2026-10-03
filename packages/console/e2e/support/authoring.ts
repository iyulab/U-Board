import { expect, type Page } from '@playwright/test';

/**
 * Clicks the first widget node in the authoring editor. The editor is a canvas with no DOM per node,
 * and where a node lands on screen depends on the view (a board with content opens fitted into
 * view), so a fixed pixel is not a stable target. The live preview beside it shares the editor's
 * pan/zoom and renders each node as a DOM overlay — the node's offset inside the preview is its
 * offset inside the editor.
 */
export async function clickFirstNode(page: Page) {
  const preview = page.getByTestId('viewer-container');
  const overlay = preview.locator('[data-testid^="overlay-node-"]').first();
  await expect(overlay).toBeVisible();
  const previewBox = (await preview.boundingBox())!;
  const nodeBox = (await overlay.boundingBox())!;
  await page.locator('canvas').first().click({
    position: {
      x: nodeBox.x - previewBox.x + nodeBox.width / 2,
      y: nodeBox.y - previewBox.y + nodeBox.height / 2,
    },
  });
}

/**
 * Clicks a scene point in the authoring editor — where a shape the test placed actually is on
 * screen under the current view. The live preview shares the editor's pan/zoom and its overlay
 * layer carries that transform as CSS (`translate(x, y) scale(s)`), so it maps the scene point to
 * the editor's pixels the same way the editor draws it.
 */
export async function clickScenePoint(page: Page, point: { x: number; y: number }) {
  const css = await page.getByTestId('viewer-container').getByTestId('overlay-layer').evaluate(el => (el as HTMLElement).style.transform);
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+)\)/.exec(css);
  expect(m, `view transform on the preview overlay layer: "${css}"`).not.toBeNull();
  const [x, y, scale] = m!.slice(1).map(Number);
  await page.locator('canvas').first().click({ position: { x: point.x * scale + x, y: point.y * scale + y } });
}
