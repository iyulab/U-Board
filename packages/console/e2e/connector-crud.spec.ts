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

    // 헤더 인증 커넥터를 만든 뒤 «비밀값을 다시 입력하지 않고» 이름만 수정한다.
    // 수정 폼은 비밀값 칸을 의도적으로 비워두므로 PUT 본문에 authValue가 빠지는데, 서버가 이를
    // "비밀값 없이 header 인증을 설정" 으로 읽으면 400이 난다 — 저장된 비밀값과 합쳐 판정해야 한다.
    // '헤더 이름' 라벨이 '이름' 을 포함하므로 여기서는 exact 매칭이 필요하다.
    await page.getByLabel('이름', { exact: true }).fill('Secured API');
    await page.getByLabel('Base URL').fill(mockBaseUrl);
    await page.getByLabel('인증 방식').selectOption('header');
    await page.getByLabel('헤더 이름').fill('X-API-Key');
    await page.getByLabel('값', { exact: true }).fill('e2e-secret');
    await page.getByRole('button', { name: '데이터소스 추가' }).click();
    await expect(page.getByText('Secured API')).toBeVisible();

    const securedRow = page.getByRole('listitem').filter({ hasText: 'Secured API' });
    await securedRow.getByRole('button', { name: '수정' }).click();
    await expect(page.getByLabel('값(변경 시에만 입력)')).toHaveValue('');
    await page.getByLabel('이름', { exact: true }).fill('Secured API Renamed');
    await page.getByRole('button', { name: '데이터소스 수정' }).click();
    await expect(page.getByText('Secured API Renamed')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

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
