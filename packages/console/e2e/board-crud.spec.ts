import { test, expect } from '@playwright/test';

test('create a board, add a node, save, and see it persisted after reopening', async ({ page }) => {
  // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입 — owner + 기본 워크스페이스 자동생성
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-board-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Board Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByText('멤버')).toBeVisible();

  // 보드 생성
  await page.getByRole('link', { name: '보드' }).click();
  page.once('dialog', dialog => dialog.accept('E2E Board'));
  await page.getByRole('button', { name: '새 보드' }).click();

  // 편집기로 이동, 노드 추가, 저장
  await expect(page.getByText('Save')).toBeVisible();
  await page.getByText('Add node').click();
  await page.getByText('Save').click();

  // 목록으로 돌아가 재진입해도 저장된 상태(추가한 노드)가 남아있는지 확인
  await page.goto('/boards');
  await page.getByRole('link', { name: 'E2E Board' }).click();
  await expect(page.getByText('Save')).toBeVisible();
  await expect(page.locator('details summary')).toHaveText('ViewDocument (debug)');
  await page.locator('details').click(); // <details> 펼치기
  await expect(page.locator('pre')).toContainText('"widget"'); // 추가한 노드가 document에 남아있음
});
