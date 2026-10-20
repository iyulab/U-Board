import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { boardTools, functionTool, UBoardClient } from './tools-entry.js';
import { createServer } from './server.js';

describe('the board tools outside the MCP server', () => {
  it('list each tool as a chat completions function with the input the MCP server lists', async () => {
    const api = new UBoardClient('https://board.example.com', 'ubt_test', async () => new Response('{}'));
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '0' });
    await Promise.all([createServer(api).connect(serverTransport), client.connect(clientTransport)]);
    const listed = new Map((await client.listTools()).tools.map(t => [t.name, t]));

    const functions = boardTools(api).map(functionTool);
    expect(functions.map(f => f.function.name).sort()).toEqual([...listed.keys()].sort());
    for (const { function: f } of functions) {
      const { $schema: _dialect, ...inputSchema } = listed.get(f.name)!.inputSchema as Record<string, unknown>;
      expect(f.parameters, f.name).toEqual(inputSchema);
      expect(f.description, f.name).toBe(listed.get(f.name)!.description);
    }
  });

  it('leave board_state out when asked — a console session cannot read the share route it uses', () => {
    const api = new UBoardClient('https://board.example.com', 'ubt_test');
    expect(boardTools(api, { boardState: false }).map(t => t.name)).not.toContain('board_state');
    expect(boardTools(api).map(t => t.name)).toContain('board_state');
  });

  it('answer describe("schema") without a file system', async () => {
    const describeTool = boardTools(new UBoardClient('https://board.example.com', 'ubt_test')).find(t => t.name === 'describe')!;
    const answer = await describeTool.run({ topic: 'schema', pointer: '/$defs/elementDefinition' } as never);
    expect(answer.isError).toBeUndefined();
    expect(JSON.parse((answer.content[0] as { text: string }).text)).toHaveProperty('properties');
  });
});

describe('a client on a console session', () => {
  it('sends the session cookie instead of a token, in the workspace it is given, without asking the server whose token it is', async () => {
    const requests: { url: string; init?: RequestInit }[] = [];
    const api = new UBoardClient('https://board.example.com', { workspace: { id: 'w1', name: 'Plant' } }, async (input, init) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify({ boards: [] }), { headers: { 'Content-Type': 'application/json' } });
    });
    expect(await api.listBoards()).toEqual([]);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://board.example.com/api/workspaces/w1/boards');
    expect(requests[0].init?.credentials).toBe('same-origin');
    expect(requests[0].init?.headers).not.toHaveProperty('Authorization');
    expect((await api.tokenInfo()).workspace.id).toBe('w1');
  });
});
