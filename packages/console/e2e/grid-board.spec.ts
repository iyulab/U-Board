import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

test('a grid board: made as a grid, given items in order, saved, and opened from a share link', async ({ page, browser }) => {
  // The first signup of this invocation: owner and a default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-grid-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Grid Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Grid Board');
  await page.getByRole('radio', { name: /^그리드/ }).check();
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // Two items, the second after the first; the first made wide.
  const editor = page.getByRole('region', { name: '편집기' });
  await page.getByRole('button', { name: '부품 추가' }).click();
  await page.getByRole('button', { name: '부품 추가' }).click();
  await expect(editor.locator('.ub-authoring__pick')).toHaveCount(2);
  await editor.locator('.ub-authoring__pick').first().click();
  await page.getByLabel('너비(12열 중)').selectOption('8');
  // Dragged onto the first, the second takes its place and is selected; dragged back, the order is as it was.
  const picks = editor.locator('.ub-authoring__pick');
  await picks.nth(1).dragTo(picks.first());
  await expect(picks.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('너비(12열 중)')).not.toHaveValue('8');
  await picks.first().dragTo(picks.nth(1));
  await expect(picks.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await picks.first().click();
  await expect(page.getByLabel('너비(12열 중)')).toHaveValue('8');
  await expectNoAxeViolations(page, 'grid editor');
  // On dark paper the cells, the selected one's outline and the tags must stay readable too — and the shared board
  // below is read dark.
  await picks.first().click(); // unselected, the panel is the board's
  await page.locator('.ub-authoring__appearance select').selectOption('dark');
  await expect(page.locator('.ub-authoring__surface[data-appearance="dark"]')).toBeVisible();
  await picks.first().click();
  await expectNoAxeViolations(page, 'grid editor, dark board');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // The list says the board is a grid.
  await page.getByRole('link', { name: '◂ 보드 목록으로' }).click();
  await expect(page.getByText(/^그리드 · 수정/)).toBeVisible();

  // Shared, it reads as a grid: two items, the first spanning 8 of 12 columns.
  await page.getByRole('link', { name: 'Grid Board' }).click();
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();
  await page.keyboard.press('Escape');

  const shareContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const sharePage = await shareContext.newPage();
  await sharePage.goto(shareUrl);
  const items = sharePage.locator('.ub-grid__item');
  await expect(items).toHaveCount(2);
  await expect(items.first().locator('u-widget')).toBeVisible();
  const [first, second] = await items.evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width));
  expect(first / second).toBeGreaterThan(1.8); // 8 columns against the default 4
  await expectNoAxeViolations(sharePage, 'shared grid board');
  await shareContext.close();
});
