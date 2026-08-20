import { test, expect } from '@playwright/test';

test('an invited email with no account signs up through the invite link and joins the workspace', async ({ page, request }) => {
  const signupRes = await request.post('/auth/signup', {
    data: { email: 'e2e-owner2@test.com', password: 'p4ssword!', name: 'Owner' },
  });
  const { workspaceId } = await signupRes.json();
  const cookie = signupRes.headers()['set-cookie'];

  const inviteRes = await request.post(`/workspaces/${workspaceId}/invitations`, {
    data: { email: 'e2e-invitee@test.com', role: 'member' },
    headers: { Cookie: cookie },
  });
  const { token } = await inviteRes.json();

  await page.goto(`/invite/${token}`);
  await expect(page.getByRole('heading', { name: '가입' })).toBeVisible();
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('Invitee');
  await page.getByRole('button', { name: '가입' }).click();

  await expect(page.getByText('멤버')).toBeVisible();
  await expect(page.getByText('e2e-invitee@test.com')).toBeVisible();
});
