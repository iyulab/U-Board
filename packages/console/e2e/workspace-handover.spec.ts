import { test, expect } from '@playwright/test';

test('an owner invites a second owner through the console, then leaves the workspace to them', async ({ page, browser }) => {
  // Bootstrap: the first signup of this invocation becomes owner of the default workspace.
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-operator@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('Operator');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  // Invite the customer's administrator as an owner.
  await page.getByRole('link', { name: '설정' }).click();
  await page.getByLabel('초대할 이메일').fill('e2e-customer-admin@test.com');
  await page.getByLabel('초대 역할').selectOption('owner');
  await page.getByRole('button', { name: '초대' }).click();
  const inviteLink = await page.getByLabel('초대 링크(복사해 전달)').inputValue();
  await expect(page.getByRole('heading', { name: '대기 중인 초대' })).toBeVisible();

  // The administrator joins through the link in their own browser session.
  const customerContext = await browser.newContext();
  const customer = await customerContext.newPage();
  await customer.goto(inviteLink);
  await customer.getByLabel('비밀번호').fill('p4ssword!');
  await customer.getByLabel('이름').fill('Customer Admin');
  await customer.getByRole('button', { name: '가입' }).click();
  await expect(customer.getByRole('heading', { name: '보드' })).toBeVisible();

  // Back on the operator's side: the invitation is redeemed, the administrator is an owner.
  await page.reload();
  await expect(page.getByRole('heading', { name: '대기 중인 초대' })).toHaveCount(0);
  await expect(page.getByLabel('e2e-customer-admin@test.com 역할')).toHaveValue('owner');

  // The operator leaves; with no other workspace, the console offers a way back in instead of pages.
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '나가기' }).click();
  await expect(page.getByText(/소속된 워크스페이스가 없습니다/)).toBeVisible();

  // The administrator now holds the workspace alone — and, as its last owner, cannot leave it.
  await customer.getByRole('link', { name: '설정' }).click();
  await expect(customer.getByText('e2e-customer-admin@test.com')).toBeVisible();
  await expect(customer.getByText('e2e-operator@test.com')).toHaveCount(0);
  customer.once('dialog', dialog => dialog.accept());
  await customer.getByRole('button', { name: '나가기' }).click();
  await expect(customer.getByRole('alert')).toContainText('owner가 한 명 이상');

  await customerContext.close();
});
