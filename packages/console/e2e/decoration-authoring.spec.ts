import { test, expect } from '@playwright/test';
import { clickScenePoint } from './support/authoring';

test('adds a text and a frame to a canvas, selects each by clicking it, names the frame and edits the text, and both survive a reload', async ({ page }) => {
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

  // A text added to the new canvas at its top left, (20, 20), and a frame cascaded to (44, 44) at
  // 240×160. Undo takes the frame away again, Redo (Ctrl+Shift+Z) brings it back. The canvas draws a piece back a
  // moment later, and under load a click before that lands on nothing: click the text until it selects it.
  await page.getByRole('button', { name: '글 추가' }).click();
  await page.getByRole('button', { name: '틀 추가' }).click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  await expect(page.getByRole('button', { name: '다시 실행' })).toBeEnabled();
  await page.keyboard.press('Control+Shift+Z');
  await expect(page.getByRole('button', { name: '다시 실행' })).toBeDisabled();
  await expect(async () => {
    await clickScenePoint(page, { x: 27, y: 28 });
    await expect(page.getByRole('heading', { name: '도형 shape-1' })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('글', { exact: true }).fill('Zone A');

  // The frame, selected by a click well inside it, not on its border, to prove the frame's fill (not just its stroke)
  // is what makes it selectable; then named, and drawn dashed.
  await clickScenePoint(page, { x: 160, y: 130 });
  await expect(page.getByRole('heading', { name: '도형 shape-2' })).toBeVisible();
  await page.getByLabel('이름표', { exact: true }).fill('1번 베이');
  await page.getByLabel('점선').check();
  // A click on the empty canvas lets go of it.
  await clickScenePoint(page, { x: 420, y: 320 });
  await expect(page.getByRole('heading', { name: '도형 shape-2' })).toHaveCount(0);

  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  await page.reload();

  // The reopened board is fitted into view, so the shapes no longer sit at their first-session pixels — click the same
  // scene points under the current view.
  await clickScenePoint(page, { x: 27, y: 28 });
  await expect(page.getByLabel('글', { exact: true })).toHaveValue('Zone A');
  await clickScenePoint(page, { x: 160, y: 130 });
  await expect(page.getByLabel('이름표', { exact: true })).toHaveValue('1번 베이');
  await expect(page.getByLabel('점선')).toBeChecked();

  // A line, cascaded to (68, 68)–(268, 68): drawn as a node of its own, selected by a click on it, its points set in its
  // panel.
  await page.getByRole('button', { name: '선 도형 추가' }).click();
  const line = page.getByTestId('designer-overlay-shape.shape-3');
  await expect(line).toBeAttached();
  const lineBox = (await line.boundingBox())!;
  await page.mouse.click(lineBox.x + lineBox.width / 2, lineBox.y + lineBox.height / 2);
  await expect(page.getByRole('heading', { name: '도형 shape-3' })).toBeVisible();
  await expect(page.getByLabel('점(x,y — 빈칸으로)')).toHaveValue('68,68 268,68');
  await page.getByLabel('점(x,y — 빈칸으로)').fill('68,68 268,68 268,140');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  // 빈 영역에서 끌어 상자로 세 도형을 함께 고르면, 한 항목의 패널 대신 선택 개수를 알린다
  // (열 때 fit에 16px 여백이 있어 편집기 모서리는 비어 있다).
  const editor = (await page.getByRole('application', { name: '편집기' }).boundingBox())!;
  await page.mouse.move(editor.x + 2, editor.y + 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width / 2, editor.y + editor.height / 2, { steps: 4 });
  await page.mouse.move(editor.x + editor.width - 2, editor.y + editor.height - 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText('3개 선택됨 — 하나를 선택하면 편집할 수 있습니다.')).toBeVisible();
});
