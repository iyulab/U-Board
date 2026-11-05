import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { toViewDocument, type Board } from '@iyulab/u-board/domain';
import { UBoardClient } from './client.js';
import { createServer } from './server.js';
import { APP_MIME, APP_URI, MAX_READS, builtPage } from './app.js';

const board: Board = {
  data: { line: { from: 's1', path: '/line', fields: { temp: { unit: '°C' } } } },
  parts: { a: { as: 'gauge', of: 'line', show: 'temp' } },
  layout: { kind: 'grid', items: ['a'] },
};

/** A U-Board server in miniature: one board, two sources, and every request it was sent. */
function fakeServer() {
  const requests: { method: string; path: string; headers: Record<string, string>; body?: unknown }[] = [];
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = init?.headers as Record<string, string>;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const method = init?.method ?? 'GET';
    requests.push({ method, path: url.pathname, headers, body });
    if (url.pathname === '/api/token') return json(200, { workspace: { id: 'w1', name: 'Plant' }, scope: 'read', role: 'viewer' });
    if (url.pathname === '/api/workspaces/w1/boards/b1') {
      return json(200, { id: 'b1', name: 'Line 1', document: board, picture: toViewDocument(board, { keysOf: () => [] }), revision: 4, updatedAt: 't' });
    }
    if (url.pathname === '/api/workspaces/w1/connectors') {
      return json(200, {
        connectors: [
          { id: 's1', name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer', attribution: { text: 'Plant', url: 'https://plant.example.com' } },
          { id: 's2', name: 'Example', type: 'static', answers: {}, sample: true },
        ],
      });
    }
    if (url.pathname === '/api/workspaces/w1/connectors/s1/resolve') {
      if (body.ref.path === '/down') return json(200, { quality: 'disconnected', reason: 'transport', message: 'connect ECONNREFUSED' });
      return json(200, { quality: 'live', value: { temp: 61.5, path: body.ref.path }, observedAt: '2026-11-05T09:00:00.000Z' });
    }
    return json(404, { code: 'NOT_FOUND' });
  }) as typeof fetch;
  return { requests, fetchImpl };
}

async function connected(options: { app: boolean }) {
  const server = fakeServer();
  const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), undefined, { ...options, appPage: async () => '<!doctype html><title>board</title>' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([mcp.connect(b), client.connect(a)]);
  return { client, server };
}

