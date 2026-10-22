import { existsSync, readdirSync } from 'node:fs';
import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { findProblems } from '@iyulab/u-board-mcp/tools';

// Every board of the gallery, on its own page, drawn and read the way `look` reads a board: an element drawing past its box, a
// widget whose content runs past its box, an "invalid spec" card, an element that failed — each is a defect a visitor
// sees. The boards come from the built page, so a board added to the gallery is checked without listing it here.

// Every board has its own page in the built gallery (`dist/gallery/<id>/`).
const built = new URL('../dist/gallery/', import.meta.url);
if (!existsSync(built)) throw new Error('build the site first (npm run build --workspace=packages/site) — this checks the built gallery');
const boards = readdirSync(built, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(new URL(`${entry.name}/index.html`, built)))
  .map(entry => entry.name)
  .filter(id => id !== 'thumbs');

/** `look` tells an author about anything drawn over 1 px past its box. On the gallery a few px is decoration on
 *  purpose — a card pasted in askew, a strip of tape over the edge, a glyph's side bearing — and is not a defect a
 *  visitor sees; text spilling onto the next node is tens of px. */
const SPILL_TOLERANCE_PX = 10;

/** One browser context per worker, so the viewer's code and the fonts are fetched once and every board after the first
 *  loads warm; one page per board, so the boards already looked at do not pile up in the page being measured. */
const test = base.extend<{ tab: Page }, { warm: BrowserContext }>({
  warm: [
    async ({ browser }, provide) => {
      const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
      await provide(context);
      await context.close();
    },
    { scope: 'worker' },
  ],
  tab: async ({ warm }, provide) => {
    const page = await warm.newPage();
    await provide(page);
    await page.close();
  },
});

test('the gallery shows boards', () => {
  expect(boards.length).toBeGreaterThan(10);
});

for (const id of boards) {
  test(`gallery board ${id} draws without problems`, async ({ tab }) => {
    await tab.goto(`/gallery/${id}/`, { waitUntil: 'domcontentloaded' });
    const board = tab.locator(`[data-sample-board="${id}"]`);
    await board.scrollIntoViewIfNeeded();
    // The board is attached when it comes into view; its parts carry the attribute `look` finds them by.
    await expect(board.locator('[data-node-id], [data-item-id]').first()).toBeAttached({ timeout: 30_000 });
    // Text is measured in the fonts a visitor gets, so wait for them; then let charts finish drawing in.
    await tab.evaluate(() => document.fonts.ready.then(() => undefined));
    await tab.waitForTimeout(800);
    const problems = await tab.evaluate(
      ({ source, id, spillTolerancePx }) => {
        const root = document.querySelector(`[data-sample-board="${id}"]`)!;
        const placed = [...root.querySelectorAll('[data-node-id], [data-item-id]')].map(el => {
          const attr = el.hasAttribute('data-node-id') ? 'data-node-id' : 'data-item-id';
          const partId = el.getAttribute(attr)!;
          return { id: partId, path: partId, attr };
        });
        // `findProblems` carries everything it uses inside it, so the page can run it from its source — the same way
        // `page.evaluate` ships a function, with a second argument; the source is this repository's own code.
        const run = new Function(`return (${source})`)() as typeof findProblems;
        return run(placed, root, { spillTolerancePx });
      },
      { source: findProblems.toString(), id, spillTolerancePx: SPILL_TOLERANCE_PX },
    );
    expect(problems, problems.map(p => `${p.path}: ${p.message}`).join('\n')).toEqual([]);
  });
}
