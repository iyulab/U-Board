import { expect, type Page } from '@playwright/test';

/**
 * Clicks a point (CSS px from its top-left) inside the authoring editor. The editor draws on
 * several stacked canvases, so the click goes to the editor region by position rather than to one
 * of its canvases.
 */
export async function clickEditorAt(page: Page, position: { x: number; y: number }) {
  const editor = page.getByRole('application', { name: '편집기' });
  const box = (await editor.boundingBox())!;
  await page.mouse.click(box.x + position.x, box.y + position.y);
}

/**
 * Clicks a scene point in the authoring editor — where a shape the test placed actually is on
 * screen under the current view. The editor's overlay layer carries the view transform as CSS
 * (`translate(x, y) scale(s)`), so it maps the scene point to the editor's pixels the same way the
 * editor draws it.
 */
export async function clickScenePoint(page: Page, point: { x: number; y: number }) {
  const css = await page.getByTestId('designer-overlay-layer').locator(':scope > div').evaluate(el => (el as HTMLElement).style.transform);
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+)\)/.exec(css);
  expect(m, `view transform on the editor's overlay layer: "${css}"`).not.toBeNull();
  const [x, y, scale] = m!.slice(1).map(Number);
  await clickEditorAt(page, { x: point.x * scale + x, y: point.y * scale + y });
}
