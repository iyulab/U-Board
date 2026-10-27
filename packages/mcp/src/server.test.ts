import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { applyJsonPatch } from '@iyulab/u-board/domain';
import type { ViewDocument } from '@iyulab/u-board/picture';
import { toViewDocument, type Board } from '@iyulab/u-board/domain';
import { emptyBoard } from '@iyulab/u-board-designer/check';
import { UBoardClient } from './client.js';
import { createServer } from './server.js';
import type { Looker } from './look.js';

const line = { line: { from: 's1', path: '/line', fields: { temp: { unit: '°C' } } } };
/** A grid board with one gauge — what the fake server holds as b1. */
const gaugeBoard = (): Board => ({ data: line, parts: { a: { as: 'gauge', of: 'line', show: 'temp' } }, layout: { kind: 'grid', items: ['a'] } });
/** A canvas board placing a stat at each box. */
const canvasBoard = (place: Record<string, [number, number, number, number]>): Board => ({
  data: line,
  parts: Object.fromEntries(Object.keys(place).map(id => [id, { as: 'stat', of: 'line', show: 'temp' }])),
  layout: { kind: 'canvas', size: [1600, 900], place },
});

/** A U-Board server in miniature: one workspace, its boards, and every request it was sent. */
function fakeServer() {
  const boards = new Map<string, { name: string; document: Board; revision: number }>([['b1', { name: 'Line 1', revision: 4, document: gaugeBoard() }]]);
  const requests: { method: string; path: string; headers: Record<string, string>; body?: unknown }[] = [];
  // The sources made through the tools, listed after the one the workspace starts with.
  const made: Record<string, unknown>[] = [];
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
      return json(200, { boards: [...boards].map(([id, b]) => ({ id, name: b.name, kind: b.document.layout.kind, updatedAt: 't' })) });
    }
    if (url.pathname === '/api/workspaces/w1/connectors' && method === 'GET') {
      return json(200, { connectors: [{ id: 's1', name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer' }, ...made] });
    }
    if (url.pathname === '/api/workspaces/w1/connectors' && method === 'POST') {
      const source =
        body.type === 'static'
          ? { id: 's2', name: body.name, type: 'static', answers: body.answers, sample: body.sample === true }
          : { id: 's2', name: body.name, baseUrl: body.baseUrl, authType: body.authType };
      made.push(source);
      return json(201, source);
    }
    if (url.pathname === '/api/workspaces/w1/connectors/s1/resolve') {
      if (body.ref.path === '/down') return json(200, { quality: 'disconnected', reason: 'transport', message: 'connect ECONNREFUSED' });
      if (body.ref.path === '/nowhere') return json(200, { quality: 'disconnected', reason: 'address' });
      if (body.ref.path === '/refused') return json(200, { quality: 'disconnected', reason: 'source', message: 'The key is not valid. (INFO-100)' });
      return json(200, { quality: 'live', value: { items: [{ id: 'P-101', temp: 61.5 }, { id: 'P-102', temp: 58 }] } });
    }
    if (url.pathname === '/api/workspaces/w1/boards' && method === 'POST') {
      boards.set('b2', { name: body.name, revision: 1, document: emptyBoard(body.kind) });
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
    if (method === 'GET') {
      // A board comes with the picture its viewers draw it from, as the server answers.
      const picture = toViewDocument(board.document, { keysOf: () => [] });
      const { unplaced } = board as { unplaced?: Record<string, number> };
      return json(200, { id, name: board.name, document: board.document, picture, ...(unplaced && { unplaced }), revision: board.revision, updatedAt: 't' });
    }
    if (method === 'DELETE') {
      boards.delete(id);
      return new Response(null, { status: 204 });
    }
    if (method === 'PATCH') board.document = applyJsonPatch(board.document, body);
    if (body.document !== undefined) board.document = body.document;
    if (body.name !== undefined) board.name = body.name;
    board.revision += 1;
    return json(200, { id, ...(body.name !== undefined && { name: board.name }), revision: board.revision, advice: [] });
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

/** `look` on a board, through a looker that answers `problems` — the report's text, and what the looker was asked. */
async function looking(problems: Array<{ path?: string; message: string }> = []) {
  const asked: Array<{ request: unknown; document: ViewDocument }> = [];
  const looker: Looker = {
    look: async (request, document) => {
      asked.push({ request, document });
      return { image: 'iVBORw==', report: { picture: { width: 1600, height: 900 }, problems, quality: {}, console: [] } };
    },
  };
  const mcp = createServer(new UBoardClient('https://board.example.com', 'ubt_test', server.fetchImpl), looker);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const viewer = new Client({ name: 'test', version: '0' });
  await Promise.all([mcp.connect(b), viewer.connect(a)]);
  const look = async (board: string, args: Record<string, unknown> = {}) => {
    const result = (await viewer.callTool({ name: 'look', arguments: { board, ...args } })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };
    return { content: result.content, report: result.isError ? undefined : JSON.parse(result.content.at(-1)!.text!), isError: result.isError ?? false };
  };
  return { look, asked };
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
      'board_state', 'create_board', 'create_source', 'delete_board', 'describe', 'get_board', 'list_boards', 'list_sources', 'patch_board', 'rename_board', 'sample_source', 'validate',
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

  it('describes its topics, the rules — the tools, then the board language — and a part of the schema', async () => {
    expect((await call('describe')).value.topics.rules).toContain('Read this first');
    const { value: rules } = await call('describe', { topic: 'rules' });
    expect(rules).toContain('## JSON Patch');
    expect(rules).toContain('# Writing a board');
    expect(rules.indexOf('## JSON Patch')).toBeLessThan(rules.indexOf('# Writing a board'));
    expect((await call('describe', { topic: 'schema', pointer: '/$defs/query' })).value).toHaveProperty('properties');
    const lost = await call('describe', { topic: 'schema', pointer: '/nowhere' });
    expect(lost.isError).toBe(true);
    expect(lost.value.error).toContain('/$defs/query');
    expect((await call('describe', { topic: 'canvas' })).isError).toBe(true);
  });

  it('keeps the topic list within its budget, and the rules within theirs — what an assistant reads before it can write', async () => {
    expect(JSON.stringify((await call('describe')).value).length).toBeLessThan(1200);
    expect((await call('describe', { topic: 'rules' })).value.length).toBeLessThan(24_000);
  });

  it('gives a kind in full — its options with their types and defaults — and several in one read, an unknown one answering why', async () => {
    const { value: gauge } = await call('describe', { topic: 'kind:gauge' });
    expect(gauge).toMatchObject({ kind: 'gauge', reads: 'needs', options: { min: { type: 'number', default: 0 } } });
    const { value: several } = await call('describe', { topic: 'kind:gauge, stat,gauge,nope' });
    expect(Object.keys(several)).toEqual(['gauge', 'stat', 'nope']);
    expect(several.gauge).toEqual(gauge);
    expect(several.stat).toMatchObject({ kind: 'stat', own: ['trend'] });
    expect(several.nope.error).toMatch(/no kind "nope" — the kinds are/);
    expect((await call('describe', { topic: 'kind:marker' })).value).toEqual({ kind: 'marker', shows: expect.any(String), reads: 'may', own: ['shape', 'symbol', 'note'] });
    const many = Array.from({ length: 9 }, (_, i) => `k${i}`).join(',');
    expect((await call('describe', { topic: `kind:${many}` })).isError).toBe(true);
  });

  it('looks at a board as its viewers get it — the picture the server made — and says what it saw of the part', async () => {
    const { look, asked } = await looking([{ path: '/items/0', message: 'cut off' }]);
    const { content, report } = await look('b1', { focus: '/parts/a' });
    expect(content[0]).toEqual({ type: 'image', data: 'iVBORw==', mimeType: 'image/png' });
    expect(report).toMatchObject({ revision: 4, problems: [{ path: '/parts/a', message: 'cut off' }] });
    // The looker draws the picture the board is read with, up close where the part is drawn — no second read.
    expect(asked).toEqual([{ request: { board: 'b1', focus: '/items/0', width: 1600, height: 900 }, document: toViewDocument(gaugeBoard(), { keysOf: () => [] }) }]);
    expect(server.requests.some(r => r.path === '/api/share/boards/b1')).toBe(false);
    const elsewhere = await look('b1', { focus: '/items/0' });
    expect(elsewhere.isError).toBe(true);
    expect(JSON.parse(elsewhere.content[0].text!).error).toContain('focus a part: "/parts/<id>"');
  });

  it('answers with the picture the advice that stands, naming the parts by where they are in the board', async () => {
    server.boards.set('b3', { name: 'Crowded', revision: 2, document: canvasBoard({ n1: [0, 0, 200, 100], n2: [0, 0, 200, 100], n3: [900, 0, 200, 100] }) });
    const { look } = await looking();
    const whole = (await look('b3')).report;
    expect(whole.problems).toEqual([]);
    expect(whole.advice).toEqual([{ path: '/parts/n1', message: 'its box overlaps node "n2" (/parts/n2) — one widget draws over the other; move or resize one' }]);
    // Up close, only what concerns that part — named either way.
    expect((await look('b3', { focus: '/parts/n2' })).report.advice).toHaveLength(1);
    expect((await look('b3', { focus: '/parts/n3' })).report.advice).toEqual([]);
    // What is left, said in one line a writer cannot read past.
    expect(whole.status).toBe('not done — 1 piece of advice to fix');
    expect((await look('b3', { focus: '/parts/n3' })).report.status).toBe('nothing to fix on this part — look at the whole board before finishing');
  });

  it('says how many items placed by their fields were left out, as a problem of the part', async () => {
    server.boards.set('b7', { name: 'Quakes', revision: 1, document: gaugeBoard(), unplaced: { a: 3 } } as never);
    const { look } = await looking();
    const { report } = await look('b7');
    expect(report.problems).toEqual([{ path: '/parts/a', message: '3 items of "a" are not drawn: no number in the fields its place names, or outside its frame — check "at" and "frame"' }]);
    expect(report.status).toMatch(/^not done/);
  });

  it('up close answers only the part’s problems, and counts only those in its status', async () => {
    server.boards.set('b6', { name: 'Apart', revision: 1, document: canvasBoard({ n0: [0, 0, 200, 100], n1: [300, 0, 200, 100], n2: [600, 0, 200, 100] }) });
    const drawn = [
      { path: '/nodes/0', message: 'its element draws up to 11 px past its box' },
      { path: '/nodes/2', message: 'its element draws up to 50 px past its box' },
      { path: '/nodes/0', message: 'its text "!" reads at 1.0:1' },
    ];
    const { look } = await looking(drawn);
    expect((await look('b6')).report.status).toBe('not done — 3 problems to fix');
    const up = (await look('b6', { focus: '/parts/n2' })).report;
    expect(up.problems).toEqual([{ path: '/parts/n2', message: drawn[1]!.message }]);
    expect(up.status).toBe('not done — 1 problem to fix on this part');
    expect((await look('b6', { focus: '/parts/n1' })).report.status).toBe('nothing to fix on this part — look at the whole board before finishing');
  });

  it('says a clean board is done', async () => {
    server.boards.set('b4', { name: 'Clean', revision: 1, document: { parts: {}, layout: { kind: 'grid', items: [] } } });
    expect((await (await looking([{ message: 'x' }, { message: 'y' }])).look('b4')).report.status).toBe('not done — 2 problems to fix');
    expect((await (await looking()).look('b4')).report.status).toBe('done — nothing to fix');
  });

  it('says when an operation or a board is wrapped in its own first key — the commonest shape mistake', async () => {
    const wrappedOp = (await client.callTool({ name: 'patch_board', arguments: { board: 'b1', patch: [{ op: { op: 'add', path: '/x', value: 1 } }] } })) as { content: { text: string }[]; isError?: boolean };
    expect(wrappedOp.isError).toBe(true);
    expect(wrappedOp.content[0].text).toContain('wrapped in "op"');
    const wrappedDoc = (await client.callTool({ name: 'validate', arguments: { document: { document: gaugeBoard() } } })) as { content: { text: string }[]; isError?: boolean };
    expect(wrappedDoc.isError).toBe(true);
    expect(wrappedDoc.content[0].text).toContain('wrapped in "document"');
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
    const { value } = await call('get_board', { board: 'b1', pointer: '/parts/a' });
    expect(value).toEqual({ id: 'b1', name: 'Line 1', revision: 4, kind: 'grid', pointer: '/parts/a', value: { as: 'gauge', of: 'line', show: 'temp' } });
  });

  it('patches a board on its revision, as a JSON Patch', async () => {
    const { value } = await call('patch_board', { board: 'b1', revision: 4, patch: [{ op: 'add', path: '/parts/a/title', value: 'Temp' }] });
    expect(value).toEqual({ id: 'b1', revision: 5, advice: [] });
    const sent = server.requests.find(r => r.method === 'PATCH')!;
    expect(sent.headers['Content-Type']).toBe('application/json-patch+json');
    expect(sent.headers['If-Match']).toBe('"4"');
    expect((server.boards.get('b1')!.document as Board).parts.a).toEqual({ as: 'gauge', of: 'line', show: 'temp', title: 'Temp' });
  });

  it('says what to do when the board was saved since', async () => {
    const { value, isError } = await call('patch_board', { board: 'b1', revision: 2, patch: [{ op: 'remove', path: '/parts/a' }] });
    expect(isError).toBe(true);
    expect(value).toMatchObject({ status: 412, code: 'BOARD_CHANGED', revision: 4, hint: expect.stringContaining('get_board again') });
  });

  it('makes a board with a first board, or an empty one of its kind', async () => {
    const document = gaugeBoard();
    expect((await call('create_board', { name: 'New', kind: 'grid', document })).value).toEqual({ id: 'b2', revision: 2, advice: [] });
    expect(server.boards.get('b2')!.document).toEqual(document);
    await call('create_board', { name: 'Blank', kind: 'canvas' });
    expect(server.boards.get('b2')!.document).toEqual({ parts: {}, layout: { kind: 'canvas', size: [1600, 900], place: {} } });
  });

  it('makes no board when its first board is refused — a retry leaves no empty boards behind', async () => {
    const before = server.boards.size;
    const { value, isError } = await call('create_board', { name: 'New', kind: 'canvas', document: gaugeBoard() });
    expect(isError).toBe(true);
    expect(value).toMatchObject({ code: 'INVALID_DOCUMENT', message: expect.stringContaining('no board was made'), issues: [{ path: '/layout/kind', message: 'expected "canvas", the kind asked for — got "grid"' }] });
    const bad = await call('create_board', { name: 'New', kind: 'grid', document: { ...gaugeBoard(), parts: { a: { as: 'metric', of: 'line' } } } });
    expect(bad.value.issues.map((i: { path: string }) => i.path)).toEqual(['/parts/a/as']);
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

  it('renames a board in place — the same id, the board untouched', async () => {
    const before = server.boards.get('b1')!.document;
    expect((await call('rename_board', { board: 'b1', name: '  Line 1, no inspection ' })).value).toEqual({ id: 'b1', name: 'Line 1, no inspection', revision: 5 });
    expect(server.boards.get('b1')).toMatchObject({ name: 'Line 1, no inspection', document: before });
    expect(server.requests.at(-1)).toMatchObject({ method: 'PUT', body: { name: 'Line 1, no inspection' } });
    expect((await call('rename_board', { board: 'b1', name: '   ' })).isError).toBe(true);
  });

  it('validates a board, or a board with a patch, without saving — as saving checks it', async () => {
    const bad = await call('validate', { document: { ...gaugeBoard(), parts: { a: { as: 'gauge', of: 'nowhere' } } } });
    expect(bad.value.valid).toBe(false);
    expect(bad.value.issues.map((i: { path: string }) => i.path)).toEqual(['/parts/a/of']);
    const element = { tag: { template: '<b>{{name}}</b>', props: { name: 'string' } } };
    const dryRun = await call('validate', {
      board: 'b1',
      patch: [{ op: 'add', path: '/elements', value: element }, { op: 'add', path: '/parts/e', value: { as: 'element', element: 'tag', props: { name: 'pump' } } }, { op: 'add', path: '/layout/items/-', value: 'e' }],
    });
    // It says the change is not saved, and on which revision to send it.
    expect(dryRun.value).toEqual({
      valid: true,
      issues: [],
      advice: [{ path: '/elements/tag', message: expect.stringContaining('draws no shape of its own') }],
      next: 'nothing is saved yet — send this patch with patch_board, on revision 4',
    });
    expect(server.requests.some(r => r.method !== 'GET')).toBe(false);
  });

  it('advises, as saving does, on a read that names its source by its name — with the id to write', async () => {
    const { value } = await call('validate', { document: { ...gaugeBoard(), data: { line: { ...line.line, from: 'plant api' } } } });
    expect(value).toMatchObject({ valid: true, advice: [{ path: '/data/line/from', message: expect.stringContaining('"from" takes its id: "s1"') }] });
  });

  it('reads a source asked for a given time with the zone and request time a binding will have', async () => {
    await call('sample_source', { source: 's1', path: '/obs?date={{now:yyyyMMdd}}', timeZone: 'Asia/Seoul', requestTime: { delaySeconds: 2400, stepSeconds: 3600 } });
    expect(server.requests.filter(r => r.path.endsWith('/resolve')).at(-1)!.body).toEqual({
      ref: { path: '/obs?date={{now:yyyyMMdd}}', timeZone: 'Asia/Seoul', requestTime: { delaySeconds: 2400, stepSeconds: 3600 } },
    });
  });

  it('lists the data sources, never a credential', async () => {
    expect((await call('list_sources')).value).toEqual({ sources: [{ id: 's1', name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer' }] });
  });

  it('answers what a source’s response looks like, not the response', async () => {
    const { value } = await call('sample_source', { source: 's1', path: '/readings' });
    expect(value).toEqual({
      read: true,
      quality: 'live',
      shape: { values: ['/items: array(2)', '/items/0/id: string "P-101"', '/items/0/temp: number 61.5'], lists: [{ list: '/items', items: 2, keys: ['id', 'temp'], names: { id: ['P-101', 'P-102'] } }] },
    });
    expect(server.requests.find(r => r.path.endsWith('/resolve'))!.body).toEqual({ ref: { path: '/readings' } });
    expect((await call('sample_source', { source: 's1', path: '/down' })).value).toEqual({
      read: false,
      reason: 'transport',
      message: 'connect ECONNREFUSED',
      next: expect.stringContaining('could not be reached'),
    });
  });

  it('reads a source named by its name, as people name it, and answers the id a binding takes', async () => {
    const { value } = await call('sample_source', { source: ' plant api', path: '/readings' });
    expect(value).toMatchObject({ source: 's1', note: expect.stringContaining('takes its id'), read: true, quality: 'live' });
    expect((await call('sample_source', { source: 'Nobody', path: '/readings' })).value).toMatchObject({ status: 404, hint: expect.stringContaining('list_sources') });
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

  it('makes a source that answers what is stored in it, by path — example values when no source has them — and lists its paths', async () => {
    const answers = [{ path: '/equipment', answer: [{ id: 'P1', flow: 31 }] }, { path: '/plant', answer: { shift: 'B' } }];
    const { value } = await call('create_source', { name: 'Plant (example)', answers, sample: true });
    const sent = server.requests.find(r => r.method === 'POST' && r.path.endsWith('/connectors'))!;
    expect(sent.body).toEqual({ name: 'Plant (example)', type: 'static', answers: { '/equipment': [{ id: 'P1', flow: 31 }], '/plant': { shift: 'B' } }, sample: true });
    expect(value.source).toMatchObject({ type: 'static', sample: true });
    for (const wrong of [{ name: 'x' }, { name: 'x', baseUrl: 'https://x.example.com', answers }, { name: 'x', answers, sourceError: { path: '/code' } }, { name: 'x', baseUrl: 'https://x.example.com', sample: true }, { name: 'x', answers: [{ path: '/a?b=1', answer: 1 }] }]) {
      const result = (await client.callTool({ name: 'create_source', arguments: wrong })) as { isError?: boolean };
      expect(result.isError, JSON.stringify(wrong)).toBe(true);
    }
    const { value: listed } = await call('list_sources');
    expect(listed.sources.find((s: { name: string }) => s.name === 'Plant (example)')).toEqual({ id: 's2', name: 'Plant (example)', type: 'static', sample: true, paths: ['/equipment', '/plant'] });
  });

  it('says what the source said when it answered an error with success, and who fixes it', async () => {
    const { value } = await call('sample_source', { source: 's1', path: '/refused' });
    expect(value).toEqual({ read: false, reason: 'source', message: 'The key is not valid. (INFO-100)', next: expect.stringContaining('its words are in message') });
  });

  it('makes a source with where it reports errors in an answer it gives with success', async () => {
    const sourceError = { path: '/response/header/resultCode', ok: ['00'], messagePath: '/response/header/resultMsg' };
    await call('create_source', { name: 'Portal', baseUrl: 'https://portal.example.com', sourceError });
    const sent = server.requests.find(r => r.method === 'POST' && r.path.endsWith('/connectors'))!;
    expect(sent.body).toMatchObject({ sourceError });
    const bad = (await client.callTool({ name: 'create_source', arguments: { name: 'x', baseUrl: 'https://x.example.com', sourceError: { path: 'code' } } })) as { isError?: boolean };
    expect(bad.isError).toBe(true);
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
