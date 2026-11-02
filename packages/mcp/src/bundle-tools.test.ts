import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DocumentStore } from './document-store.js';
import { createServer } from './server.js';
import { startOf } from './start.js';

let dir: string;
let file: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'u-board-mcp-bundle-'));
  file = join(dir, 'plant.board.json');
});
afterEach(() => rm(dir, { recursive: true, force: true }));

async function connect(options?: { bundle?: boolean }) {
  const mcp = createServer(await DocumentStore.open(file), undefined, options);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([mcp.connect(serverTransport), client.connect(clientTransport)]);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({ name, arguments: args });
    return { isError: result.isError ?? false, value: JSON.parse((result.content as { text: string }[])[0]!.text) };
  };
  return { client, call };
}

const board = {
  data: { now: { from: 'plant', path: '/now' } },
  elements: { badge: { template: { $file: 'elements/badge.html' }, style: { $file: 'elements/badge.css' }, props: { n: 'string' } } },
  parts: { b1: { as: 'element', element: 'badge', of: 'now', bind: { n: 'value' } } },
  layout: { kind: 'grid', items: ['b1'] },
};
const first = { 'board.json': JSON.stringify(board), 'elements/badge.html': '<b>{{n}}</b>', 'elements/badge.css': 'b{color:red}' };

describe('a board as files, over MCP', () => {
  it('offers the two tools only when asked for', async () => {
    const without = await connect();
    expect((await without.client.listTools()).tools.map(t => t.name)).not.toContain('get_bundle');
    const withBundle = await connect({ bundle: true });
    const names = (await withBundle.client.listTools()).tools.map(t => t.name);
    expect(names).toEqual(expect.arrayContaining(['get_bundle', 'put_bundle']));
  });

  it('saves a board from files, lists them, reads one, and takes a change to one file', async () => {
    const { call } = await connect({ bundle: true });
    expect((await call('put_bundle', { files: first, revision: 1 })).value).toMatchObject({ revision: 2 });
    const stored = JSON.parse(await readFile(file, 'utf8'));
    expect(stored.elements.badge).toEqual({ template: '<b>{{n}}</b>', style: 'b{color:red}', props: { n: 'string' } });

    const listed = (await call('get_bundle', {})).value;
    expect(listed).toMatchObject({ id: 'board', revision: 2 });
    expect(listed.files.map((f: { path: string }) => f.path)).toEqual(['board.json', 'elements/badge.css', 'elements/badge.html']);
    expect(Object.keys(listed.contents)).toEqual(['board.json']);
    expect(JSON.parse(listed.contents['board.json']).elements.badge.style).toEqual({ $file: 'elements/badge.css' });
    expect((await call('get_bundle', { files: ['elements/badge.css'] })).value.contents).toEqual({ 'elements/badge.css': 'b{color:red}' });

    // one file given: the rest stay as they are
    expect((await call('put_bundle', { files: { 'elements/badge.css': 'b{color:blue}' } })).value).toMatchObject({ revision: 3 });
    expect(JSON.parse(await readFile(file, 'utf8')).elements.badge).toEqual({ template: '<b>{{n}}</b>', style: 'b{color:blue}', props: { n: 'string' } });
  });

  it('changes a file in place with edits, without sending it again', async () => {
    const { client, call } = await connect({ bundle: true });
    await call('put_bundle', { files: first, revision: 1 });
    expect((await call('put_bundle', { edits: [{ file: 'elements/badge.css', old: 'color:red', new: 'color:#036' }] })).value).toMatchObject({ revision: 3 });
    expect(JSON.parse(await readFile(file, 'utf8')).elements.badge.style).toBe('b{color:#036}');
    const missed = await call('put_bundle', { edits: [{ file: 'elements/badge.css', old: 'color:red', new: 'x' }] });
    expect(missed).toMatchObject({ isError: true, value: { code: 'INVALID_BUNDLE', message: expect.stringContaining('is not in elements/badge.css') } });
    // files and edits together: the files first, then the edits
    const both = await call('put_bundle', { files: { 'elements/badge.css': 'b{color:red;margin:0}' }, edits: [{ file: 'elements/badge.css', old: 'margin:0', new: 'margin:2px' }] });
    expect(both.value).toMatchObject({ revision: 4 });
    expect(JSON.parse(await readFile(file, 'utf8')).elements.badge.style).toBe('b{color:red;margin:2px}');
    // neither: refused by the tool's own input check, before anything is read
    const none = await client.callTool({ name: 'put_bundle', arguments: {} });
    expect(none.isError).toBe(true);
    expect((none.content as { text: string }[])[0]!.text).toContain('give files, edits, or both');
  });

  it('answers a refused board with the file each issue is in, and saves nothing', async () => {
    const { call } = await connect({ bundle: true });
    await call('put_bundle', { files: first, revision: 1 });
    const refused = await call('put_bundle', { files: { 'elements/badge.css': 'b{background:url(https://elsewhere.example/x.png)}' } });
    expect(refused).toMatchObject({ isError: true, value: { code: 'INVALID_DOCUMENT', issues: [{ path: '/elements/badge/style', file: 'elements/badge.css' }] } });
    expect(JSON.parse(await readFile(file, 'utf8')).elements.badge.style).toBe('b{color:red}');
  });

  it('says what is wrong with a bundle, and what files there are', async () => {
    const { call } = await connect({ bundle: true });
    await call('put_bundle', { files: first, revision: 1 });
    const missing = await call('put_bundle', { files: { 'board.json': JSON.stringify({ ...board, elements: { badge: { template: { $file: 'elements/gone.html' } } } }) } });
    expect(missing).toMatchObject({ isError: true, value: { code: 'INVALID_BUNDLE', message: expect.stringContaining('elements/gone.html') } });
    const unknown = await call('get_bundle', { files: ['elements/nope.css'] });
    expect(unknown).toMatchObject({ isError: true, value: { error: expect.stringContaining('the files are board.json, elements/badge.css, elements/badge.html') } });
  });

  it('is not saved over a board changed since: a change reads the revision it merged into', async () => {
    const { call } = await connect({ bundle: true });
    await call('put_bundle', { files: first, revision: 1 });
    const stale = await call('put_bundle', { files: { 'elements/badge.css': 'b{color:green}' }, revision: 1 });
    expect(stale).toMatchObject({ isError: true, value: { status: 412 } });
  });
});

describe('starting with the bundle tools', () => {
  it('is a flag, or an environment setting, and only then in the answer', () => {
    expect(startOf(['--board', 'a.json', '--bundle'], {})).toEqual({ mode: 'document', path: 'a.json', kind: 'grid', bundle: true });
    expect(startOf(['--bundle'], { UBOARD_URL: 'https://b.example', UBOARD_TOKEN: 'ubt_x' })).toEqual({ mode: 'server', url: 'https://b.example', token: 'ubt_x', bundle: true });
    expect(startOf(['--board', 'a.json'], { UBOARD_BUNDLE: '1' })).toMatchObject({ bundle: true });
    expect(startOf(['--board', 'a.json'], {})).not.toHaveProperty('bundle');
  });
});
