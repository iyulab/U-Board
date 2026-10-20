import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { UBoardClient } from './client.js';
import type { Looker } from './look.js';
import { boardTools } from './tools.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

/** The U-Board MCP server: the board tools (`tools.ts`), listed as they are. */
export function createServer(client: UBoardClient, looker?: Looker): McpServer {
  const server = new McpServer({ name: 'u-board-mcp', version });
  for (const { name, description, inputSchema, annotations, run } of boardTools(client, { looker })) {
    server.registerTool(name, { description, inputSchema, ...(annotations && { annotations }) }, args => run(args as never));
  }
  return server;
}
