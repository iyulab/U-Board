import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';

async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

/** The text an element draws inside its isolated root. */
const drawn = (element: Locator) => element.evaluate(el => el.shadowRoot?.textContent ?? '');

test('an element made in the editor: defined, drawn by a part with its prop, saved, and drawn from a share link', async ({ page, browser }) => {
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

  // With nothing selected, the board's elements: none yet; one is added by name, its template written, and the prop it
  // takes named in place of the one a new element starts with.
  const elements = page.locator('.ub-panel--elements');
  await elements.getByLabel('이름', { exact: true }).fill('tank-level');
  await elements.getByRole('button', { name: '새 요소' }).click();
  await expect(elements.getByRole('group', { name: 'tank-level' })).toBeVisible();
  await elements.getByRole('textbox', { name: '템플릿', exact: true }).fill('<div class="box">{{label}} 수위</div>');
  await elements.getByRole('button', { name: 'value 지우기' }).click();
  await elements.getByLabel('새 prop').fill('label');
  await elements.getByRole('button', { name: 'prop 추가' }).click();
  await expect(elements.getByRole('combobox', { name: 'label', exact: true })).toHaveValue('string');
  await expectNoAxeViolations(page, 'element editor');

  // Drawn by a part: its kind an element, which one, and its prop fixed to a text.
  await page.getByRole('button', { name: '부품 추가' }).click();
  const editor = page.getByRole('region', { name: '편집기' });
  await expect(editor.locator('.ub-authoring__pick')).toHaveCount(1);
  await editor.locator('.ub-authoring__pick').first().click();
  await expect(page.getByRole('heading', { name: '부품 part-1' })).toBeVisible();
  await page.getByLabel('종류').selectOption('element');
  await page.getByLabel('이 보드의 요소').selectOption('tank-level');
  const label = page.getByRole('textbox', { name: 'label', exact: true });
  await label.fill('"원수조"');
  await label.blur();
  await expect.poll(() => drawn(editor.locator('[data-element="tank-level"]'))).toContain('원수조 수위');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  await page.reload();
  await expect.poll(() => drawn(page.locator('[data-element="tank-level"]').first())).toContain('원수조 수위');

  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();
  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  await sharePage.goto(shareUrl);
  await expect.poll(() => drawn(sharePage.locator('[data-element="tank-level"]').first())).toContain('원수조 수위');
  await shareContext.close();
});
