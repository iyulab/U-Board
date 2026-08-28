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
  await expect(page.getByText('Save')).toBeVisible();
  await page.getByText('Add node').click();
  await page.getByText('Save').click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // 목록으로 돌아가 재진입해도 저장된 상태(추가한 노드)가 남아있는지 확인 — 저장 직후라
  // 미저장 변경 사항이 없으므로 편집기의 "목록으로" 링크가 확인창 없이 바로 이동해야 한다.
  await page.getByRole('link', { name: '◂ 보드 목록으로' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();
  await page.getByRole('link', { name: 'E2E Board' }).click();
  await expect(page.getByText('Save')).toBeVisible();
  // NOTE: 보드 편집기 페이지에는 owner에게 렌더링되는 공유 패널도 <details>이므로(공유
  // 태스크 이후 실측), 텍스트로 ViewDocument 디버그 패널을 특정해 strict-mode violation을
  // 피한다.
  const debugPanel = page.locator('details').filter({ hasText: 'ViewDocument (debug)' });
  await expect(debugPanel.locator('summary')).toHaveText('ViewDocument (debug)');
  await debugPanel.locator('summary').click(); // <details> 펼치기
  await expect(page.locator('pre')).toContainText('"widget"'); // 추가한 노드가 document에 남아있음
});
