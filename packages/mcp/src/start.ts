import type { ViewKind } from '@iyulab/u-board/picture';

/** How `u-board-mcp` is started: against a U-Board server (its address and a workspace API token), or on a board kept in a
 *  file, with no server at all. */
export type Start =
  | { mode: 'server'; url: string; token: string; bundle?: true; boardApp?: true }
  | { mode: 'document'; path: string; kind: ViewKind; bundle?: true }
  | { mode: 'help'; message: string }
  | { mode: 'refused'; message: string };

const USAGE = [
  'u-board-mcp works on boards in one of two ways:',
  '  a U-Board server — set UBOARD_URL (e.g. https://board.example.com) and UBOARD_TOKEN (a workspace API token, ubt_…)',
  '  a board in a file, no server — u-board-mcp --board <file> [--kind grid|canvas]   (the file is made when it is not there)',
  'either way, --bundle (or UBOARD_BUNDLE=1) also offers get_bundle and put_bundle: a board read and written as files',
  'against a server, --app (or UBOARD_APP=1) also offers show_board: a board drawn live in the host’s own window, where the host shows MCP Apps',
].join('\n');

/** The way to start from the command line `args` and the environment `env`. Naming a file and a server both is refused:
 *  it is not clear which board the assistant means to change. */
export function startOf(args: readonly string[], env: Record<string, string | undefined>): Start {
  let file: string | undefined;
  let kind: string | undefined;
  let bundle = env['UBOARD_BUNDLE'] === '1';
  let app = env['UBOARD_APP'] === '1';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--bundle') {
      bundle = true;
      continue;
    }
    if (arg === '--app') {
      app = true;
      continue;
    }
    // Asking how it is used is not a failure: the usage, and exit status 0.
    if (arg === '--help' || arg === '-h') return { mode: 'help', message: USAGE };
    const [name, inline] = arg.startsWith('--') && arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, undefined];
    if (name !== '--board' && name !== '--kind') return { mode: 'refused', message: `u-board-mcp: unknown argument "${arg}"\n${USAGE}` };
    const value = inline ?? args[++i];
    if (value === undefined || value === '' || value.startsWith('--')) return { mode: 'refused', message: `u-board-mcp: ${name} needs a value\n${USAGE}` };
    if (name === '--board') file = value;
    else kind = value;
  }
  const { UBOARD_URL: url, UBOARD_TOKEN: token } = env;
  if (file === undefined) {
    if (kind !== undefined) return { mode: 'refused', message: `u-board-mcp: --kind is for a board in a file, given with --board\n${USAGE}` };
    return url && token ? { mode: 'server', url, token, ...(bundle && { bundle: true as const }), ...(app && { boardApp: true as const }) } : { mode: 'refused', message: `u-board-mcp: no server and no file given\n${USAGE}` };
  }
  if (url || token) {
    return { mode: 'refused', message: 'u-board-mcp: --board names a file, and UBOARD_URL / UBOARD_TOKEN name a server — give one of them, so it is clear which board is changed' };
  }
  // The page reads a board's values through a server's data sources; a file has none.
  if (app) return { mode: 'refused', message: 'u-board-mcp: --app shows a board with the values the data sources of a server give — it is for UBOARD_URL and UBOARD_TOKEN, not --board' };
  if (kind !== undefined && kind !== 'grid' && kind !== 'canvas') return { mode: 'refused', message: `u-board-mcp: --kind is "grid" or "canvas", not "${kind}"` };
  return { mode: 'document', path: file, kind: (kind ?? 'grid') as ViewKind, ...(bundle && { bundle: true as const }) };
}
