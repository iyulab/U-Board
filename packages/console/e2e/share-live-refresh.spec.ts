import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

// A shared board is left open on a screen. It must keep up with its source — a value that changes
// after the page loaded shows up on the next poll — and when its link expires while it is open, it
// must say so rather than keep showing the last values. The page's clock is driven forward to reach
// the next poll; the server's is real, so the test also waits out the server's reuse of a recent
// upstream read (10 s) before asking for the new value.
test('an open shared board follows its source and says when its link expires', async ({ page, browser }) => {
  test.setTimeout(60_000);
  let status = 'Running';
  const mockServer = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ value: [{ Status: status }] }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    const signup = await page.request.post('/api/auth/signup', {
      data: { email: 'e2e-share-live@test.com', password: 'p4ssword!', name: 'E2E Share Live' },
    });
    expect(signup.status()).toBe(201);
    const { workspaceId } = await signup.json();
    const connector = await (await page.request.post(`/api/workspaces/${workspaceId}/connectors`, {
      data: { name: 'Mock Plant API', baseUrl: mockBaseUrl, authType: 'none' },
    })).json();
    const board = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Pump House' } })).json();
    const saved = await page.request.put(`/api/workspaces/${workspaceId}/boards/${board.id}`, {
      data: {
        document: {
          kind: 'canvas', background: {}, connectors: [],
          nodes: [{
            id: 'pump-a', x: 40, y: 40, anchored: false,
            widget: {
              type: 'status',
              props: { data: { label: 'Pump A', level: 'neutral', value: '?' } },
              bindings: { 'data.value': { adapter: connector.id, ref: { path: '/plant', valuePath: '/value/0/Status' } } },
            },
          }],
        },
      },
    });
    expect(saved.ok()).toBe(true);
    // Long enough to load and poll once more before it expires.
    const expiresAt = new Date(Date.now() + 25_000).toISOString();
    const share = await page.request.post(`/api/workspaces/${workspaceId}/boards/${board.id}/share-tokens`, { data: { expiresAt } });
    expect(share.status()).toBe(201);
    const { token } = await share.json();

    const shareContext = await browser.newContext();
    const sharePage = await shareContext.newPage();
    await sharePage.clock.install();
    await sharePage.goto(`http://localhost:5176/?board=${board.id}&token=${token}`);
    await expect(sharePage.getByText('Running')).toBeVisible();

    status = 'Fault';
    await sharePage.waitForTimeout(10_500); // past the server's reuse of the read above
    const poll = sharePage.waitForResponse(res => res.url().includes(`/api/share/boards/${board.id}/resolve`));
    await sharePage.clock.fastForward(30_000);
    expect((await poll).status()).toBe(200);
    await expect(sharePage.getByText('Fault')).toBeVisible();

    // Let the link expire in real time, then reach the next poll.
    await sharePage.waitForTimeout(Math.max(0, Date.parse(expiresAt) - Date.now()) + 500);
    const expiredPoll = sharePage.waitForResponse(res => res.url().includes(`/api/share/boards/${board.id}/resolve`));
    await sharePage.clock.fastForward(30_000);
    expect((await expiredPoll).status()).toBe(410);
    await expect(sharePage.getByText('이 공유 링크는 만료되었습니다', { exact: false })).toBeVisible();
    await shareContext.close();
  } finally {
    mockServer.close();
  }
});