describe('the board app', () => {
  it('is not offered unless asked for', async () => {
    const { client } = await connected({ app: false });
    const names = (await client.listTools()).tools.map(t => t.name);
    expect(names).not.toContain('show_board');
    expect(names).not.toContain('read_sources');
    // No page either: without the app the server has no resources at all.
    await expect(client.listResources()).rejects.toThrow(/Method not found/);
  });

  it('names its page on show_board, and keeps read_sources to the page', async () => {
    const { client } = await connected({ app: true });
    const { tools } = await client.listTools();
    const show = tools.find(t => t.name === 'show_board')!;
    const read = tools.find(t => t.name === 'read_sources')!;
    expect(show._meta).toEqual({ ui: { resourceUri: APP_URI } });
    expect(read._meta).toEqual({ ui: { visibility: ['app'] } });
    // Both only read: a host need not ask before showing a board.
    expect(show.annotations?.readOnlyHint).toBe(true);
    expect(read.annotations?.readOnlyHint).toBe(true);
  });

  it('serves the page as an app resource', async () => {
    const { client } = await connected({ app: true });
    const { resources } = await client.listResources();
    expect(resources.map(r => r.uri)).toEqual([APP_URI]);
    const read = await client.readResource({ uri: APP_URI });
    expect(read.contents).toEqual([{ uri: APP_URI, mimeType: APP_MIME, text: '<!doctype html><title>board</title>' }]);
  });

  it('shows a board: the board as stored, and the sources it reads through', async () => {
    const { client } = await connected({ app: true });
    const result = (await client.callTool({ name: 'show_board', arguments: { board: 'b1' } })) as { content: { text: string }[]; structuredContent: any };
    expect(JSON.parse(result.content[0].text)).toEqual({ board: 'b1', name: 'Line 1', revision: 4, kind: 'grid', parts: 1 });
    expect(result.structuredContent.board).toEqual(board);
    // A static source that holds example data says so; a source's attribution travels with it.
    expect(result.structuredContent.adapters).toEqual([{ id: 's1', attribution: { text: 'Plant', url: 'https://plant.example.com' } }, { id: 's2', sample: true }]);
  });

  it('answers a board that is not there as the server does', async () => {
    const { client } = await connected({ app: true });
    const result = (await client.callTool({ name: 'show_board', arguments: { board: 'nope' } })) as { content: { text: string }[]; isError?: boolean };
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('reads values through the server’s own resolve route, with the token it was started with', async () => {
    const { client, server } = await connected({ app: true });
    const result = (await client.callTool({
      name: 'read_sources',
      arguments: {
        reads: [
          { source: 's1', ref: { path: '/line' } },
          // A reference with all that a binding can hold travels whole.
          { source: 's1', ref: { path: '/other', valuePath: '/temp', timeZone: 'Asia/Seoul', observedAtPath: '/at', maxAgeSeconds: 600, item: { list: '/items', where: { id: 'P-101' } } } },
        ],
      },
    })) as unknown as { structuredContent: { answers: any[] } };
    expect(result.structuredContent.answers.map(a => a.value.path)).toEqual(['/line', '/other']);
    const resolves = server.requests.filter(r => r.path === '/api/workspaces/w1/connectors/s1/resolve');
    // Nothing is fetched from here: the reads went to the server, in the form a viewer sends them.
    expect(resolves.map(r => r.body)).toEqual([
      { ref: { path: '/line' } },
      { ref: { path: '/other', valuePath: '/temp', timeZone: 'Asia/Seoul', observedAtPath: '/at', maxAgeSeconds: 600, item: { list: '/items', where: { id: 'P-101' } } } },
    ]);
    expect(new Set(resolves.map(r => r.headers.Authorization))).toEqual(new Set(['Bearer ubt_test']));
  });

  it('answers a read that cannot be made as a disconnected part, not as a failed call', async () => {
    const { client } = await connected({ app: true });
    const result = (await client.callTool({
      name: 'read_sources',
      arguments: { reads: [{ source: 'unknown', ref: { path: '/line' } }, { source: 's1', ref: { path: '/down' } }, { source: 's1', ref: { path: '/line' } }] },
    })) as unknown as { structuredContent: { answers: any[] }; isError?: boolean };
    expect(result.isError).toBeFalsy();
    const [unknown, down, live] = result.structuredContent.answers;
    expect(unknown).toMatchObject({ quality: 'disconnected', reason: 'address' });
    expect(down).toMatchObject({ quality: 'disconnected', reason: 'transport', message: 'connect ECONNREFUSED' });
    expect(live).toMatchObject({ quality: 'live' });
  });

  it('refuses a call with no reads or too many', async () => {
    const { client } = await connected({ app: true });
    const none = (await client.callTool({ name: 'read_sources', arguments: { reads: [] } })) as { isError?: boolean };
    expect(none.isError).toBe(true);
    const many = (await client.callTool({ name: 'read_sources', arguments: { reads: Array.from({ length: MAX_READS + 1 }, () => ({ source: 's1', ref: { path: '/line' } })) } })) as { isError?: boolean };
    expect(many.isError).toBe(true);
  });

  it('is not offered on a board kept in a file: it has no data sources to read through', () => {
    // A store that is not a whole workspace — one board, no list of boards or sources.
    const oneBoard = { soleBoard: 'b1', getBoard: async () => ({}), putDocument: async () => ({}), patchDocument: async () => ({}) };
    expect(() => createServer(oneBoard as never, undefined, { app: true })).toThrow(/UBOARD_URL/);
  });

  // The host serves the page from a sandbox that fetches nothing: whatever the page needs is in it. Checked on the built page, when there is one.
  it.skipIf(!existsSync(new URL('../dist/app/board.html', import.meta.url)))('is one file that points at nothing outside itself', async () => {
    const page = await builtPage();
    expect(page).toContain('<div id="root">');
    expect(page).not.toMatch(/<script[^>]*\ssrc=/);
    expect(page).not.toMatch(/<link[^>]*rel="(stylesheet|modulepreload)"/);
    expect(page).not.toMatch(/(?:src|href)="\.\/assets\//);
  });
});
