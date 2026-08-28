import { test, expect } from '@playwright/test';

// The server deliberately never returns the reset token through any HTTP response — it only
// ever reaches `sendPasswordResetEmail` (see `routes/auth.ts`'s `/request-password-reset`
// handler comment: "The token itself never appears in this response either way"). In dev mode
// (no SENDWAY_API_KEY) it's logged to the server's own stdout, which this e2e harness has no
// programmatic access to. So this spec covers the request phase, the navigation wiring, and the
// invalid-token error path (all real server round-trips) — not the full happy-path token
// redemption, which would need a dedicated test-only token-retrieval hook (a security-relevant
// design decision, proposed separately rather than added here).

test('requests a reset for an existing account and sees the enumeration-safe confirmation', async ({ page, request }) => {
  // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입
  await request.post('/auth/signup', {
    data: { email: 'e2e-reset-owner@test.com', password: 'p4ssword!', name: 'E2E Reset Owner' },
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

  await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click();
  await expect(page.getByRole('heading', { name: '비밀번호 재설정 요청' })).toBeVisible();

  await page.getByLabel('이메일').fill('e2e-reset-owner@test.com');
  await page.getByRole('button', { name: '재설정 코드 받기' }).click();

  await expect(page.getByText('계정이 존재하면 재설정 코드를 이메일로 보냈습니다')).toBeVisible();
  await expect(page.getByRole('link', { name: '비밀번호 재설정하기' })).toHaveAttribute('href', '/reset-password');
});

test('requests a reset for a non-existent email and sees the identical confirmation (no enumeration)', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('이메일').fill('e2e-does-not-exist@test.com');
  await page.getByRole('button', { name: '재설정 코드 받기' }).click();

  await expect(page.getByText('계정이 존재하면 재설정 코드를 이메일로 보냈습니다')).toBeVisible();
});

test('rejects an invalid/expired reset code with a specific error, not a generic one', async ({ page }) => {
  await page.goto('/reset-password');
  await page.getByLabel('재설정 코드').fill('not-a-real-token');
  await page.getByLabel('새 비밀번호').fill('n3wpassword');
  await page.getByRole('button', { name: '비밀번호 재설정' }).click();

  await expect(page.getByRole('alert')).toHaveText('재설정 코드가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.');
});
