import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// The data source the board binds to: a local server that answers any path with the same JSON.
let mockServer: Server;
let mockBaseUrl: string;
test.beforeAll(async () => {
  mockServer = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'running' }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;
});
test.afterAll(() => new Promise<void>(resolve => mockServer.close(() => resolve())));

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
  const report = violations.map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map(n => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`).join('\n  ')}`);
  expect(report, `${label}: accessibility violations`).toEqual([]);
}

/** Selects the board's one part by a click on its middle — the overlay over it lets the pointer through to the canvas. */
async function selectPart(page: Page) {
  const part = page.getByTestId('designer-overlay-part-1');
  await expect(part).toBeVisible();
  const box = (await part.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('the board list, the board editor, the share dialog and the shared board pass axe in light and dark', async ({ page, browser }) => {
  // The first signup of this invocation: owner and a default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-a11y-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E A11y Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('link', { name: '커넥터' }).click();
  await page.getByLabel('이름').fill('A11y Source');
  await page.getByLabel('Base URL').fill(mockBaseUrl);
  await page.getByRole('button', { name: '데이터소스 추가' }).click();
  await expect(page.getByText('A11y Source')).toBeVisible();
  await page.getByRole('link', { name: '보드' }).click();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('A11y Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // A board with something on it: a part drawn by a widget, reading the data source (the board's data panel, the part's
  // panel), and a text.
  await page.getByLabel('새 데이터').fill('plant');
  await page.getByRole('button', { name: '데이터 추가' }).click();
  await page.getByLabel('요청 경로', { exact: true }).fill('/status');
  await page.getByLabel('새 필드').fill('status');
  await page.getByRole('button', { name: '필드 추가' }).click();
  await page.getByRole('button', { name: '부품 추가' }).click();
  await selectPart(page);
  await page.getByLabel('종류').selectOption('status-card');
  await page.getByLabel('읽는 데이터').selectOption('plant');
  await page.getByRole('combobox', { name: '보일 필드(쉼표로)' }).fill('status');
  await page.getByRole('button', { name: '글 추가' }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await expect(page.getByTestId('designer-overlay-part-1')).toContainText('running');

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await selectPart(page);
    await expect(page.getByRole('heading', { name: '부품 part-1' })).toBeVisible();
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
    await expect(sharePage.getByTestId('overlay-part-1')).toBeVisible();
    await expectNoAxeViolations(sharePage, `shared board (${colorScheme})`);
    await shareContext.close();
  }
});
