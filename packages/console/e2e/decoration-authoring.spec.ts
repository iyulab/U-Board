import { test, expect } from '@playwright/test';

test('draws a rect and a text decoration, selects each by clicking its interior, edits the text label, and it survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-decoration-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Decoration Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByText('멤버')).toBeVisible();

  await page.goto('/boards');
  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Decoration Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByText('Save')).toBeVisible();

  await page.getByText('Add rect decoration').click();
  // Default rect decoration: scene (40, 40), 240x160 (packages/core/src/layout-defaults.ts) —
  // click well inside its interior, not on its border, to prove the designer's placeholder fill
  // (not just the stroke) is what makes it selectable.
  await page.locator('canvas').first().click({ position: { x: 160, y: 120 } });
  await expect(page.getByText('캔버스에서 드래그/리사이즈로 위치와 크기를 조정하세요.')).toBeVisible();

  await page.getByText('Add text decoration').click();
  // Cascades to (64, 64) as the second decoration (nextDecorationPosition — same cascade step as
  // nodes). A Konva Text hit-tests its whole bounding box, so a click near its center selects it.
  await page.locator('canvas').first().click({ position: { x: 85, y: 72 } });
  await expect(page.getByLabel('라벨')).toHaveValue('Label');

  await page.getByLabel('라벨').fill('Zone A');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await page.reload();

  await page.locator('canvas').first().click({ position: { x: 85, y: 72 } });
  await expect(page.getByLabel('라벨')).toHaveValue('Zone A');
});
