import { test, expect } from '@playwright/test';

// Boards written in the board language's second version, opened in the editor: a canvas board's parts are moved and
// deleted on the canvas as on any board, a grid board's widened, ordered and retitled in the panel, and what is saved is
// the board in its own version — a part placed where it was dropped, a deleted one gone with the link that named it.
test('moves, sizes, orders and deletes the parts of boards in the second version, and saves each in that version', async ({ page }) => {
  const signup = await page.request.post('/api/auth/signup', {
    data: { email: 'e2e-board-v2-layout@test.com', password: 'p4ssword!', name: 'E2E Board V2 Layout' },
  });
  expect(signup.status()).toBe(201);
  const { workspaceId } = await signup.json();
  const board = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Layout V2' } })).json();
  const at = `/api/workspaces/${workspaceId}/boards/${board.id}`;
  const saved = await page.request.put(at, {
    data: {
      document: {
        version: 2,
        parts: { title: { as: 'label', title: 'Line 1' }, note: { as: 'label', title: 'Line 2' } },
        layout: { kind: 'canvas', size: [800, 500], place: { title: [40, 40, 160, 100], note: [500, 300, 160, 100] }, links: { l: { from: 'title', to: 'note' } } },
      },
    },
  });
  expect(saved.ok()).toBe(true);

  await page.goto(`/boards/${board.id}/edit`);
  await expect(page.getByText(/부품을 옮기고 크기를 바꾸거나 지울 수 있습니다/)).toBeVisible();
  await expect(page.getByRole('button', { name: '노드 추가' })).toHaveCount(0);

  // Drag the first part right by its middle — the overlay over a node lets the pointer through to the canvas.
  const overlay = page.locator('[data-testid="designer-overlay-title"]');
  await expect(overlay).toBeVisible();
  const box = (await overlay.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText('저장되지 않은 변경 사항')).toBeVisible();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();

  const moved = (await (await page.request.get(at)).json()).document;
  expect(moved.version).toBe(2);
  expect(moved.layout.place.title[0]).toBeGreaterThan(40);
  expect(moved.layout.place.title.slice(1)).toEqual([40, 160, 100]);
  expect(moved.layout.place.note).toEqual([500, 300, 160, 100]);

  // Select the second part and delete it: it goes, and so does the link that named it.
  const note = (await page.locator('[data-testid="designer-overlay-note"]').boundingBox())!;
  await page.mouse.click(note.x + note.width / 2, note.y + note.height / 2);
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const deleted = (await (await page.request.get(at)).json()).document;
  expect(Object.keys(deleted.parts)).toEqual(['title']);
  expect(deleted.layout.links).toEqual({});

  // A grid board: an item is widened and moved earlier in the editor's panel, and the board is saved with its layout's
  // entries in the new order and width.
  const grid = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Grid V2' } })).json();
  const gridAt = `/api/workspaces/${workspaceId}/boards/${grid.id}`;
  expect((await page.request.put(gridAt, {
    data: { document: { version: 2, parts: { a: { as: 'header', title: 'First' }, b: { as: 'header', title: 'Second' } }, layout: { kind: 'grid', items: ['a', 'b'] } } },
  })).ok()).toBe(true);
  await page.goto(`/boards/${grid.id}/edit`);
  await expect(page.getByRole('button', { name: '항목 추가' })).toHaveCount(0);
  await page.getByRole('button', { name: /^2\. / }).click();
  await page.getByLabel('너비(12열 중)').selectOption('8');
  await page.getByRole('button', { name: '앞으로' }).click();
  // The part's own panel, under its place: its title set where it is selected.
  await expect(page.getByRole('heading', { name: '부품 b' })).toBeVisible();
  await page.getByLabel('제목', { exact: true }).fill('Second, wider');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const laidOut = (await (await page.request.get(gridAt)).json()).document;
  expect(laidOut.layout).toEqual({ kind: 'grid', items: [['b', 8], 'a'] });
  expect(Object.keys(laidOut.parts)).toEqual(['a', 'b']);
  expect(laidOut.parts.b).toEqual({ as: 'header', title: 'Second, wider' });
});
