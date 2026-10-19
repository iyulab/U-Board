import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { applyJsonPatch, TRIGGER_ACTIONS, TRIGGER_EVENTS, type ViewDocument } from '@iyulab/u-board/domain';
import { UBoardClient } from './client.js';
import { createServer } from './server.js';

/** A U-Board server in miniature: one workspace, its boards, and every request it was sent. */
function fakeServer() {
  const boards = new Map<string, { name: string; document: ViewDocument; revision: number }>([
    ['b1', { name: 'Line 1', revision: 4, document: { kind: 'grid', items: [{ id: 'a', widget: { type: 'gauge' } }] } }],
  ]);
  const requests: { method: string; path: string; headers: Record<string, string>; body?: unknown }[] = [];
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = init?.headers as Record<string, string>;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const method = init?.method ?? 'GET';
    requests.push({ method, path: url.pathname, headers, body });
    if (headers.Authorization !== 'Bearer ubt_test') return json(401, { code: 'UNAUTHENTICATED' });
    if (url.pathname === '/api/token') return json(200, { workspace: { id: 'w1', name: 'Plant' }, scope: 'write', role: 'owner' });
    if (url.pathname === '/api/workspaces/w1/boards' && method === 'GET') {
      return json(200, { boards: [...boards].map(([id, b]) => ({ id, name: b.name, kind: b.document.kind, updatedAt: 't' })) });
    }
    if (url.pathname === '/api/workspaces/w1/connectors' && method === 'GET') {
      return json(200, { connectors: [{ id: 's1', name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer' }] });
    }
    if (url.pathname === '/api/workspaces/w1/connectors' && method === 'POST') {
      return json(201, { id: 's2', name: body.name, baseUrl: body.baseUrl, authType: body.authType });
    }
    if (url.pathname === '/api/workspaces/w1/connectors/s1/resolve') {
      if (body.ref.path === '/down') return json(200, { quality: 'disconnected', reason: 'transport', message: 'connect ECONNREFUSED' });
      if (body.ref.path === '/nowhere') return json(200, { quality: 'disconnected', reason: 'address' });
      return json(200, { quality: 'live', value: { items: [{ id: 'P-101', temp: 61.5 }, { id: 'P-102', temp: 58 }] } });
    }
    if (url.pathname === '/api/workspaces/w1/boards' && method === 'POST') {
      boards.set('b2', { name: body.name, revision: 1, document: body.kind === 'grid' ? { kind: 'grid', items: [] } : { kind: 'canvas', background: {}, nodes: [], connectors: [] } });
      return json(201, { id: 'b2', revision: 1 });
    }
    if (url.pathname === '/api/share/boards/b1/state') {
      return json(200, { evaluatedAt: '2026-10-16T09:00:00.000Z', revision: 4, parts: { a: { state: 'fault', quality: 'live' } } });
    }
    const id = url.pathname.split('/').pop()!;
    const board = boards.get(id);
    if (!board) return json(404, { code: 'NOT_FOUND' });
    const ifMatch = headers['If-Match'];
    if (ifMatch && ifMatch !== `"${board.revision}"`) return json(412, { code: 'BOARD_CHANGED', revision: board.revision });
    if (method === 'GET') return json(200, { id, name: board.name, document: board.document, revision: board.revision, updatedAt: 't' });
    if (method === 'DELETE') {
      boards.delete(id);
      return new Response(null, { status: 204 });
    }
    board.document = method === 'PATCH' ? applyJsonPatch(board.document, body) : body.document;
    board.revision += 1;
    return json(200, { id, revision: board.revision, advice: [] });
  }) as typeof fetch;

  return { boards, requests, fetchImpl };
}

let server: ReturnType<typeof fakeServer>;
let client: Client;

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  const text = result.content[0].text;
  let value: unknown = text;
  try {
    value = JSON.parse(text);
  } catch {
    // the rules are text
  }
  return { value: value as any, isError: result.isError ?? false };
}

beforeEach(async () => {
  server = fakeServer();
  const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0' });
  await Promise.all([mcp.connect(serverTransport), client.connect(clientTransport)]);
});

describe('u-board-mcp', () => {
  it('offers few tools, each with a strict input', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([
      'board_state', 'create_board', 'create_source', 'delete_board', 'describe', 'edit_board', 'get_board', 'list_boards', 'list_sources', 'patch_board', 'sample_source', 'validate',
    ]);
    for (const tool of tools) expect(tool.inputSchema.additionalProperties, tool.name).toBe(false);
  });

  it('writes no open object as an empty schema — a widely used tool-call parser rewrites the values under one', async () => {
    const { tools } = await client.listTools();
    const empty: string[] = [];
    const walk = (node: unknown, at: string) => {
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (key === 'additionalProperties' && value && typeof value === 'object' && Object.keys(value).length === 0) empty.push(at);
        walk(value, `${at}.${key}`);
      }
    };
    for (const tool of tools) walk(tool.inputSchema, tool.name);
    expect(empty).toEqual([]);
  });

  it('describes its topics, the rules, a part of the schema and a widget', async () => {
    expect((await call('describe')).value.topics.rules).toContain('Read this first');
    expect((await call('describe', { topic: 'rules' })).value).toContain('## JSON Patch');
    expect((await call('describe', { topic: 'elements' })).value).toContain('graphic contrast of 3:1');
    expect((await call('describe', { topic: 'canvas' })).value).toContain('top-left of its box');
    expect((await call('describe', { topic: 'components' })).value).toContain('"<instance id>/<part id>"');
    expect((await call('describe', { topic: 'schema', pointer: '/$defs/instance' })).value.required).toEqual(['id', 'component', 'x', 'y', 'anchored']);
    expect((await call('describe', { topic: 'schema', pointer: '/$defs/elementDefinition' })).value.required).toEqual(['render']);
    const lost = await call('describe', { topic: 'schema', pointer: '/properties' });
    expect(lost.isError).toBe(true);
    expect(lost.value.error).toContain('/$defs/canvasView');
    expect((await call('describe', { topic: 'widget:gauge' })).value.type).toBe('gauge');
    const unknown = await call('describe', { topic: 'widget:nope' });
    expect(unknown.isError).toBe(true);
  });

  it('teaches every trigger event and action the format has, and how an element raises one', async () => {
    const { value: rules } = await call('describe', { topic: 'rules' });
    for (const name of [...TRIGGER_EVENTS, ...TRIGGER_ACTIONS]) expect(rules, name).toContain(`"${name}"`);
    expect(rules).toContain('data-ub-event=');
    expect(rules).toContain('ub.emit(');
  });

  it('keeps every topic within its budget — the answer an assistant reads before it can write', async () => {
    const { value: topics } = await call('describe');
    expect(JSON.stringify(topics).length).toBeLessThan(1200);
    for (const topic of ['rules', 'canvas', 'data', 'elements', 'components']) {
      expect((await call('describe', { topic })).value.length, topic).toBeLessThan(4000);
    }
    expect(JSON.stringify((await call('describe', { topic: 'widgets' })).value).length).toBeLessThan(4000);
  });

  it('finds widgets by what they should show, and gives examples a board places as they are', async () => {
    const { value: found } = await call('describe', { topic: 'widgets', query: 'list of messages' });
    expect(Object.values(found.matches).flat().some(line => String(line).startsWith('list —'))).toBe(true);
    const { value: list } = await call('describe', { topic: 'widget:list' });
    expect(list.examples[0].widget.type).toBe('list');
    expect(list.examples[0].widget.props).toHaveProperty('data');
    expect(list.examples[0].widget.props).not.toHaveProperty('widget');
    const none = await call('describe', { topic: 'widgets', query: 'zzzz' });
    expect(none.value.hint).toContain('without a query');
  });

  it('looks at a board through a looker — a picture and what went wrong, never the token', async () => {
    const asked: unknown[] = [];
    const looker = {
      look: async (request: unknown, document: unknown) => {
        asked.push({ request, kind: (document as { kind: string }).kind });
        return { image: 'iVBORw==', report: { scale: 0.5, picture: { width: 1600, height: 900 }, problems: [{ path: '/items/0', message: 'cut off' }], quality: {}, console: [] } };
      },
    };
    const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
    const [a, b] = InMemoryTransport.createLinkedPair();
    const viewer = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(b), viewer.connect(a)]);
    const result = (await viewer.callTool({ name: 'look', arguments: { board: 'b1', focus: '/items/0' } })) as { content: Array<{ type: string; data?: string; text?: string }> };
    expect(result.content[0]).toEqual({ type: 'image', data: 'iVBORw==', mimeType: 'image/png' });
    expect(JSON.parse(result.content[1].text!)).toMatchObject({ revision: 4, problems: [{ path: '/items/0', message: 'cut off' }] });
    expect(asked).toEqual([{ request: { board: 'b1', focus: '/items/0', width: 1600, height: 900 }, kind: 'grid' }]);
  });

  it('answers with the picture what saving advised, so a clean picture never reads as a board without faults', async () => {
    const overlapping = { x: 0, y: 0, anchored: false, widget: { type: 'gauge' } };
    server.boards.set('b3', {
      name: 'Crowded',
      revision: 2,
      document: { kind: 'canvas', background: {}, connectors: [], nodes: [{ id: 'n1', ...overlapping }, { id: 'n2', ...overlapping }, { id: 'n3', ...overlapping, x: 900 }] },
    });
    const looker = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: [], quality: {}, console: [] } }) };
    const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
    const [a, b] = InMemoryTransport.createLinkedPair();
    const viewer = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(b), viewer.connect(a)]);
    const look = async (args: Record<string, unknown>) =>
      JSON.parse(((await viewer.callTool({ name: 'look', arguments: { board: 'b3', ...args } })) as { content: Array<{ text?: string }> }).content[1].text!);

    const whole = await look({});
    expect(whole.problems).toEqual([]);
    expect(whole.advice).toEqual([expect.objectContaining({ path: '/nodes/0', message: expect.stringContaining('overlaps node "n2" (/nodes/1)') })]);
    // Up close, only what concerns that part — named either way.
    expect((await look({ focus: '/nodes/1' })).advice).toHaveLength(1);
    expect((await look({ focus: '/nodes/2' })).advice).toEqual([]);
    // What is left, said in one line a writer cannot read past.
    expect(whole.status).toBe('not done — 1 piece of advice to fix');
    expect((await look({ focus: '/nodes/2' })).status).toBe('nothing to fix on this part — look at the whole board before finishing');
  });

  it('up close on an instance, answers what is said of its component and of the instance itself', async () => {
    const gauge = (id: string, x: number) => ({ id, x, y: 0, widget: { type: 'gauge' } });
    server.boards.set('b4', {
      name: 'Cards',
      revision: 2,
      document: {
        kind: 'canvas', background: {}, nodes: [], connectors: [],
        components: { card: { nodes: [gauge('a', 0), gauge('b', 50)] }, lamp: { nodes: [gauge('l', 0)] } },
        instances: [
          { id: 'p1', component: 'card', x: 0, y: 0, anchored: false },
          { id: 'p2', component: 'card', x: 1000, y: 0, anchored: false },
          { id: 'q', component: 'lamp', x: 1100, y: 0, anchored: false },
        ],
      },
    });
    const looker = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: [], quality: {}, console: [] } }) };
    const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
    const [a, b] = InMemoryTransport.createLinkedPair();
    const viewer = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(b), viewer.connect(a)]);
    const look = async (focus: string) =>
      JSON.parse(((await viewer.callTool({ name: 'look', arguments: { board: 'b4', focus } })) as { content: Array<{ text?: string }> }).content[1].text!).advice.map((x: { path: string }) => x.path);

    // The card's own overlap holds for both instances; both of p2's parts also run into q.
    expect(await look('/instances/0')).toEqual(['/components/card/nodes/0']);
    expect(await look('/instances/1')).toEqual(['/components/card/nodes/0', '/instances/1', '/instances/1']);
    expect(await look('/instances/2')).toEqual(['/instances/1', '/instances/1']);
  });

  it('counts every piece of advice in the status, folded ones too, and up close loses none of the part’s to the fold', async () => {
    const node = (i: number) => ({ id: `n${i}`, x: i * 10, y: 0, anchored: false, widget: { type: 'gauge' } });
    // Nine nodes over one another: 36 overlapping pairs, more than saving lists one by one.
    server.boards.set('b5', { name: 'Pile', revision: 1, document: { kind: 'canvas', background: {}, connectors: [], nodes: Array.from({ length: 9 }, (_, i) => node(i)) } });
    const looker = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: [], quality: {}, console: [] } }) };
    const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
    const [a, b] = InMemoryTransport.createLinkedPair();
    const viewer = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(b), viewer.connect(a)]);
    const look = async (args: Record<string, unknown>) =>
      JSON.parse(((await viewer.callTool({ name: 'look', arguments: { board: 'b5', ...args } })) as { content: Array<{ text?: string }> }).content[1].text!);

    const whole = await look({});
    expect(whole.advice.at(-1)).toMatchObject({ path: '', count: 6 });
    expect(whole.status).toBe('not done — 36 pieces of advice to fix');
    // The last node overlaps all eight others — most of those findings are past the fold on the whole board.
    const last = await look({ focus: '/nodes/8' });
    expect(last.advice).toHaveLength(8);
    expect(last.status).toBe('not done — 8 pieces of advice to fix on this part');
  });

  it('up close answers only the part’s problems, and counts only those in its status', async () => {
    const node = (i: number) => ({ id: `n${i}`, x: i * 300, y: 0, anchored: false, widget: { type: 'gauge' } });
    server.boards.set('b6', { name: 'Apart', revision: 1, document: { kind: 'canvas', background: {}, connectors: [], nodes: [node(0), node(1), node(2)] } });
    const drawn = [
      { path: '/nodes/0', message: 'its element draws up to 11 px past its box' },
      { path: '/nodes/2', message: 'its element draws up to 50 px past its box' },
      { path: '/nodes/0', message: 'its text "!" reads at 1.0:1' },
    ];
    const looker = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: drawn, quality: {}, console: [] } }) };
    const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
    const [a, b] = InMemoryTransport.createLinkedPair();
    const viewer = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(b), viewer.connect(a)]);
    const look = async (args: Record<string, unknown>) =>
      JSON.parse(((await viewer.callTool({ name: 'look', arguments: { board: 'b6', ...args } })) as { content: Array<{ text?: string }> }).content[1].text!);

    expect((await look({})).status).toBe('not done — 3 problems to fix');
    const up = await look({ focus: '/nodes/2' });
    expect(up.problems).toEqual([drawn[1]]);
    expect(up.status).toBe('not done — 1 problem to fix on this part');
    expect((await look({ focus: '/nodes/1' })).status).toBe('nothing to fix on this part — look at the whole board before finishing');
  });

  it('says a clean board is done', async () => {
    server.boards.set('b4', { name: 'Clean', revision: 1, document: { kind: 'grid', items: [] } });
    const looker = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: [{ message: 'x' }, { message: 'y' }], quality: {}, console: [] } }) };
    const clean = { look: async () => ({ image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems: [], quality: {}, console: [] } }) };
    const status = async (l: typeof looker) => {
      const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), l);
      const [a, b] = InMemoryTransport.createLinkedPair();
      const viewer = new Client({ name: 'test', version: '0' });
      await Promise.all([mcp.connect(b), viewer.connect(a)]);
      return JSON.parse(((await viewer.callTool({ name: 'look', arguments: { board: 'b4' } })) as { content: Array<{ text?: string }> }).content[1].text!).status;
    };
    expect(await status(looker)).toBe('not done — 2 problems to fix');
    expect(await status(clean)).toBe('done — nothing to fix');
  });

  it('says when an operation or a document is wrapped in its own first key — the commonest shape mistake', async () => {
    const wrappedOp = (await client.callTool({ name: 'patch_board', arguments: { board: 'b1', patch: [{ op: { op: 'add', path: '/x', value: 1 } }] } })) as { content: { text: string }[]; isError?: boolean };
    expect(wrappedOp.isError).toBe(true);
    expect(wrappedOp.content[0].text).toContain('wrapped in "op"');
    const wrappedDoc = (await client.callTool({ name: 'validate', arguments: { document: { kind: { kind: 'canvas', background: {}, nodes: [], connectors: [] } } } })) as { content: { text: string }[]; isError?: boolean };
    expect(wrappedDoc.isError).toBe(true);
    expect(wrappedDoc.content[0].text).toContain('wrapped in "kind"');
    expect(server.requests.some(r => r.method !== 'GET')).toBe(false);
  });

  it('answers an unknown id with where to find the ids', async () => {
    const { value, isError } = await call('get_board', { board: 'nope' });
    expect(isError).toBe(true);
    expect(value).toMatchObject({ status: 404, code: 'NOT_FOUND', hint: expect.stringContaining('list_boards') });
  });

  it('lists the boards of the token’s workspace, reading the workspace from the token once', async () => {
    const { value } = await call('list_boards');
    expect(value).toEqual({ workspace: { id: 'w1', name: 'Plant' }, boards: [{ id: 'b1', name: 'Line 1', kind: 'grid', updatedAt: 't' }] });
    await call('list_boards');
    expect(server.requests.filter(r => r.path === '/api/token')).toHaveLength(1);
  });

  it('answers what a board shows now — each part’s state and quality — with the server’s own answer', async () => {
    const { value, isError } = await call('board_state', { board: 'b1' });
    expect(isError).toBe(false);
    expect(value).toEqual({ evaluatedAt: '2026-10-16T09:00:00.000Z', revision: 4, parts: { a: { state: 'fault', quality: 'live' } } });
    expect(server.requests.at(-1)).toMatchObject({ method: 'GET', path: '/api/share/boards/b1/state' });
  });

  it('reads one part of a board by JSON Pointer', async () => {
    const { value } = await call('get_board', { board: 'b1', pointer: '/items/0/widget' });
    expect(value).toEqual({ id: 'b1', name: 'Line 1', revision: 4, kind: 'grid', pointer: '/items/0/widget', value: { type: 'gauge' } });
  });

  it('patches a board on its revision, as a JSON Patch', async () => {
    const { value } = await call('patch_board', { board: 'b1', revision: 4, patch: [{ op: 'add', path: '/items/0/span', value: 6 }] });
    expect(value).toEqual({ id: 'b1', revision: 5, advice: [] });
    const sent = server.requests.find(r => r.method === 'PATCH')!;
    expect(sent.headers['Content-Type']).toBe('application/json-patch+json');
    expect(sent.headers['If-Match']).toBe('"4"');
    expect(server.boards.get('b1')!.document).toEqual({ kind: 'grid', items: [{ id: 'a', span: 6, widget: { type: 'gauge' } }] });
  });

  it('says what to do when the board was saved since', async () => {
    const { value, isError } = await call('patch_board', { board: 'b1', revision: 2, patch: [{ op: 'remove', path: '/items/0' }] });
    expect(isError).toBe(true);
    expect(value).toMatchObject({ status: 412, code: 'BOARD_CHANGED', revision: 4, hint: expect.stringContaining('get_board again') });
  });

  it('makes a board with a first document', async () => {
    const document = { kind: 'grid', items: [{ id: 'x', widget: { type: 'metric' } }] };
    const { value } = await call('create_board', { name: 'New', kind: 'grid', document });
    expect(value).toEqual({ id: 'b2', revision: 2, advice: [] });
    expect(server.boards.get('b2')!.document).toEqual(document);
  });

  it('makes no board when its first document is refused — a retry leaves no empty boards behind', async () => {
    const before = server.boards.size;
    const { value, isError } = await call('create_board', { name: 'New', kind: 'canvas', document: { kind: 'canvas', background: {}, nodes: {}, connectors: [] } });
    expect(isError).toBe(true);
    expect(value).toMatchObject({ code: 'INVALID_DOCUMENT', message: expect.stringContaining('no board was made'), issues: [{ path: '/nodes', message: 'expected an array — got an object {}' }] });
    expect(server.boards.size).toBe(before);
    expect(server.requests.some(r => r.method === 'POST')).toBe(false);
  });

  it('deletes a board, says so as a destructive tool, and answers not found for one already gone', async () => {
    const { tools } = await client.listTools();
    expect(tools.find(t => t.name === 'delete_board')!.annotations).toMatchObject({ destructiveHint: true });
    expect((await call('delete_board', { board: 'b1' })).value).toEqual({ deleted: 'b1' });
    expect(server.boards.has('b1')).toBe(false);
    const again = await call('delete_board', { board: 'b1' });
    expect(again.isError).toBe(true);
    expect(again.value).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('validates a document, or a board with a patch, without saving', async () => {
    const bad = await call('validate', { document: { kind: 'grid', items: [{ id: 'a', widget: { type: 'element:pump' } }] } });
    expect(bad.value.valid).toBe(false);
    expect(bad.value.issues[0]).toEqual({ path: '/items/0/widget/type', message: 'no element "pump" is defined — add it under /elements' });
    const dryRun = await call('validate', { board: 'b1', patch: [{ op: 'add', path: '/elements', value: { dot: { render: 'template', template: '<b/>' } } }] });
    // It says the change is not saved, and on which revision to send it.
    expect(dryRun.value).toEqual({
      valid: true,
      issues: [],
      advice: [{ path: '/elements/dot', message: expect.any(String) }],
      next: expect.stringMatching(/^nothing is saved yet — send this patch with patch_board, on revision \d+$/),
    });
    expect(server.requests.some(r => r.method !== 'GET')).toBe(false);
  });

  it('validates as the server saves: a field the format does not have, or a colour a canvas cannot read, is an issue', async () => {
    const document = { kind: 'canvas', background: {}, nodes: [], connectors: [], decorations: [{ id: 'z', type: 'rect', x: 0, y: 0, width: 9, height: 9, fill: 'var(--zone)', rotation: 45 }] };
    const { value } = await call('validate', { document });
    expect(value.issues.map((issue: { path: string }) => issue.path)).toEqual(['/decorations/0/rotation', '/decorations/0/fill']);
  });

  it('lists the data sources, never a credential', async () => {
    expect((await call('list_sources')).value).toEqual({ sources: [{ id: 's1', name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer' }] });
  });

  it('answers what a source’s response looks like, not the response', async () => {
    const { value } = await call('sample_source', { source: 's1', path: '/readings' });
    expect(value).toEqual({
      read: true,
      quality: 'live',
      shape: { values: ['/items: array(2)', '/items/0/id: string "P-101"', '/items/0/temp: number 61.5'], lists: [{ list: '/items', items: 2, keys: ['id', 'temp'] }] },
    });
    expect(server.requests.find(r => r.path.endsWith('/resolve'))!.body).toEqual({ ref: { path: '/readings' } });
    expect((await call('sample_source', { source: 's1', path: '/down' })).value).toEqual({
      read: false,
      reason: 'transport',
      message: 'connect ECONNREFUSED',
      next: expect.stringContaining('could not be reached'),
    });
  });

  it('says, for a path the source has nothing at, to ask for the source’s paths rather than guess them', async () => {
    const { value } = await call('sample_source', { source: 's1', path: '/nowhere' });
    expect(value).toEqual({ read: false, reason: 'address', next: expect.stringContaining('ask the person') });
    expect(value.next).toContain('do not guess');
  });

  it('makes a source that needs no credential, and cannot be given one', async () => {
    const { value } = await call('create_source', { name: 'Open data', baseUrl: 'https://open.example.com' });
    expect(value).toEqual({ source: { id: 's2', name: 'Open data', baseUrl: 'https://open.example.com', authType: 'none' } });
    const withKey = (await client.callTool({ name: 'create_source', arguments: { name: 'x', baseUrl: 'https://x.example.com', authValue: 'k' } })) as { isError?: boolean };
    expect(withKey.isError).toBe(true);
  });

  it('makes a source with the description of its paths, for whoever binds to it next', async () => {
    await call('create_source', { name: 'Line', baseUrl: 'https://mes.example.com', description: 'GET /line-1.json — the line, its stations by id' });
    const sent = server.requests.find(r => r.method === 'POST' && r.path.endsWith('/connectors'))!;
    expect(sent.body).toEqual({ name: 'Line', baseUrl: 'https://mes.example.com', description: 'GET /line-1.json — the line, its stations by id', authType: 'none' });
  });

  it('refuses arguments it does not take', async () => {
    const result = (await client.callTool({ name: 'list_boards', arguments: { all: true } })) as { isError?: boolean };
    expect(result.isError).toBe(true);
  });
});

describe('edit_board', () => {
  const canvas = (): ViewDocument => ({
    kind: 'canvas',
    background: {},
    elements: { dot: { render: 'template', template: '<i></i>' } },
    nodes: [
      { id: 'temp', x: 0, y: 0, anchored: false, widget: { type: 'element:dot' } },
      { id: 'hall', x: 300, y: 0, anchored: false, widget: { type: 'status' } },
    ],
    connectors: [{ id: 'feed', fromNodeId: 'temp', toNodeId: 'hall' }],
  });
  beforeEach(() => {
    server.boards.set('b3', { name: 'Hall', revision: 7, document: canvas() });
  });

  it('runs the commands and saves what they changed as one patch, on the revision it read', async () => {
    const { value, isError } = await call('edit_board', { board: 'b3', commands: [{ command: 'rename-element', from: 'dot', to: 'marker' }, { command: 'remove', ids: ['hall'] }] });
    expect(isError).toBe(false);
    expect(value).toMatchObject({ revision: 8, operations: expect.any(Number) });
    const saved = server.boards.get('b3')!.document as Extract<ViewDocument, { kind: 'canvas' }>;
    expect(Object.keys(saved.elements!)).toEqual(['marker']);
    expect(saved.nodes.map(n => [n.id, n.widget.type])).toEqual([['temp', 'element:marker']]);
    expect(saved.connectors).toEqual([]);
    const sent = server.requests.find(r => r.method === 'PATCH')!;
    expect(sent.headers['If-Match']).toBe('"7"');
  });

  it('answers the patch and the checks without saving, on dryRun', async () => {
    const { value } = await call('edit_board', { board: 'b3', commands: [{ command: 'make-component', ids: ['temp'], name: 'card', instance: 'c1' }], dryRun: true });
    expect(value).toMatchObject({ valid: true, issues: [], patch: expect.any(Array), next: expect.stringContaining('revision 7') });
    expect(server.requests.some(r => r.method !== 'GET')).toBe(false);
  });

  it('says which command could not run, where, and saves nothing', async () => {
    const { value, isError } = await call('edit_board', { board: 'b3', commands: [{ command: 'remove', ids: ['hall'] }, { command: 'remove-element', name: 'dot' }] });
    expect(isError).toBe(true);
    expect(value).toEqual({ code: 'INVALID_COMMAND', command: 1, path: '/elements/dot', message: expect.stringContaining('1 widget places it') });
    expect(server.requests.some(r => r.method !== 'GET')).toBe(false);
  });

  it('refuses a change made against an older revision', async () => {
    const { value, isError } = await call('edit_board', { board: 'b3', revision: 5, commands: [{ command: 'remove', ids: ['hall'] }] });
    expect(isError).toBe(true);
    expect(value.error).toContain('revision 7, not 5');
  });
});
