import { test, expect } from '@playwright/test';

// Items placed by their own fields, drawn in a browser: each event at the point its longitude and latitude say,
// those with none or off the map left out, and a click on one opening that event's own page.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Quakes', exact: true }).click();
  await expect(page.locator('[data-node-id="quake/west"]')).toBeVisible();
});

const centre = async (page: import('@playwright/test').Page, id: string) => {
  const box = (await page.locator(`[data-node-id="quake/${id}"]`).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test('draws the located events where their fields say and leaves out the rest', async ({ page }) => {
  await expect(page.locator('[data-node-id^="quake/"]')).toHaveCount(3);
  const [west, east, south] = [await centre(page, 'west'), await centre(page, 'east'), await centre(page, 'south')];
  // Longitude runs left to right, latitude top to bottom: south of the equator is below, east is right of west.
  expect(east.x).toBeGreaterThan(west.x);
  expect(south.y).toBeGreaterThan(west.y);
  // On a 360° × 180° map, 0° longitude is the middle: the point at 0° is between −120° and 140°, at a third of the way.
  const span = east.x - west.x;
  const zero = west.x + span * (120 / 260);
  expect(Math.abs(south.x - zero)).toBeLessThan(3);
});

test('a click on an event opens its own page', async ({ page }) => {
  const popup = page.waitForEvent('popup');
  await page.locator('[data-node-id="quake/east"]').click();
  const opened = await popup;
  expect(new URL(opened.url()).pathname + new URL(opened.url()).search).toBe('/events/east?mag=3.1');
});
