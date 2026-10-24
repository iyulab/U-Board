import { test, expect } from '@playwright/test';
import { clickScenePoint } from './support/authoring';

test('joins two parts with a link, edits its label and arrow, keeps it across a reload, and deleting a part takes its link along', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-connector-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Connector Owner');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Connector Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  // Two parts: the first at scene (40, 40), the second cascaded to (64, 64) — 160×60 each. The second is dragged clear of
  // the first, by a point only it covers (its bottom right), 340 scene px to the right — to (404, 64).
  const addPart = page.getByRole('button', { name: '부품 추가' });
  await addPart.click();
  await addPart.click();
  const second = (await page.getByTestId('designer-overlay-part-2').boundingBox())!;
  const scale = second.width / 160;
  const grab = { x: second.x + second.width - 8 * scale, y: second.y + second.height - 8 * scale };
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + 170 * scale, grab.y, { steps: 5 });
  await page.mouse.move(grab.x + 340 * scale, grab.y, { steps: 5 });
  await page.mouse.up();

  const connect = page.getByRole('button', { name: '연결선 추가' });
  await expect(connect).toBeDisabled();
  await clickScenePoint(page, { x: 120, y: 70 });
  await page.keyboard.down('Shift');
  await clickScenePoint(page, { x: 484, y: 94 });
  await page.keyboard.up('Shift');
  await expect(page.getByText('2개 선택됨 — 하나를 선택하면 편집할 수 있습니다.')).toBeVisible();
  await connect.click();

  // The new link is selected at once, so its panel opens. It is drawn with an arrowhead at its end, as a flow is —
  // turned both ways here.
  await expect(page.getByRole('heading', { name: '연결선 part-1 → part-2' })).toBeVisible();
  await page.getByLabel('라벨', { exact: true }).fill('12 kW');
  await page.getByLabel('라벨', { exact: true }).press('Tab');
  const arrow = page.getByRole('combobox', { name: '화살표' });
  await expect(arrow).toHaveValue('end');
  await arrow.selectOption('both');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await page.reload();

  // The label's chip sits at the link's middle, between the two parts' centres (120, 70) and (484, 94).
  await clickScenePoint(page, { x: 302, y: 82 });
  await expect(page.getByRole('heading', { name: '연결선 part-1 → part-2' })).toBeVisible();
  await expect(page.getByLabel('라벨', { exact: true })).toHaveValue('12 kW');
  await expect(page.getByRole('combobox', { name: '화살표' })).toHaveValue('both');

  // A part deleted with the Delete key takes the link that names it along.
  await clickScenePoint(page, { x: 484, y: 94 });
  await expect(page.getByRole('heading', { name: '부품 part-2' })).toBeVisible();
  await page.keyboard.press('Delete');
  await clickScenePoint(page, { x: 302, y: 82 });
  await expect(page.getByRole('heading', { name: '연결선 part-1 → part-2' })).toHaveCount(0);
});
