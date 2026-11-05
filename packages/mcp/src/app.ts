import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UBoardApiError, type ResolveRef, type Resolved } from './client.js';
import type { WorkspaceStore } from './store.js';

/**
 * A board drawn inside the assistant's own window: an MCP App. A host that supports MCP Apps shows the page behind
 * `APP_URI` — the library's viewer, in a sandboxed frame — when `show_board` is called, and the page reads the board's values
 * through `read_sources`, a tool only the page can call. A host that does not still gets the board's name and size from
 * `show_board`, and `look` draws the picture as before.
 */
export const APP_URI = 'ui://u-board/board.html';
/** What marks a resource as an app page. */
export const APP_MIME = 'text/html;profile=mcp-app';

/** The most references one `read_sources` call reads: the page batches what a board asks in one moment. */
export const MAX_READS = 200;

/** One read: the data source's id and the reference as a binding holds it. The reference travels as it is — the server reads it
 *  with the rules of a connector (its address limits, its credential) and answers what it will not read. */
const readSchema = z.strictObject({
  source: z.string().min(1).max(100).describe('The data source id.'),
  ref: z.record(z.string(), z.unknown()).describe('The binding’s reference, as the binding holds it.'),
});

/** Where the page is built to: next to this module in a published package, or in the build output when run from source. */
function pageFile(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [join(here, 'app', 'board.html'), join(here, '..', 'dist', 'app', 'board.html')]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('the page that shows a board inside the assistant is not built — run `npm run build` in the package');
}

/** The page as the package ships it (one file: the viewer, its styles and its script). */
export function builtPage(): Promise<string> {
  return readFile(pageFile(), 'utf8');
}

/** What a read of a source came to when it could not be made at all — the page draws the part as disconnected. */
function unread(error: unknown): Resolved {
  if (error instanceof UBoardApiError) {
    // The server's own answer to a source it does not know, or a token that may not read it.
    const reason = error.status === 404 ? 'address' : error.status === 401 || error.status === 403 ? 'auth' : 'transport';
    return { quality: 'disconnected', reason, message: String(error.body['message'] ?? error.message) };
  }
  return { quality: 'disconnected', reason: 'transport', message: error instanceof Error ? error.message : String(error) };
}

/**
 * Offers `show_board` and its page. Every read the page makes goes through `store.resolve` — the server's own route, with the
 * workspace's connector rules and the token's reach — never from this process: the page cannot make the MCP server fetch an address.
 * `html` gives the page (the built one by default).
 */
export function registerApp(server: McpServer, store: WorkspaceStore, html: () => Promise<string> = builtPage): void {
  server.registerResource('board-page', APP_URI, { mimeType: APP_MIME, description: 'The page show_board draws a board in.' }, async uri => ({
    contents: [{ uri: uri.href, mimeType: APP_MIME, text: await html() }],
  }));

  server.registerTool(
    'show_board',
    {
      description:
        'Shows a saved board in the conversation, drawn live as its viewers see it, where the host can show an app. The answer is the board’s name and size; the picture is the host’s. Use look to check how a board is drawn — it answers what went wrong as well as a picture.',
      inputSchema: z.strictObject({ board: z.string().min(1).max(100).describe('The board id, from list_boards.') }),
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { ui: { resourceUri: APP_URI } },
    },
    async ({ board }) => {
      try {
        const [found, sources] = await Promise.all([store.getBoard(board), store.listSources()]);
        const adapters = sources.map(s => ({ id: s.id, ...(s.attribution && { attribution: s.attribution }), ...(s.type === 'static' && s.sample === true && { sample: true as const }) }));
        const parts = Object.keys(found.document.parts).length;
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ board: found.id, name: found.name, revision: found.revision, kind: found.document.layout.kind, parts }) }],
          structuredContent: { board: found.document, name: found.name, adapters },
        };
      } catch (error) {
        const text = error instanceof UBoardApiError ? JSON.stringify({ status: error.status, ...error.body }) : JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
        return { content: [{ type: 'text' as const, text }], isError: true };
      }
    }
  );

  server.registerTool(
    'read_sources',
    {
      description: 'Reads data source values for the board page. Only the page calls this.',
      inputSchema: z.strictObject({ reads: z.array(readSchema).min(1).max(MAX_READS) }),
      annotations: { readOnlyHint: true, openWorldHint: true },
      // Offered to the page, not to the model.
      _meta: { ui: { visibility: ['app'] } },
    },
    async ({ reads }) => {
      const answers = await Promise.all(
        reads.map(async ({ source, ref }) => {
          try {
            return await store.resolve(source, ref as unknown as ResolveRef);
          } catch (error) {
            return unread(error);
          }
        })
      );
      return { content: [{ type: 'text' as const, text: `${answers.length} read${answers.length === 1 ? '' : 's'}` }], structuredContent: { answers } };
    }
  );
}
