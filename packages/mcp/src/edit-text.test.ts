import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DocumentStore } from './document-store.js';
import { createServer } from './server.js';

let dir: string;
let file: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'u-board-mcp-edit-text-'));
  file = join(dir, 'plant.board.json');
});
afterEach(() => rm(dir, { recursive: true, force: true }));

async function connect(options?: { editText?: boolean }) {
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

const seed = [
  { op: 'add', path: '/data', value: { now: { from: 'plant', path: '/now' } } },
  { op: 'add', path: '/elements', value: { badge: { template: '<b>{{n}}</b>', style: 'b{color:red;font-size:16px}\ni{font-size:16px}', props: { n: 'string' } } } },
  { op: 'add', path: '/parts/b1', value: { as: 'element', element: 'badge', of: 'now', bind: { n: 'value' } } },
  { op: 'replace', path: '/layout/items', value: ['b1'] },
];

describe('a change inside a string, over MCP', () => {
  it('offers edit_text, unless it is left out', async () => {
    const plain = await connect();
    expect((await plain.client.listTools()).tools.map(t => t.name)).toContain('edit_text');
    const without = await connect({ editText: false });
    expect((await without.client.listTools()).tools.map(t => t.name)).not.toContain('edit_text');
  });

  it('changes the words it is given and nothing else of the string', async () => {
    const { call } = await connect();
    expect((await call('patch_board', { patch: seed })).isError).toBe(false);
    const done = await call('edit_text', { edits: [{ pointer: '/elements/badge/style', old: 'color:red', new: 'color:blue' }] });
    expect(done.isError).toBe(false);
    const read = await call('get_board', { pointer: '/elements/badge/style' });
    expect(read.value.value).toBe('b{color:blue;font-size:16px}\ni{font-size:16px}');
  });

  it('makes several edits in one call, in one string and across strings, all or none', async () => {
    const { call } = await connect();
    await call('patch_board', { patch: seed });
    const done = await call('edit_text', {
      edits: [
        { pointer: '/elements/badge/style', old: 'b{color:red;font-size:16px}', new: 'b{color:blue;font-size:20px}' },
        { pointer: '/elements/badge/style', old: 'font-size:16px', new: 'font-size:12px' },
        { pointer: '/elements/badge/template', old: '<b>', new: '<b class="n">' },
      ],
    });
    expect(done.isError).toBe(false);
    expect((await call('get_board', { pointer: '/elements/badge/style' })).value.value).toBe('b{color:blue;font-size:20px}\ni{font-size:12px}');
    expect((await call('get_board', { pointer: '/elements/badge/template' })).value.value).toBe('<b class="n">{{n}}</b>');
    const none = await call('edit_text', { edits: [{ pointer: '/elements/badge/template', old: '<b class="n">', new: '<b>' }, { pointer: '/elements/badge/style', old: 'nowhere', new: 'x' }] });
    expect(none.isError).toBe(true);
    expect((await call('get_board', { pointer: '/elements/badge/template' })).value.value).toBe('<b class="n">{{n}}</b>');
  });

  it('says what is wrong: not a string, not found, or more than once', async () => {
    const { call } = await connect();
    await call('patch_board', { patch: seed });
    expect((await call('edit_text', { edits: [{ pointer: '/elements/badge/props', old: 'a', new: 'b' }] })).value.error).toContain('is not a string');
    expect((await call('edit_text', { edits: [{ pointer: '/elements/badge/style', old: 'color:green', new: 'x' }] })).value.error).toContain('is not in /elements/badge/style');
    expect((await call('edit_text', { edits: [{ pointer: '/elements/badge/style', old: 'font-size:16px', new: 'font-size:18px' }] })).value.error).toContain('more than once');
  });

  it('checks the board as any change is, and keeps it as it was when that fails', async () => {
    const { call } = await connect();
    await call('patch_board', { patch: seed });
    const refused = await call('edit_text', { edits: [{ pointer: '/elements/badge/style', old: 'b{color:red', new: 'b{background:url(https://example.com/x.png);color:red' }] });
    expect(refused.isError).toBe(true);
    expect((await call('get_board', { pointer: '/elements/badge/style' })).value.value).toBe('b{color:red;font-size:16px}\ni{font-size:16px}');
  });
});
