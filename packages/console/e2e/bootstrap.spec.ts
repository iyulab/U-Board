import { test, expect } from '@playwright/test';

test('first-time visitor sees the signup form and lands on the dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '가입' })).toBeVisible();

  await page.getByLabel('이메일').fill('e2e-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Owner');
  await page.getByRole('button', { name: '가입' }).click();

  await expect(page.getByText('멤버')).toBeVisible();
});
