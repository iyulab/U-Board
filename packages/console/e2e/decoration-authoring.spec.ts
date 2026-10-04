import { test, expect } from '@playwright/test';
import { clickEditorAt, clickScenePoint } from './support/authoring';

test('draws a rect and a text decoration, selects each by clicking its interior, edits the text label, and it survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('이메일').fill('e2e-decoration-owner@test.com');
  await page.getByLabel('비밀번호').fill('p4ssword!');
  await page.getByLabel('이름').fill('E2E Decoration Owner');
  await page.getByRole('button', { name: '가입' }).click();
  // "/"는 인증된 세션을 즉시 /boards로 리다이렉트한다.
  await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

  await page.getByRole('button', { name: '새 보드' }).click();
  await page.getByLabel('보드 이름').fill('Decoration Board');
  await page.getByRole('button', { name: '생성' }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

  await page.getByText('사각형 장식 추가').click();
  // Default rect decoration: scene (40, 40), 240x160 (packages/core/src/layout-defaults.ts) —
  // click well inside its interior, not on its border, to prove the designer's placeholder fill
  // (not just the stroke) is what makes it selectable.
  await clickEditorAt(page, { x: 160, y: 120 });
  await expect(page.getByText('캔버스에서 드래그/리사이즈로 위치와 크기를 조정하세요.')).toBeVisible();

  await page.getByText('텍스트 장식 추가').click();
  // Cascades to (64, 64) as the second decoration (nextDecorationPosition — same cascade step as
  // nodes). A Konva Text hit-tests its whole bounding box, so a click near its center selects it.
  await clickEditorAt(page, { x: 85, y: 72 });
  await expect(page.getByLabel('라벨')).toHaveValue('라벨');

  await page.getByLabel('라벨').fill('Zone A');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await page.reload();

  // The reopened board is fitted into view, so the text no longer sits at its first-session pixel —
  // click the same scene point (the text at scene (64, 64)) under the current view.
  await clickScenePoint(page, { x: 85, y: 72 });
  await expect(page.getByLabel('라벨')).toHaveValue('Zone A');

  // 빈 영역에서 끌어 상자로 두 장식을 함께 고르면, 한 항목의 패널 대신 선택 개수를 알린다
  // (열 때 fit에 16px 여백이 있어 편집기 모서리는 비어 있다).
  const editor = (await page.getByRole('region', { name: '편집기' }).boundingBox())!;
  await page.mouse.move(editor.x + 2, editor.y + 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width / 2, editor.y + editor.height / 2, { steps: 4 });
  await page.mouse.move(editor.x + editor.width - 2, editor.y + editor.height - 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText('2개 선택됨 — 하나를 선택하면 편집할 수 있습니다.')).toBeVisible();
});
