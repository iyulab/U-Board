import { readFileSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { SAMPLE_PACKS } from '@iyulab/u-board-samples';
import { packHash } from '../src/thumb-hash';

const manifestUrl = new URL('../src/thumbs.json', import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as Record<string, { width: number; height: number; hash: string }>;
const asked = process.env.THUMBNAILS;
const wanted = SAMPLE_PACKS.filter(pack =>
  asked === 'all' ? true : asked ? asked.split(',').includes(pack.id) : manifest[pack.id]?.hash !== packHash(pack)
);

/** The picture's width: a card is at most ~25 rem wide, at twice the pixels for a sharp screen. */
const WIDTH = 800;

// Each picture is written as it is taken; the manifest is written once, at the end, by the last worker to finish —
// so it is read again and merged rather than overwritten.
const taken: Record<string, { width: number; height: number; hash: string }> = {};

test.afterAll(() => {
  if (Object.keys(taken).length === 0) return;
  const current = JSON.parse(readFileSync(manifestUrl, 'utf8')) as typeof manifest;
  const ids = new Set(SAMPLE_PACKS.map(p => p.id));
  const merged = Object.fromEntries(
    Object.entries({ ...current, ...taken })
      .filter(([id]) => ids.has(id))
      .sort(([a], [b]) => a.localeCompare(b))
  );
  writeFileSync(manifestUrl, `${JSON.stringify(merged, null, 2)}\n`);
});

test('there is something to take', () => {
  test.skip(wanted.length === 0, 'every thumbnail is up to date');
});

for (const pack of wanted) {
  test(`thumbnail of ${pack.id}`, async ({ page }) => {
    await page.goto(`/gallery/${pack.id}/`, { waitUntil: 'domcontentloaded' });
    const surface = page.locator('.ub-viewer__surface');
    await expect(surface.locator('[data-node-id], [data-item-id]').first()).toBeAttached({ timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // Charts draw themselves in; let them finish.
    await page.waitForTimeout(1500);
    const png = await surface.screenshot();
    // Scaled down and encoded as WebP by the browser itself — no image library for one picture per board.
    const { data, width, height } = await page.evaluate(
      async ({ base64, target }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const width = Math.min(target, image.naturalWidth);
        const height = Math.round((image.naturalHeight * width) / image.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d')!;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);
        return { data: canvas.toDataURL('image/webp', 0.82).split(',')[1], width, height };
      },
      { base64: png.toString('base64'), target: WIDTH }
    );
    writeFileSync(new URL(`../public/gallery/thumbs/${pack.id}.webp`, import.meta.url), Buffer.from(data, 'base64'));
    taken[pack.id] = { width, height, hash: packHash(pack) };
  });
}
