import { test, expect } from '@playwright/test';

test('first-time visitor sees the signup form and lands on the boards list', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '가입' })).toBeVisible();

  await page.getByLabel('이메일').fill('e2e-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Owner');
  await page.getByRole('button', { name: '가입' }).click();

  // Root ("/") redirects an authenticated session to /boards — the settings section (member
  // list, invites) that used to live at "/" moved to its own "/settings" route.
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();
});
