import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { clickFirstNode } from './support/authoring';

/**
 * Checks a page against the WCAG 2.1 A/AA rules axe can test automatically. A failure lists each
 * violated rule with the elements it found, so the report reads without re-running. It waits for
 * running transitions (not looping animations, which never finish) first: right after a colour-scheme switch a button's background is still
 * fading while its text colour has already changed, and axe would measure that mid-fade contrast.
 */
async function expectNoAxeViolations(page: Page, label: string) {
  await page.evaluate(() =>
    Promise.allSettled(document.getAnimations().filter(animation => animation instanceof CSSTransition).map(transition => transition.finished)),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => n.target.join(' ')).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

test('the board list, the board editor, the share dialog and the shared board pass axe in light and dark', async ({ page, browser }) => {
  // The first signup of this invocation: owner and a default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-a11y-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E A11y Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('A11y Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // A board with something on it: a node bound to demo data (its widget, its property panel) and a
  // text decoration.
  await page.getByText('노드 추가').click();
  await clickFirstNode(page);
  await page.getByLabel('프롭 경로').selectOption('data.value');
  await page.getByRole('combobox', { name: '참조', exact: true }).selectOption('pump-a.state');
  await page.getByText('바인딩 저장', { exact: true }).click();
  await page.getByText('텍스트 장식 추가').click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await clickFirstNode(page);
    await expect(page.getByLabel('프롭 경로')).toBeVisible();
    await expectNoAxeViolations(page, `editor (${colorScheme})`);

    await page.getByRole('button', { name: '공유', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoAxeViolations(page, `share dialog (${colorScheme})`);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }

  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();
  await page.keyboard.press('Escape');

  await page.goto('/boards');
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expectNoAxeViolations(page, `board list (${colorScheme})`);
  }

  for (const colorScheme of ['light', 'dark'] as const) {
    const shareContext = await browser.newContext({ colorScheme });
    const sharePage = await shareContext.newPage();
    await sharePage.goto(shareUrl);
    await expect(sharePage.getByTestId('canvas')).toBeVisible();
    await expect(sharePage.locator('[data-testid^="overlay-node-"]').first()).toBeVisible();
    await expectNoAxeViolations(sharePage, `shared board (${colorScheme})`);
    await shareContext.close();
  }
});
