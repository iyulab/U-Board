import { test, expect, type Page } from '@playwright/test';

// Runs under playwright.single-origin.config.ts only — the server serving the built apps.

/** Every Content-Security-Policy violation the page reports, from before its first script runs. */
async function recordCspViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction('reportCspViolation', (v: string) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', e => {
      (window as unknown as { reportCspViolation: (v: string) => void }).reportCspViolation(
        `${e.violatedDirective} ${e.blockedURI}`
      );
    });
  });
  return violations;
}

test('the console, its share links and the share viewer work from one origin', async ({ page, browser, baseURL }) => {
  const consoleViolations = await recordCspViolations(page);

  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-single-origin@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Single Origin');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('One Origin');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  const editorPath = new URL(page.url()).pathname; // /boards/:boardId/edit
  const boardId = editorPath.split('/')[2];

  // A page load of one of the console's own routes gets the console, not a 404 or the API.
  await page.reload();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(editorPath);

  // The share link points at the viewer on this same origin.
  await page.getByText('공유', { exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = (await page.getByText('다시 볼 수 없습니다').locator('code').textContent())!;
  expect(shareUrl).toMatch(new RegExp(`^${baseURL}/share/\\?board=${boardId}&token=[\\w-]+$`));

  // Opened without the trailing slash, the viewer is redirected to `/share/` and loads its files.
  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  const shareViolations = await recordCspViolations(sharePage);
  await sharePage.goto(shareUrl.replace('/share/?', '/share?'));
  expect(new URL(sharePage.url()).pathname).toBe('/share/');
  await expect(sharePage.getByTestId('canvas')).toBeVisible();
  await shareContext.close();

  // A file the build does not have (a tab holding the previous build's names) is a 404, not HTML.
  const stale = await page.request.get('/assets/index-0ldbu1ld.js', { headers: { Accept: '*/*' } });
  expect(stale.status()).toBe(404);

  expect(consoleViolations).toEqual([]);
  expect(shareViolations).toEqual([]);
});
