import { test, expect } from '@playwright/test';

test('warns before leaving the board editor with unsaved changes, stays silent when clean, and clears again after saving', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-unsaved-guard-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Unsaved Guard Owner');
  await page.getByRole('button', { name: '가입' }).click();
  // "/"는 인증된 세션을 즉시 /boards로 리다이렉트한다.
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Unsaved Guard Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByText('Save')).toBeVisible();
  const editorUrl = page.url();

  // Nothing edited yet — leaving should not prompt.
  let dialogSeen = false;
  page.once('dialog', () => {
    dialogSeen = true;
  });
  await page.goto('/boards');
  expect(dialogSeen).toBe(false);
  await expect(page.getByRole('button', { name: '새 보드' })).toBeVisible();

  // Back into the editor, make an edit — leaving should now prompt. A persistent `dialog`
  // listener (not `waitForEvent`) is required here: Playwright auto-dismisses a `beforeunload`
  // dialog before a one-shot waiter can react to it unless a listener is already attached.
  await page.goto(editorUrl);
  await expect(page.getByText('Save')).toBeVisible();
  await page.getByText('Add rect decoration').click();
  await expect(page.getByText('저장되지 않은 변경 사항이 있습니다')).toBeVisible();

  let dialogType: string | null = null;
  page.once('dialog', dialog => {
    dialogType = dialog.type();
    void dialog.accept();
  });
  await page.goto('/boards');
  expect(dialogType).toBe('beforeunload');
  await expect(page.getByRole('button', { name: '새 보드' })).toBeVisible();

  // Back into the editor once more: edit, save, then leaving should be silent again.
  await page.goto(editorUrl);
  await expect(page.getByText('Save')).toBeVisible();
  await page.getByText('Add rect decoration').click();
  await expect(page.getByText('저장되지 않은 변경 사항이 있습니다')).toBeVisible();
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await expect(page.getByText('저장되지 않은 변경 사항이 있습니다')).toHaveCount(0);

  let dialogSeenAfterSave = false;
  page.once('dialog', () => {
    dialogSeenAfterSave = true;
  });
  await page.goto('/boards');
  expect(dialogSeenAfterSave).toBe(false);
  await expect(page.getByRole('button', { name: '새 보드' })).toBeVisible();
});
