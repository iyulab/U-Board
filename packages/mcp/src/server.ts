import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BoardStore } from './store.js';
import type { Looker } from './look.js';
import { boardTools } from './tools.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

/** The U-Board MCP server: the board tools (`tools.ts`), listed as they are. */
export function createServer(store: BoardStore, looker?: Looker, { bundle = false, editText = true }: { bundle?: boolean; editText?: boolean } = {}): McpServer {
  const server = new McpServer({ name: 'u-board-mcp', version });
  for (const { name, description, inputSchema, annotations, run } of boardTools(store, { looker, bundle, editText })) {
    server.registerTool(name, { description, inputSchema, ...(annotations && { annotations }) }, args => run(args as never));
  }
  return server;
}
