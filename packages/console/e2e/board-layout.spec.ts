import { test, expect } from '@playwright/test';

// Boards opened in the editor: a canvas board's parts are moved and deleted on the canvas, a grid board's widened,
// ordered and retitled in the panel, and what is saved is the board — a part placed where it was dropped, a deleted one
// gone with the link that named it.
test('moves, sizes, orders and deletes the parts of boards, and saves each', async ({ page }) => {
  const signup = await page.request.post('/api/auth/signup', {
    data: { email: 'e2e-board-layout@test.com', password: 'p4ssword!', name: 'E2E Board Layout' },
  });
  expect(signup.status()).toBe(201);
  const { workspaceId } = await signup.json();
  const board = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Layout' } })).json();
  const at = `/api/workspaces/${workspaceId}/boards/${board.id}`;
  const saved = await page.request.put(at, {
    data: {
      document: {
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
  expect(moved).not.toHaveProperty('version');
  expect(moved.layout.place.title[0]).toBeGreaterThan(40);
  expect(moved.layout.place.title.slice(1)).toEqual([40, 160, 100]);
  expect(moved.layout.place.note).toEqual([500, 300, 160, 100]);

  // Select both parts and join them: a second link, drawn at once and selected, its label set in its panel.
  const title = (await page.locator('[data-testid="designer-overlay-title"]').boundingBox())!;
  const noteBox = (await page.locator('[data-testid="designer-overlay-note"]').boundingBox())!;
  await page.mouse.click(title.x + title.width / 2, title.y + title.height / 2);
  await page.keyboard.down('Shift');
  await page.mouse.click(noteBox.x + noteBox.width / 2, noteBox.y + noteBox.height / 2);
  await page.keyboard.up('Shift');
  await expect(page.getByRole('button', { name: '연결선 추가' })).toBeEnabled();
  await page.getByRole('button', { name: '연결선 추가' }).click();
  await expect(page.getByRole('heading', { name: '연결선 title → note' })).toBeVisible();
  await page.getByLabel('라벨', { exact: true }).fill('flow');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const joined = (await (await page.request.get(at)).json()).document;
  expect(joined.layout.links).toEqual({ l: { from: 'title', to: 'note' }, 'link-2': { from: 'title', to: 'note', arrow: 'end', label: 'flow' } });

  // A frame added to the canvas, selected and named in its panel, saved as the board's shape.
  await page.getByRole('button', { name: '틀 추가' }).click();
  // The canvas draws a frame with no DOM of its own: find it from the note part's overlay, which is at [500, 300, 160, 100].
  const anchor = (await page.locator('[data-testid="designer-overlay-note"]').boundingBox())!;
  const scale = anchor.width / 160;
  await page.mouse.click(anchor.x + (30 - 500) * scale, anchor.y + (170 - 300) * scale);
  await expect(page.getByRole('heading', { name: '도형 shape-1' })).toBeVisible();
  await page.getByLabel('이름표', { exact: true }).fill('Zone A');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const framed = (await (await page.request.get(at)).json()).document;
  expect(framed.layout.shapes).toEqual({ 'shape-1': { box: [20, 20, 240, 160], label: 'Zone A' } });

  // Select the second part and delete it: it goes, and so do the links that named it.
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
  const grid = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Grid' } })).json();
  const gridAt = `/api/workspaces/${workspaceId}/boards/${grid.id}`;
  expect((await page.request.put(gridAt, {
    data: { document: { parts: { a: { as: 'header', title: 'First' }, b: { as: 'header', title: 'Second' } }, layout: { kind: 'grid', items: ['a', 'b'] } } },
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

  // A grid with a canvas in a cell: the cell widened in the grid, then opened in the canvas editor and its part moved
  // there — saved as the cell's own place, the grid's other entries as they were.
  const cells = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Cell' } })).json();
  const cellsAt = `/api/workspaces/${workspaceId}/boards/${cells.id}`;
  expect((await page.request.put(cellsAt, {
    data: { document: {
      parts: { head: { as: 'header', title: 'Plant' }, valve: { as: 'label', title: 'V1' } },
      layout: { kind: 'grid', items: ['head', { canvas: { size: [600, 300], place: { valve: [40, 40, 160, 80] } }, span: 6, height: 320 }] },
    } },
  })).ok()).toBe(true);
  await page.goto(`/boards/${cells.id}/edit`);
  await page.getByRole('button', { name: /^2\. / }).click();
  await page.getByLabel('너비(12열 중)').selectOption('8');
  await page.getByRole('button', { name: '캔버스 편집' }).click();
  await expect(page.getByRole('button', { name: '← 그리드' })).toBeVisible();
  const valve = page.locator('[data-testid="designer-overlay-valve"]');
  await expect(valve).toBeVisible();
  const v = (await valve.boundingBox())!;
  await page.mouse.move(v.x + v.width / 2, v.y + v.height / 2);
  await page.mouse.down();
  await page.mouse.move(v.x + v.width / 2 + 60, v.y + v.height / 2 + 30, { steps: 5 });
  await page.mouse.move(v.x + v.width / 2 + 120, v.y + v.height / 2 + 60, { steps: 5 });
  await page.mouse.up();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const placed = (await (await page.request.get(cellsAt)).json()).document;
  expect(placed.layout.items[0]).toBe('head');
  expect(placed.layout.items[1].span).toBe(8);
  expect(placed.layout.items[1].height).toBe(320);
  expect(placed.layout.items[1].canvas.place.valve[0]).toBeGreaterThan(40);
  expect(placed.layout.items[1].canvas.place.valve[1]).toBeGreaterThan(40);
  await page.getByRole('button', { name: '← 그리드' }).click();
  await expect(page.getByRole('button', { name: /^2\. / })).toBeVisible();

  // A grid with a grid in a cell: an item of the inner grid is not laid
  // out alone in the outer grid — it opens the inner grid, ordered there and saved back into the cell.
  const stacks = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Stack' } })).json();
  const stacksAt = `/api/workspaces/${workspaceId}/boards/${stacks.id}`;
  expect((await page.request.put(stacksAt, {
    data: { document: {
      parts: { map: { as: 'header', title: 'Map' }, a: { as: 'header', title: 'A' }, b: { as: 'header', title: 'B' } },
      layout: { kind: 'grid', items: [['map', 8], { grid: [['a', 6], ['b', 6]], span: 4 }] },
    } },
  })).ok()).toBe(true);
  await page.goto(`/boards/${stacks.id}/edit`);
  await page.getByRole('button', { name: /^2\. / }).click();
  await expect(page.getByRole('button', { name: '뒤로' })).toHaveCount(0);
  await page.getByRole('button', { name: '칸 그리드 편집' }).click();
  await expect(page.getByRole('button', { name: '← 그리드' })).toBeVisible();
  await page.getByRole('button', { name: /^1\. / }).click();
  await page.getByRole('button', { name: '뒤로' }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장됨')).toBeVisible();
  const restacked = (await (await page.request.get(stacksAt)).json()).document;
  expect(restacked.layout).toEqual({ kind: 'grid', items: [['map', 8], { grid: [['b', 6], ['a', 6]], span: 4 }] });
});
