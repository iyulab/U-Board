import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { UBoardApiError } from './client.js';
import { DOCUMENT_BOARD_ID, DocumentStore } from './document-store.js';
import { createServer } from './server.js';
import { startOf } from './start.js';

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'u-board-mcp-'));
  file = join(dir, 'plant.board.json');
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const stat = { op: 'add', path: '/parts/t', value: { as: 'label', title: 'Plant' } };
const place = { op: 'add', path: '/layout/items/-', value: 't' };

describe('a board kept in a file', () => {
  it('starts an empty board of the kind asked for when the file is not there, and writes it', async () => {
    const store = await DocumentStore.open(file, 'canvas');
    const found = await store.getBoard(DOCUMENT_BOARD_ID);
    expect(found).toMatchObject({ id: 'board', name: 'plant.board.json', revision: 1, document: { parts: {}, layout: { kind: 'canvas' } } });
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(found.document);
  });

  it('opens a board that is there, and the picture its viewers draw is made of it', async () => {
    await writeFile(file, JSON.stringify({ parts: { t: { as: 'label', title: 'Plant' } }, layout: { kind: 'grid', items: ['t'] } }));
    const found = await (await DocumentStore.open(file)).getBoard('board');
    expect(found.document.parts).toHaveProperty('t');
    expect(found.picture.kind).toBe('grid');
  });

  it('refuses to open a file that is not a board, with the reasons', async () => {
    await writeFile(file, JSON.stringify({ parts: { a: { as: 'gauge', of: 'nowhere' } }, layout: { kind: 'grid', items: ['a'] } }));
    await expect(DocumentStore.open(file)).rejects.toThrow(/is not a board:\n {2}\/parts\/a\/of/);
    await writeFile(file, 'not json');
    await expect(DocumentStore.open(file)).rejects.toThrow(/is not JSON/);
  });

  it('changes the board with a patch on a revision, answers the new revision and advice, and writes the file', async () => {
    const store = await DocumentStore.open(file);
    const saved = await store.patchDocument('board', [stat, place], 1);
    expect(saved).toMatchObject({ id: 'board', revision: 2, advice: expect.any(Array) });
    expect(JSON.parse(await readFile(file, 'utf8')).parts).toHaveProperty('t');
    expect((await store.getBoard('board')).revision).toBe(2);
  });

  it('refuses a change made on a revision that has gone, saying which is current', async () => {
    const store = await DocumentStore.open(file);
    await store.patchDocument('board', [stat, place], 1);
    const refused = await store.patchDocument('board', [{ op: 'replace', path: '/parts/t/title', value: 'x' }], 1).catch(e => e);
    expect(refused).toBeInstanceOf(UBoardApiError);
    expect(refused).toMatchObject({ status: 412, body: { code: 'BOARD_CHANGED', revision: 2 } });
  });

  it('refuses a change that makes the board invalid at its path, and leaves the file and the revision as they were', async () => {
    const store = await DocumentStore.open(file);
    const before = await readFile(file, 'utf8');
    const refused = await store.patchDocument('board', [{ op: 'add', path: '/parts/a', value: { as: 'gauge', of: 'nowhere' } }, { op: 'add', path: '/layout/items/-', value: 'a' }]).catch(e => e);
    expect(refused).toMatchObject({ status: 400, body: { code: 'INVALID_DOCUMENT', issues: [{ path: '/parts/a/of' }] } });
    expect(await readFile(file, 'utf8')).toBe(before);
    expect((await store.getBoard('board')).revision).toBe(1);
  });

  it('replaces the whole document, checked the same way', async () => {
    const store = await DocumentStore.open(file);
    const saved = await store.putDocument('board', { parts: { t: { as: 'label', title: 'Plant' } }, layout: { kind: 'grid', items: ['t'] } });
    expect(saved.revision).toBe(2);
    await expect(store.putDocument('board', { parts: {} })).rejects.toMatchObject({ status: 400 });
  });

  it('holds one board: another id is not found', async () => {
    const store = await DocumentStore.open(file);
    await expect(store.getBoard('other')).rejects.toMatchObject({ status: 404 });
    await expect(store.patchDocument('other', [stat])).rejects.toMatchObject({ status: 404 });
  });

  it('takes changes that arrive together one after another, none on a revision another has moved', async () => {
    const store = await DocumentStore.open(file);
    const together = await Promise.all([
      store.patchDocument('board', [stat, place], 1).catch(e => e),
      store.patchDocument('board', [{ op: 'add', path: '/parts/u', value: { as: 'label', title: 'U' } }, { op: 'add', path: '/layout/items/-', value: 'u' }], 1).catch(e => e),
    ]);
    expect(together.filter(r => r instanceof UBoardApiError).map(r => r.status)).toEqual([412]);
    expect((await store.getBoard('board')).revision).toBe(2);
  });

  it('leaves no half-written file beside the board', async () => {
    const store = await DocumentStore.open(file);
    await store.patchDocument('board', [stat, place]);
    expect(await readdir(dir)).toEqual(['plant.board.json']);
  });
});

