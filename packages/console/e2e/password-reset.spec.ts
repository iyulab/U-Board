import { test, expect } from '@playwright/test';

// The server never returns a reset code in an HTTP response — it only ever goes to the account's
// mailbox. The e2e server sends email through a mock Sendway (`support/mock-sendway.mjs`), and the
// happy path below reads the code from there, the way a person reads it from their inbox.
const MAILBOX = 'http://127.0.0.1:4011/messages';

test('requests a reset for an existing account and sees the enumeration-safe confirmation', async ({ page, request }) => {
  // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입
  await request.post('/api/auth/signup', {
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

test('resets the password with the code from the email, then signs in with the new one', async ({ page, request }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('이메일').fill('e2e-reset-owner@test.com');
  await page.getByRole('button', { name: '재설정 코드 받기' }).click();
  await expect(page.getByText('계정이 존재하면 재설정 코드를 이메일로 보냈습니다')).toBeVisible();

  // The newest email to that address — the previous test requested one too.
  let email: { subject: string; body: string } | undefined;
  await expect
    .poll(async () => {
      const { messages } = await (await request.get(`${MAILBOX}?to=e2e-reset-owner@test.com`)).json();
      email = messages.at(-1);
      return messages.length;
    })
    .toBeGreaterThanOrEqual(2);
  expect(email!.subject).toBe('U-Board 비밀번호 재설정 코드');
  const code = email!.body.split('\n').map(line => line.trim()).find(line => /^[A-Za-z0-9_-]{20,}$/.test(line));
  expect(code).toBeDefined();

  await page.getByRole('link', { name: '비밀번호 재설정하기' }).click();
  await page.getByLabel('재설정 코드').fill(code!);
  await page.getByLabel('새 비밀번호').fill('n3wpassword!');
  await page.getByRole('button', { name: '비밀번호 재설정' }).click();
  await expect(page.getByText('비밀번호가 재설정되었습니다.')).toBeVisible();
  await page.getByRole('link', { name: '로그인하기' }).click();
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

  await page.getByLabel('이메일').fill('e2e-reset-owner@test.com');
  await page.getByLabel('비밀번호').fill('n3wpassword!');
  await page.getByRole('button', { name: '로그인' }).click();
  // Signing in checks the password with bcrypt, deliberately slow; on a busy machine it outlasts
  // the default 5 seconds.
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible({ timeout: 15_000 });
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
