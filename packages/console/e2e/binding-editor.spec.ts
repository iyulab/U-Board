import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

test('reads a data source into a board and shows one of its fields in a part, from the editor panels', async ({ page }) => {
  // 어떤 경로로 요청이 와도 같은 JSON을 돌려주는 로컬 mock — connector-crud.spec.ts와 동일 패턴.
  const mockServer = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // `updatedAt`: when the source says it observed its values — a minute before each answer.
    res.end(JSON.stringify({ status: 'running', metrics: { load: 73 }, updatedAt: new Date(Date.now() - 60_000).toISOString() }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    await page.goto('/');
    await page.getByLabel('이메일').fill('e2e-binding-owner@test.com');
    await page.getByLabel('비밀번호').fill('p4ssword!');
    await page.getByLabel('이름').fill('E2E Binding Owner');
    await page.getByRole('button', { name: '가입' }).click();
    // "/"는 인증된 세션을 즉시 /boards로 리다이렉트한다.
    await expect(page.getByRole('heading', { name: '보드' })).toBeVisible();

    await page.getByRole('link', { name: '커넥터' }).click();
    await page.getByLabel('이름').fill('Mock Plant API');
    await page.getByLabel('Base URL').fill(mockBaseUrl);
    await page.getByRole('button', { name: '데이터소스 추가' }).click();
    await expect(page.getByText('Mock Plant API')).toBeVisible();

    await page.getByRole('link', { name: '보드' }).click();
    await page.getByRole('button', { name: '새 보드' }).click();
    await page.getByLabel('보드 이름').fill('Binding Board');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();

    // 보드의 데이터 — 아무것도 고르지 않은 편집기 패널에서: 이름을 짓고, 원천(커넥터 이름으로 보임)과 요청 경로를 정하고,
    // 지금 읽어 본 응답에서 찾은 필드를 더한다.
    await page.getByLabel('새 데이터').fill('plant');
    await page.getByRole('button', { name: '데이터 추가' }).click();
    await expect(page.getByRole('combobox', { name: /^원천/ })).toHaveValue(/.+/);
    await expect(page.getByRole('combobox', { name: /^원천/ }).locator('option:checked')).toHaveText('Mock Plant API');
    await page.getByLabel('요청 경로', { exact: true }).fill('/status');
    await page.getByRole('button', { name: '데이터 살펴보기' }).click();
    await page.getByRole('button', { name: 'status 더하기' }).click();
    await expect(page.getByRole('group', { name: 'status' })).toBeVisible();
    await page.getByLabel('단위').fill('state');
    // 그 필드의 상태 — 원천의 값마다: running은 ok, 그 밖은 off.
    await page.getByRole('combobox', { name: '상태' }).selectOption('map');
    await page.getByRole('button', { name: '값 추가' }).first().click();
    await page.getByLabel('값 1', { exact: true }).fill('running');
    await page.getByLabel('이름 1', { exact: true }).fill('ok');
    await page.getByLabel('그 밖의 값').first().fill('off');

    // 부품 하나 — 그 패널에서 제목을 비우고 읽는 데이터와 보일 필드를 정하면 편집기에 제자리로 그려진 부품이 원천의 값을 보인다.
    await page.getByRole('button', { name: '부품 추가' }).click();
    const part = page.getByTestId('designer-overlay-part-1');
    await expect(part).toBeVisible();
    const box = (await part.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole('heading', { name: '부품 part-1' })).toBeVisible();
    // An empty title: a text part shows the field it reads, not a fixed text.
    await page.getByLabel('제목', { exact: true }).fill('');
    await page.getByLabel('읽는 데이터').selectOption('plant');
    await page.getByRole('combobox', { name: '보일 필드(쉼표로)' }).fill('status');
    await expect(part).toContainText('running');

    await page.getByRole('button', { name: '저장', exact: true }).click();
    // board-crud.spec.ts와 동일한 패턴: 저장 PUT이 실제로 반영됐다는 신호(저장됨)를 기다린 뒤에만
    // reload한다 — 그렇지 않으면 저장 요청이 아직 진행 중일 때 reload가 그것을 취소할 수 있다.
    await expect(page.getByText('저장됨')).toBeVisible();
    await page.reload();

    // 저장된 보드: 데이터 읽기 · 필드의 뜻 · 부품이 읽는 것이 그대로 — 다시 열린 편집기가 같은 값을 그린다.
    await expect(page.getByTestId('designer-overlay-part-1')).toContainText('running');
    const at = new URL(page.url()).pathname.match(/^\/boards\/([^/]+)\/edit$/)![1];
    const { activeWorkspaceId: workspaceId } = await (await page.request.get('/api/workspaces/me')).json();
    const document = (await (await page.request.get(`/api/workspaces/${workspaceId}/boards/${at}`)).json()).document;
    expect(document).not.toHaveProperty('version');
    expect(document.data.plant).toMatchObject({ path: '/status', fields: { status: { unit: 'state', state: { running: 'ok', '*': 'off' } } } });
    expect(document.parts['part-1']).toEqual({ as: 'label', of: 'plant', show: 'status' });
  } finally {
    mockServer.close();
  }
});
