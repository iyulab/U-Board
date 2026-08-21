import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

test('create a connector via the UI, then resolve a live value through the real HTTP round trip', async ({ page }) => {
  // 로컬 mock HTTP 서버 — 실제 외부 API 대신 baseUrl로 지정한다.
  const mockServer = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'running' }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    // 부트스트랩: 이 invocation의 첫(그리고 유일한) 가입 — owner + 기본 워크스페이스 자동생성
    await page.goto('/');
    await page.getByLabel('이메일').fill('e2e-connector-owner@test.com');
    await page.getByLabel('비밀번호').fill('p4ssword!');
    await page.getByLabel('이름').fill('E2E Connector Owner');
    await page.getByRole('button', { name: '가입' }).click();
    await expect(page.getByText('멤버')).toBeVisible();

    // 커넥터 생성(UI) — ConnectorsPage 자체가 실제 서버와 왕복해 동작하는지 검증
    await page.getByRole('link', { name: '커넥터' }).click();
    await page.getByLabel('이름').fill('Mock Plant API');
    await page.getByLabel('Base URL').fill(mockBaseUrl);
    await page.getByRole('button', { name: '데이터소스 추가' }).click();
    await expect(page.getByText('Mock Plant API')).toBeVisible();

    // 보드 편집기가 이 커넥터를 어댑터 목록 로딩에서 실패 없이 받아들이는지 확인
    // ConnectorsPage에는 대시보드로 돌아가는 네비게이션 링크가 없으므로 직접 이동한다.
    await page.goto('/boards');
    page.once('dialog', dialog => dialog.accept('Connector Board'));
    await page.getByRole('button', { name: '새 보드' }).click();
    await expect(page.getByText('Save')).toBeVisible();

    // resolve 왕복 자체는 UI에 노출되지 않으므로 같은 세션 쿠키로 직접 호출해 검증
    const session = await page.request.get('/workspaces/me').then(r => r.json());
    const workspaceId = session.activeWorkspaceId;
    const connectors = await page.request.get(`/workspaces/${workspaceId}/connectors`).then(r => r.json());
    const connectorId = connectors.connectors.find((c: { name: string }) => c.name === 'Mock Plant API').id;

    const resolveRes = await page.request.post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`, {
      data: { ref: { path: '/status', valuePath: 'status' } },
    });
    expect(resolveRes.ok()).toBe(true);
    expect(await resolveRes.json()).toEqual({ value: 'running', quality: 'live' });
  } finally {
    mockServer.close();
  }
});
