import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isWorkspaceStore, type BoardStore } from './store.js';
import type { Looker } from './look.js';
import { boardTools } from './tools.js';
import { registerApp } from './app.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

/** The U-Board MCP server: the board tools (`tools.ts`), listed as they are — and with `app`, `show_board`, which draws a board in the host's window. */
export function createServer(
  store: BoardStore,
  looker?: Looker,
  { bundle = false, editText = true, app = false, appPage }: { bundle?: boolean; editText?: boolean; app?: boolean; appPage?: () => Promise<string> } = {}
): McpServer {
  const server = new McpServer({ name: 'u-board-mcp', version });
  for (const { name, description, inputSchema, annotations, run } of boardTools(store, { looker, bundle, editText })) {
    server.registerTool(name, { description, inputSchema, ...(annotations && { annotations }) }, args => run(args as never));
  }
  // The board drawn in the assistant's window reads its values through the workspace's data sources, so it needs a store that is one.
  if (app) {
    if (!isWorkspaceStore(store)) throw new Error('the board app reads values through the data sources of a U-Board server — start with UBOARD_URL and UBOARD_TOKEN, not --board');
    registerApp(server, store, appPage);
  }
  return server;
}
