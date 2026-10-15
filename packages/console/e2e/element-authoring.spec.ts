import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';

async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

/** The text an element draws inside its isolated root. */
const drawn = (element: Locator) => element.evaluate(el => el.shadowRoot?.textContent ?? '');

test('an element made in the editor: defined, previewed, placed with its props, saved, and drawn from a share link', async ({ page, browser }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-element-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Element Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Element Board');
  await page.getByRole('radio', { name: /^그리드/ }).check();
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // With nothing selected, the board's elements: none yet, and a new one opens to edit.
  await page.getByRole('button', { name: '새 요소' }).click();
  await expect(page.getByRole('heading', { name: 'element-1' })).toBeVisible();
  const template = page.getByRole('textbox', { name: '템플릿', exact: true });
  await template.fill('<div class="box">{{label}} 수위</div>');
  await expect.poll(() => drawn(page.locator('[data-element-preview] [data-element]'))).toContain('Label 수위');
  await template.blur();
  await expectNoAxeViolations(page, 'element editor');
  await page.getByRole('button', { name: '요소 목록' }).click();
  await expect(page.locator('[data-element-entry="element-1"]')).toContainText('배치 안 됨');

  // Placed on an item, from the type choice, its prop edited by its own field.
  await page.getByRole('button', { name: '항목 추가' }).click();
  const editor = page.getByRole('region', { name: '편집기' });
  // A new item is selected as it is added.
  await expect(editor.locator('.ub-authoring__pick')).toHaveCount(1);
  await page.getByLabel('위젯 타입').selectOption('element:element-1');
  const label = page.getByLabel(/^label/);
  await label.fill('원수조');
  await label.blur();
  await expect.poll(() => drawn(editor.locator('[data-element="element-1"]'))).toContain('원수조 수위');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  await page.reload();
  await expect.poll(() => drawn(page.locator('[data-element="element-1"]').first())).toContain('원수조 수위');

  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();
  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  await sharePage.goto(shareUrl);
  await expect.poll(() => drawn(sharePage.locator('[data-element="element-1"]').first())).toContain('원수조 수위');
  await shareContext.close();
});
