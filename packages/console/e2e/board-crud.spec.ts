import { test, expect } from '@playwright/test';

test('create a board, add a node, save, and see it persisted after reopening', async ({ page }) => {
  // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입 — owner + 기본 워크스페이스 자동생성
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-board-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Board Owner');
  await page.getByRole('button', { name: '가입' }).click();
  // "/"는 인증된 세션을 즉시 /boards로 리다이렉트한다.
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  // 보드 생성
  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('E2E Board');
  await page.getByRole('button', { name: '생성' }).click();

  // 편집기로 이동, 노드 추가, 저장
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  await page.getByText('노드 추가').click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // 목록으로 돌아가 재진입해도 저장된 상태(추가한 노드)가 남아있는지 확인 — 저장 직후라
  // 미저장 변경 사항이 없으므로 편집기의 "목록으로" 링크가 확인창 없이 바로 이동해야 한다.
  await page.getByRole('link', { name: '◂ 보드 목록으로' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();
  await page.getByRole('link', { name: 'E2E Board' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
  // 추가한 노드가 저장된 문서에 남아 있다 — 편집기에 노드의 위젯이 제자리에 하나 그려진다.
  await expect(page.locator('[data-testid^="designer-overlay-node-"]')).toHaveCount(1);
});
