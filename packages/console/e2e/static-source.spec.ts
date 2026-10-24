import { test, expect } from '@playwright/test';

// A source that answers what is stored in the workspace: made in the console with example answers, read by a board as
// any source is, and said to be example data under the board — in the editor's view and on a share link.
test('a board reads a source of stored example answers, and says under it that its data is example data', async ({ page, browser }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-static-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Static Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('link', { name: '커넥터' }).click();
  await page.getByRole('radio', { name: '저장한 답' }).check();
  await page.getByLabel('이름').fill('Plant (example)');
  await page.getByLabel('저장한 답(JSON — 경로마다 응답)').fill('{ "/plant": { "shift": "B", "output": 412 } }');
  await page.getByLabel('시험할 경로').fill('/plant?site=north');
  await page.getByRole('button', { name: '답 확인' }).click();
  await expect(page.getByText('연결됨 — /plant?site=north가 응답했습니다.')).toBeVisible();
  await page.getByRole('checkbox', { name: /예시 데이터/ }).check();
  await page.getByRole('button', { name: '데이터소스 추가' }).click();
  await expect(page.getByText('저장한 답 · 경로 1개')).toBeVisible();

  await page.getByRole('link', { name: '보드' }).click();
  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Example Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // The board reads it as any source: a data read from it at a path, and a part showing one of its fields.
  await page.getByLabel('새 데이터').fill('plant');
  await page.getByRole('button', { name: '데이터 추가' }).click();
  await expect(page.getByRole('combobox', { name: /^원천/ }).locator('option:checked')).toHaveText('Plant (example)');
  await page.getByLabel('요청 경로', { exact: true }).fill('/plant');
  await page.getByRole('button', { name: '데이터 살펴보기' }).click();
  await page.getByRole('button', { name: 'shift 더하기' }).click();
  await page.getByRole('button', { name: '부품 추가' }).click();
  const part = page.getByTestId('designer-overlay-part-1');
  const box = (await part.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByLabel('제목', { exact: true }).fill('');
  await page.getByLabel('읽는 데이터').selectOption('plant');
  await page.getByRole('combobox', { name: '보일 필드(쉼표로)' }).fill('shift');
  await expect(part).toContainText('B');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // Viewed, the board says its data is example data.
  await page.getByRole('button', { name: '보기', exact: true }).click();
  await expect(page.getByText('예시 데이터', { exact: true })).toBeVisible();

  // And so does a share link, opened by someone with no session.
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await page.getByRole('button', { name: '새 공유 링크 생성' }).click();
  const shareUrl = await page.getByLabel('공유 링크 주소').inputValue();
  const shareContext = await browser.newContext();
  const sharePage = await shareContext.newPage();
  await sharePage.goto(shareUrl);
  await expect(sharePage.getByTestId('overlay-part-1')).toContainText('B');
  await expect(sharePage.getByText('예시 데이터', { exact: true })).toBeVisible();
  await shareContext.close();
});
