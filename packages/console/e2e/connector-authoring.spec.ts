import { test, expect } from '@playwright/test';
import { clickEditorAt, clickScenePoint } from './support/authoring';

test('joins two nodes with a line, edits its label and arrow, keeps it across a reload, and deleting a node takes its line along', async ({ page }) => {
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

  // Two nodes: the first at scene (40, 40), the second cascaded to (64, 64) — 160×100 each (layout-defaults.ts). The
  // second is dragged clear of the first, by a point only it covers, to (400, 64).
  const addNode = page.getByRole('button', { name: '노드 추가' });
  await addNode.click();
  await addNode.click();
  const editor = (await page.getByRole('application', { name: '편집기' }).boundingBox())!;
  await page.mouse.move(editor.x + 210, editor.y + 150);
  await page.mouse.down();
  await page.mouse.move(editor.x + 400, editor.y + 150, { steps: 5 });
  await page.mouse.move(editor.x + 546, editor.y + 150, { steps: 5 });
  await page.mouse.up();

  const connect = page.getByRole('button', { name: '연결선 추가' });
  await expect(connect).toBeDisabled();
  await clickEditorAt(page, { x: 120, y: 90 });
  await page.keyboard.down('Shift');
  await clickEditorAt(page, { x: 480, y: 114 });
  await page.keyboard.up('Shift');
  await expect(page.getByText('2개 선택됨 — 하나를 선택하면 편집할 수 있습니다.')).toBeVisible();
  await connect.click();

  // The new line is selected at once, so its panel opens.
  await expect(page.getByRole('heading', { name: '연결선' })).toBeVisible();
  await page.getByLabel('라벨', { exact: true }).fill('12 kW');
  await page.getByLabel('라벨', { exact: true }).press('Tab');
  await page.getByLabel('화살표').selectOption('end');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await page.reload();

  // The label's chip sits at the line's middle, between the two boxes' centres (120, 90) and (480, 114).
  await clickScenePoint(page, { x: 300, y: 102 });
  await expect(page.getByRole('heading', { name: '연결선' })).toBeVisible();
  await expect(page.getByLabel('라벨', { exact: true })).toHaveValue('12 kW');
  await expect(page.getByLabel('화살표')).toHaveValue('end');

  // A node deleted with the Delete key takes the line that joins it along.
  await clickScenePoint(page, { x: 480, y: 114 });
  await expect(page.getByRole('heading', { name: '속성' })).toBeVisible();
  await page.keyboard.press('Delete');
  await clickScenePoint(page, { x: 300, y: 102 });
  await expect(page.getByRole('heading', { name: '연결선' })).toHaveCount(0);
});
