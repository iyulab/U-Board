import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

// A board written in the board language's second version, shared: the server lays its grid out with the items its
// data has now — one part per pump — and the share viewer draws that picture, each part with its value; the console
// opens it from the same picture.
test('a board in the second version is drawn with one part per item of its data, shared and in the console', async ({ page, browser }) => {
  const mockServer = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ value: [{ id: 'P1', flow: 31 }, { id: 'P2', flow: 57 }, { id: 'P3', flow: 12 }] }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    const signup = await page.request.post('/api/auth/signup', {
      data: { email: 'e2e-share-v2@test.com', password: 'p4ssword!', name: 'E2E Share V2' },
    });
    expect(signup.status()).toBe(201);
    const { workspaceId } = await signup.json();

    const connector = await (await page.request.post(`/api/workspaces/${workspaceId}/connectors`, {
      data: { name: 'Mock Plant API', baseUrl: mockBaseUrl, authType: 'none' },
    })).json();
    const board = await (await page.request.post(`/api/workspaces/${workspaceId}/boards`, { data: { name: 'Pumps' } })).json();
    const saved = await page.request.put(`/api/workspaces/${workspaceId}/boards/${board.id}`, {
      data: {
        document: {
          version: 2,
          data: { pumps: { from: connector.id, path: '/pumps', list: '/value', key: 'id', fields: { flow: { label: 'Flow', unit: 'm³/h' } } } },
          parts: { pump: { as: 'stat', each: 'pumps', title: 'Pump {{key}}', show: 'flow' } },
          layout: { kind: 'grid', items: [['pump', 4]] },
        },
      },
    });
    expect(saved.ok()).toBe(true);
    const list = await (await page.request.get(`/api/workspaces/${workspaceId}/boards`)).json();
    expect(list.boards.find((b: { id: string }) => b.id === board.id).kind).toBe('grid');
    const { token } = await (await page.request.post(`/api/workspaces/${workspaceId}/boards/${board.id}/share-tokens`)).json();

    const shareContext = await browser.newContext();
    const sharePage = await shareContext.newPage();
    await sharePage.goto(`http://localhost:5176/?board=${board.id}&token=${token}`);
    for (const [pump, flow] of [['P1', '31'], ['P2', '57'], ['P3', '12']]) {
      await expect(sharePage.getByText(`Pump ${pump}`, { exact: true })).toBeVisible();
      await expect(sharePage.getByText(`Pump ${pump}`, { exact: true }).locator('xpath=ancestor::*[contains(., "m³/h")][1]')).toContainText(flow);
    }
    await shareContext.close();

    // The console draws it from the picture its own read of the board answers, laid out in the editor.
    await page.goto(`/boards/${board.id}/edit`);
    const shown = page.getByRole('region', { name: '편집기' });
    for (const [pump, flow] of [['P1', '31'], ['P2', '57'], ['P3', '12']]) {
      await expect(shown.getByText(`Pump ${pump}`, { exact: true })).toBeVisible();
      await expect(shown.getByText(`Pump ${pump}`, { exact: true }).locator('xpath=ancestor::*[contains(., "m³/h")][1]')).toContainText(flow);
    }
    await expect(page.getByText(/부품을 옮기고 크기를 바꾸거나 지울 수 있습니다/)).toBeVisible();
    await expect(page.getByRole('button', { name: '항목 추가' })).toHaveCount(0);
  } finally {
    mockServer.close();
  }
});