describe('the board tools over a board in a file', () => {
  let client: Client;
  beforeEach(async () => {
    const mcp = createServer(await DocumentStore.open(file));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'test', version: '0' });
    await Promise.all([mcp.connect(serverTransport), client.connect(clientTransport)]);
  });
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({ name, arguments: args });
    return { isError: result.isError ?? false, value: JSON.parse((result.content as { text: string }[])[0]!.text) };
  };

  it('offers only the tools that need neither a list of boards nor a data source', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual(['describe', 'edit_text', 'get_board', 'patch_board', 'validate']);
  });

  it('needs no board named: there is one', async () => {
    const { tools } = await client.listTools();
    for (const name of ['get_board', 'patch_board']) {
      expect((tools.find(t => t.name === name)!.inputSchema as { required?: string[] }).required ?? [], name).not.toContain('board');
    }
    expect((await call('get_board', {})).value).toMatchObject({ id: 'board', revision: 1, kind: 'grid' });
  });

  it('writes the rules for the tools it has — none of a server’s, which are not offered', async () => {
    const rules = ((await client.callTool({ name: 'describe', arguments: { topic: 'rules' } })).content as { text: string }[])[0]!.text;
    for (const name of ['list_boards', 'create_board', 'list_sources', 'sample_source', 'describe_source', 'create_source', 'board_state', 'look(', 'rename_board']) {
      expect(rules, name).not.toContain(name);
    }
    expect(rules).toContain('get_board({ pointer })');
    expect(rules).toContain('## JSON Patch');
    expect(rules).toContain('# Writing a board');
    expect(rules).toContain('Do not invent a source');
  });

  it('does not call a read wrong for naming a source: a board in a file has none to name', async () => {
    const read = { op: 'add', path: '/data', value: { v: { from: 'plant', path: '/v' } } };
    const checked = await call('validate', { patch: [read, { op: 'add', path: '/parts/a', value: { as: 'stat', of: 'v' } }, { op: 'add', path: '/layout/items/-', value: 'a' }] });
    expect(checked.value).toMatchObject({ valid: true, advice: [] });
  });

  it('checks the board as it is saved when nothing else is given', async () => {
    expect((await call('validate', {})).value).toEqual({ valid: true, issues: [], advice: [] });
  });

  it('draws a board with patches, reading it back and checking it as it goes', async () => {
    const saved = await call('patch_board', { patch: [stat, place], revision: 1 });
    expect(saved.value).toMatchObject({ revision: 2 });
    expect((await call('get_board', { pointer: '/parts/t' })).value).toMatchObject({ value: { as: 'label', title: 'Plant' } });
    const stale = await call('patch_board', { patch: [{ op: 'replace', path: '/parts/t/title', value: 'x' }], revision: 1 });
    expect(stale).toMatchObject({ isError: true, value: { status: 412, hint: expect.stringContaining('get_board') } });
    const checked = await call('validate', { patch: [{ op: 'add', path: '/parts/a', value: { as: 'gauge', of: 'nowhere' } }, { op: 'add', path: '/layout/items/-', value: 'a' }] });
    expect(checked.value).toMatchObject({ valid: false, issues: [{ path: '/parts/a/of' }] });
    expect(JSON.parse(await readFile(file, 'utf8')).parts.t.title).toBe('Plant');
  });
});

describe('how u-board-mcp is started', () => {
  const server = { UBOARD_URL: 'https://board.example.com', UBOARD_TOKEN: 'ubt_x' };

  it('is on a server when it is told one, and on a file when it is given one', () => {
    expect(startOf([], server)).toEqual({ mode: 'server', url: 'https://board.example.com', token: 'ubt_x' });
    expect(startOf(['--board', 'a.json'], {})).toEqual({ mode: 'document', path: 'a.json', kind: 'grid' });
    expect(startOf(['--board=a.json', '--kind', 'canvas'], {})).toEqual({ mode: 'document', path: 'a.json', kind: 'canvas' });
  });

  it('refuses to guess between a file and a server', () => {
    expect(startOf(['--board', 'a.json'], server)).toMatchObject({ mode: 'refused', message: expect.stringContaining('give one of them') });
    expect(startOf(['--board', 'a.json'], { UBOARD_URL: 'https://board.example.com' })).toMatchObject({ mode: 'refused' });
  });

  it('refuses what it cannot start on, saying how it is started', () => {
    for (const [args, env] of [
      [[], {}],
      [[], { UBOARD_URL: 'https://board.example.com' }],
      [['--board'], {}],
      [['--board', '--kind', 'grid'], {}],
      [['--kind', 'grid'], server],
      [['--board', 'a.json', '--kind', 'wall'], {}],
      [['--nope'], {}],
    ] as const) {
      expect(startOf(args, env), JSON.stringify(args)).toMatchObject({ mode: 'refused', message: expect.stringContaining('u-board-mcp') });
    }
    expect((startOf([], {}) as { message: string }).message).toContain('--board <file>');
  });
});
