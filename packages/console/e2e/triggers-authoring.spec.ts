import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

async function newGridBoard(page: Page, name: string): Promise<string> {
  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill(name);
  await page.getByRole('radio', { name: /^그리드/ }).check();
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  return /\/boards\/([^/]+)\/edit/.exec(page.url())![1];
}

test('a trigger made in the editor: written once complete, run in View, and gone with its part', async ({ page }) => {
  // The first signup of this invocation: owner and a default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-triggers-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Triggers Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  // The board a trigger will show.
  const target = await newGridBoard(page, 'Target Board');
  await page.getByRole('link', { name: '◂ 보드 목록으로' }).click();

  const source = await newGridBoard(page, 'Trigger Board');
  const editor = page.getByRole('region', { name: '편집기' });
  await page.getByRole('button', { name: '부품 추가' }).click();
  await page.getByRole('button', { name: '부품 추가' }).click();
  await editor.locator('.ub-authoring__pick').first().click();

  // A click on the first item shows the target board — nothing is written until the board's id is given.
  await page.getByRole('button', { name: '트리거 추가' }).click();
  await page.getByRole('combobox', { name: '동작 1', exact: true }).selectOption('go-to-board');
  await expect(page.getByText('칸을 모두 채우세요')).toBeVisible();
  await page.getByRole('textbox', { name: '보드 id 1' }).fill(target);
  await expect(page.getByText('칸을 모두 채우세요')).toHaveCount(0);
  await expectNoAxeViolations(page, 'property panel with states and triggers');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // In View the item is a button; pressing it opens the target board.
  await page.getByRole('button', { name: '보기', exact: true }).click();
  const board = page.getByRole('region', { name: '보드 보기' });
  await board.getByRole('button').first().click();
  await expect(page).toHaveURL(new RegExp(`/boards/${target}/edit`));

  // Back on the first board, removing the item takes its trigger with it: the board still saves.
  await page.goto(`/boards/${source}/edit`);
  await page.getByRole('region', { name: '편집기' }).locator('.ub-authoring__pick').first().click();
  await page.getByRole('button', { name: '항목 삭제' }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
});
