import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

// A board with many bindings must open in a fixed number of requests: the public `/api/share/*` surface
// sits behind a per-IP edge rate limit, so a viewer that sent one request per binding could not load
// a large board in full. Here: 12 bindings on one collection URL → per board load, one board fetch,
// one batch resolve carrying all 12, and one upstream call.
test('a shared board with many bindings loads in one batch request', async ({ page, browser }) => {
  const BINDINGS = 12;
  let upstreamCalls = 0;
  const mockServer = createServer((_req, res) => {
    upstreamCalls++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ value: Array.from({ length: BINDINGS }, (_, i) => ({ Status: i % 2 ? 'Fault' : 'Running' })) }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    const signup = await page.request.post('/api/auth/signup', {
      data: { email: 'e2e-share-batch@test.com', password: 'p4ssword!', name: 'E2E Share Batch' },
    });
    expect(signup.status()).toBe(201);
    const { workspaceId } = await signup.json();

    const connector = await (await page.request.post(`/api/workspaces/${workspaceId}/connectors`, {
      data: { name: 'Mock Plant API', baseUrl: mockBaseUrl, authType: 'none' },
    })).json();
    const board = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Many Bindings' } })).json();
    // A part per asset, each a field of the one read — and one more past the end of the collection: the source
    // answers, but not with what that field points at — the viewer must say so rather than show an empty part as fine.
    const fields: Record<string, { at: string; label: string }> = {};
    const parts: Record<string, { as: string; of: string; show: string[] }> = {};
    const place: Record<string, [number, number, number, number]> = {};
    for (let i = 0; i <= BINDINGS; i++) {
      const id = i < BINDINGS ? `n${i}` : 'missing';
      fields[id] = { at: `/value/${i}/Status`, label: i < BINDINGS ? `Asset ${i}` : 'Missing' };
      parts[id] = { as: 'stat-list', of: 'assets', show: [id] };
      place[id] = i < BINDINGS ? [40 + (i % 4) * 180, 40 + Math.floor(i / 4) * 120, 160, 100] : [40, 420, 160, 100];
    }
    const saved = await page.request.put(`/api/workspaces/${workspaceId}/boards/${board.id}`, {
      data: { document: { data: { assets: { from: connector.id, path: '/assets', fields } }, parts, layout: { kind: 'canvas', size: [800, 600], place } } },
    });
    expect(saved.ok()).toBe(true);
    const { token } = await (await page.request.post(`/api/workspaces/${workspaceId}/boards/${board.id}/share-tokens`)).json();

    const shareContext = await browser.newContext();
    const sharePage = await shareContext.newPage();
    const shareRequests: string[] = [];
    sharePage.on('request', req => {
      const url = new URL(req.url());
      if (url.pathname.startsWith('/api/share/')) shareRequests.push(`${req.method()} ${url.pathname}`);
    });
    const batchResponse = sharePage.waitForResponse(res => res.url().includes(`/api/share/boards/${board.id}/resolve`));
    await sharePage.goto(`http://localhost:5176/?board=${board.id}&token=${token}`);
    const batch = await batchResponse;
    expect(batch.status()).toBe(200);
    const { results } = await batch.json();
    expect(results).toHaveLength(BINDINGS + 1);
    expect(results.slice(0, BINDINGS).every((r: { quality: string }) => r.quality === 'live')).toBe(true);
    expect(results[1]).toEqual({ value: 'Fault', quality: 'live', observedAt: expect.any(String) });
    expect(results[BINDINGS]).toEqual({ quality: 'disconnected', reason: 'address' });
    await expect(sharePage.getByTestId('canvas')).toBeVisible();
    // The values are drawn, not only fetched.
    await expect(sharePage.getByRole('listitem').filter({ has: sharePage.getByText('Asset 1', { exact: true }) })).toContainText('Fault');
    await expect(sharePage.locator('[title="연결 끊김 — 값을 받지 못함 (바인딩한 값이 원천에 없음)"]')).toHaveCount(1);

    // One resolve request for the board on screen, whatever the binding count. The dev server renders
    // under React StrictMode, which runs the load effect twice; the first run is cancelled, so its
    // board request may go out but nothing is resolved for it.
    const loads = shareRequests.filter(r => r === `GET /api/share/boards/${board.id}`).length;
    const resolves = shareRequests.filter(r => r === `POST /api/share/boards/${board.id}/resolve`).length;
    expect(shareRequests).toHaveLength(loads + resolves);
    expect(loads).toBeGreaterThanOrEqual(1);
    expect(loads).toBeLessThanOrEqual(2);
    expect(resolves).toBe(1);
    expect(upstreamCalls).toBeLessThanOrEqual(resolves);
    await shareContext.close();
  } finally {
    mockServer.close();
  }
});
