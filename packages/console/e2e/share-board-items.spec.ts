import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

// A board shared: the server lays its grid out with the items its
// data has now — one part per pump — and the share viewer draws that picture, each part with its value; the console
// draws it as any host does, through the workspace's data sources, and sets its data in the editor's data panel.
test('a board is drawn with one part per item of its data, shared and in the console', async ({ page, browser }) => {
  const mockServer = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ value: [{ id: 'P1', flow: 31 }, { id: 'P2', flow: 57 }, { id: 'P3', flow: 12 }] }));
  });
  await new Promise<void>(resolve => mockServer.listen(0, resolve));
  const mockBaseUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;

  try {
    const signup = await page.request.post('/api/auth/signup', {
      data: { email: 'e2e-share-items@test.com', password: 'p4ssword!', name: 'E2E Share Items' },
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

    // The console draws it through its own read of the data, laid out in the editor.
    await page.goto(`/boards/${board.id}/edit`);
    const shown = page.getByRole('region', { name: '편집기' });
    for (const [pump, flow] of [['P1', '31'], ['P2', '57'], ['P3', '12']]) {
      await expect(shown.getByText(`Pump ${pump}`, { exact: true })).toBeVisible();
      await expect(shown.getByText(`Pump ${pump}`, { exact: true }).locator('xpath=ancestor::*[contains(., "m³/h")][1]')).toContainText(flow);
    }
    await expect(page.getByText(/부품을 옮기고 크기를 바꾸거나 지울 수 있습니다/)).toBeVisible();
    await expect(page.getByRole('button', { name: '항목 추가' })).toHaveCount(0);

    // With nothing selected, the data panel: the read's source by its name, a look at what it answers, a field found
    // there added and given a name, and the board saved with them.
    await expect(page.getByRole('combobox', { name: /^원천/ })).toHaveValue(connector.id);
    await expect(page.getByRole('combobox', { name: /^원천/ }).locator('option:checked')).toHaveText('Mock Plant API');
    await page.getByRole('button', { name: '데이터 살펴보기' }).click();
    await page.getByRole('button', { name: 'id 더하기' }).click();
    await page.getByRole('group', { name: 'id' }).getByLabel('이름').fill('Pump');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByText('저장됨')).toBeVisible();
    const withField = (await (await page.request.get(`/api/workspaces/${workspaceId}/boards/${board.id}`)).json()).document;
    expect(withField.data.pumps.fields).toEqual({ flow: { label: 'Flow', unit: 'm³/h' }, id: { label: 'Pump' } });
  } finally {
    mockServer.close();
  }
});
