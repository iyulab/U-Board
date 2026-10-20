import { test, expect } from '@playwright/test';

test('a sample on a source that issues each user a key asks for it, and the data source is created with it', async ({ page }) => {
  // 부트스트랩: 이 invocation의 첫 가입 — owner + 기본 워크스페이스
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-sample-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Sample Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '첫 보드 만들기' }).click();
  const start = page.getByRole('button', { name: '시청 일대 지하철 실시간 도착 샘플로 만들기' });
  const card = page.locator('li', { has: start });
  await expect(card.getByText('발급 키 필요')).toBeVisible();

  // 키 없이 누르면 아무것도 만들지 않고 키를 달라고 한다.
  await start.click();
  await expect(page.getByRole('alert')).toContainText('키를 입력하세요');

  await card.getByLabel('서울시 지하철 실시간 도착정보 키').fill('e2e-own-key');
  await start.click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // 데이터소스가 그 키로 만들어졌다 — 다시 샘플을 열면 같은 주소의 데이터소스가 있어 키를 묻지 않는다.
  await page.getByRole('link', { name: '◂ 보드 목록으로' }).click();
  await page.getByRole('button', { name: '새 보드' }).click();
  const again = page.locator('li', { has: page.getByRole('button', { name: '시청 일대 지하철 실시간 도착 샘플로 만들기' }) });
  await expect(again).toBeVisible();
  await expect(again.getByText('발급 키 필요')).toHaveCount(0);
  await expect(again.getByLabel('서울시 지하철 실시간 도착정보 키')).toHaveCount(0);
});
