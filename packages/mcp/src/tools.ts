import { z } from 'zod';
import { applyJsonPatch, getByPointer, JsonPatchError } from '@iyulab/u-board/domain';
import { lintViewDocument, placedAt, type ViewDocument } from '@iyulab/u-board/picture';
import { type Board } from '@iyulab/u-board/domain';
import { checkBoard, sourceAdvice } from '@iyulab/u-board-designer/check';
import { UBoardApiError, type UBoardClient } from './client.js';
import { describeTopic, TOPICS } from './describe.js';
import { shapeOf } from './shape.js';
import type { Looker } from './look.js';

/** What a tool answers: compact JSON text, and for `look` a picture with it — the shape an MCP tool result takes. */
export type ToolResult = { content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }>; isError?: boolean };

/** Every answer is compact JSON (or the rules' text) — whitespace costs the assistant tokens and says nothing. */
function ok(value: unknown): ToolResult {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}

/** A failure the assistant can act on: what the server said, and what to do next where there is something to say. */
function failed(error: unknown): ToolResult {
  if (error instanceof UBoardApiError) {
    const hint =
      error.status === 412 ? 'The board was saved since that revision — get_board again and redo the change.' :
      error.status === 401 ? 'The API token is not valid — ask for a new one (console → workspace settings → API 토큰).' :
      error.status === 403 && error.body.code === 'READ_ONLY_TOKEN' ? 'This token may only read — ask for a write token.' :
      error.status === 403 && error.body.code === 'CREDENTIALS_IN_CONSOLE' ? 'Credentials are entered by a person in the console, never here.' :
      error.status === 404 ? 'Nothing in this workspace has that id — list_boards and list_sources give the ids.' :
      error.body.code === 'INVALID_DOCUMENT' ? 'Fix each issue at its path; describe("rules") says what goes there, describe("kind:<name>") what a kind takes.' :
      undefined;
    return { content: [{ type: 'text', text: JSON.stringify({ status: error.status, ...error.body, ...(hint && { hint }) }) }], isError: true };
  }
  if (error instanceof JsonPatchError) return { content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_PATCH', operation: error.index, message: error.message }) }], isError: true };
  return { content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }], isError: true };
}

/** What is left after a look, in one line — first in the answer, so a writer that skims to the picture still reads that
 *  the board is not done while problems or advice stand. A part seen up close says so for the part only. */
function lookStatus(problems: number, advice: number, focus: string | undefined): string {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const left = [problems > 0 && count(problems, 'problem', 'problems'), advice > 0 && count(advice, 'piece of advice', 'pieces of advice')].filter(Boolean).join(' and ');
  if (left) return `not done — ${left} to fix${focus ? ' on this part' : ''}`;
  return focus ? 'nothing to fix on this part — look at the whole board before finishing' : 'done — nothing to fix';
}

/** Whether a finding is about the part at `focus` ("/parts/pump"): at it or inside it, or naming it. */
function concerns(finding: { path?: string; message: string }, focus: string): boolean {
  return finding.path === focus || !!finding.path?.startsWith(`${focus}/`) || finding.message.includes(`(${focus})`);
}

/** Where in the board a place in the view document it is drawn from is: the part drawn there (`/parts/<id>`), and the
 *  item of a part made per item. `undefined` for a place that is no part. */
function partAt(board: Board, picture: ViewDocument, path: string): { path: string; item?: string } | undefined {
  let id: unknown;
  try {
    id = (getByPointer(picture, path) as { id?: unknown } | undefined)?.id;
  } catch {
    return undefined;
  }
  if (typeof id !== 'string') return undefined;
  if (Object.hasOwn(board.parts, id)) return { path: `/parts/${pointerKey(id)}` };
  const cut = id.indexOf('/');
  const part = cut > 0 ? id.slice(0, cut) : undefined;
  return part !== undefined && Object.hasOwn(board.parts, part) ? { path: `/parts/${pointerKey(part)}`, item: id.slice(cut + 1) } : undefined;
}

/** A finding about the view document a board is drawn from, said of the board: at the part, naming the parts it names
 *  by where they are in the board — the writer never sees the view document. */
function inBoard<P extends { path?: string; message: string }>(board: Board, picture: ViewDocument, finding: P): P {
  const message = finding.message.replace(/\((\/[^)\s]+)\)/g, (whole, path: string) => {
    const named = partAt(board, picture, path);
    return named ? `(${named.path})` : whole;
  });
  const at = finding.path ? partAt(board, picture, finding.path) : undefined;
  if (!at) return { ...finding, message };
  return { ...finding, path: at.path, message: at.item === undefined ? message : `${message} — its item "${at.item}"` };
}

/** Where the view document draws the part `focus` names ("/parts/pump"): its first node or grid item. */
function inPicture(picture: ViewDocument, focus: string): string {
  const named = /^\/parts\/(.+)$/.exec(focus);
  if (!named) throw new Error(`focus a part: "/parts/<id>" — not ${focus}`);
  const id = named[1]!.replace(/~1/g, '/').replace(/~0/g, '~');
  const drawn = (picture.kind === 'canvas' ? picture.nodes.map((n, i) => ({ id: n.id, at: `/nodes/${i}` })) : placedAt(picture).map(({ placed, at }) => ({ id: placed.id, at })))
    .find(p => p.id === id || p.id.startsWith(`${id}/`));
  if (!drawn) throw new Error(`nothing drawn for ${focus} — get_board gives the parts`);
  return drawn.at;
}

const pointerKey = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');

/** A board with nothing on it yet, of a kind. */
function emptyBoard(kind: 'grid' | 'canvas'): Board {
  return { parts: {}, layout: kind === 'grid' ? { kind: 'grid', items: [] } : { kind: 'canvas', size: [1600, 900], place: {} } };
}

/** Refuses a board that does not pass its check, as saving would — before anything is saved. */
function refuseInvalid(issues: Array<{ path: string; message: string }>, message: string): void {
  if (issues.length > 0) throw new UBoardApiError(400, { code: 'INVALID_DOCUMENT', issues: issues.slice(0, 50), message });
}

async function tool(run: () => Promise<unknown> | unknown): Promise<ToolResult> {
  try {
    return ok(await run());
  } catch (error) {
    return failed(error);
  }
}

/** What to do when a source could not be read, by the reason — a reading that failed says where to go next; without
 *  it, an assistant that cannot find a path keeps guessing new ones. */
const UNREAD: Record<string, string> = {
  address:
    'The source has nothing at this path. Its paths are in its description (list_sources) or its own documentation — read that, or ask the person for the request (the path and its query); do not guess them.',
  auth: 'The source refused the credential it was given. Its owner fixes that in the console; a board cannot.',
  throttled: 'The source asks for fewer requests. Wait before reading it again.',
  format: 'The source answered, but not with JSON — this path is not one a binding can read.',
  source:
    'The source answered, but said in its answer that it could not serve the request — its words are in message (a key it does not accept, a query it rejects, a spent quota). A key is fixed by the source’s owner in the console; a query, by the path.',
  transport: 'The source could not be reached. Try again later, or ask the person whether it is up.',
};

const boardId = z.string().min(1).max(100).describe('The board id, from list_boards.');
const revision = z.number().int().positive().optional().describe('The revision the change was made against (from get_board). A board saved since answers 412.');
/** Said when a writer nests an object in its own first key — the commonest shape mistake, and one the plain schema
 *  error ("expected one of …") does not explain. */
const WRAPPED = (key: string, shape: string) => (issue: { input?: unknown }) =>
  typeof issue.input === 'object' && issue.input !== null && key in issue.input
    ? `this is wrapped in "${key}" — write ${shape} itself, not { "${key}": { … } }`
    : undefined;
const operation = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test'], { error: WRAPPED('op', '{ "op": "add", "path": "/…", "value": … }') }),
  path: z.string().describe('A JSON Pointer: "/parts/pump" is a part, "/layout/items/-" appends to a grid.'),
  value: z.unknown().optional().describe('For add, replace and test.'),
  from: z.string().optional().describe('For move and copy.'),
});
const patch = z.array(operation).min(1).describe('A JSON Patch (RFC 6902), applied entirely or not at all.');
// `additionalProperties: true`, not the `{}` a passthrough object is written as: a widely used open-model tool-call
// parser (vLLM's, serving Qwen) rewrites the values under an empty schema — arrays came back as objects — and the
// model was told off for what it never sent.
const document = z
  .looseObject({})
  .superRefine((value, ctx) => {
    if ('parts' in value) return;
    const wrapper = Object.keys(value).find(key => typeof value[key] === 'object' && value[key] !== null && 'parts' in (value[key] as object));
    if (wrapper) ctx.addIssue({ code: 'custom', message: `this is wrapped in "${wrapper}" — write the board { … } itself, not { "${wrapper}": { … } }` });
  })
  .meta({ additionalProperties: true })
  .describe('A whole board: { data?, parts, layout, … } — describe("rules").');

/** A tool an assistant draws boards with: what the MCP server lists, and what any other host of a model (the
 *  console's chat panel) offers it — the same names, descriptions, inputs and answers. */
export interface BoardTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject;
  annotations?: { destructiveHint?: boolean; idempotentHint?: boolean };
  run(args: never): Promise<ToolResult>;
}

export interface BoardToolsOptions {
  /** Draws a saved board as a picture; without one there is no `look`. */
  looker?: Looker;
  /** Whether `board_state` is offered — it reads through the share route, which takes an API token, not a console
   *  session. True when left out. */
  boardState?: boolean;
}

/**
 * The tools an AI assistant reads and draws a workspace's boards with, through `client`. Few tools, each a whole task;
 * reads take a JSON Pointer so only the part needed travels; changes are JSON Patches answered with the new revision
 * and advice — never the document again. Nothing here needs Node: the MCP server registers them, and a browser can
 * hand them to a model as they are.
 */
export function boardTools(client: UBoardClient, { looker, boardState = true }: BoardToolsOptions = {}): BoardTool[] {
  const tools: BoardTool[] = [];
  function define<S extends z.ZodObject>(name: string, config: { description: string; inputSchema: S; annotations?: BoardTool['annotations'] }, run: (args: z.infer<S>) => Promise<ToolResult>): void {
    tools.push({ name, ...config, run: run as BoardTool['run'] });
  }

  define(
    'describe',
    {
      description: 'What a U-Board board can hold and how to write one. No topic: the list of topics. Start with "rules".',
      inputSchema: z.strictObject({
        topic: z.string().max(200).optional().describe(`One of: ${Object.keys(TOPICS).join(', ')}.`),
        pointer: z.string().max(200).optional().describe('With topic "schema": the JSON Pointer of one part, e.g. "/$defs/query".'),
      }),
    },
    async ({ topic, pointer }) => tool(() => describeTopic(topic, pointer))
  );

  define(
    'list_boards',
    { description: "The workspace's boards: id, name, kind (canvas or grid), when last saved.", inputSchema: z.strictObject({}) },
    async () => tool(async () => ({ workspace: (await client.tokenInfo()).workspace, boards: await client.listBoards() }))
  );

  define(
    'get_board',
    {
      description: 'A board, or one part of it by JSON Pointer ("/parts/pump", "/data", "/layout"), with its revision.',
      inputSchema: z.strictObject({
        board: boardId,
        pointer: z.string().max(200).optional().describe('A JSON Pointer into the board. Omit for the whole board.'),
      }),
    },
    async ({ board, pointer }) =>
      tool(async () => {
        const found = await client.getBoard(board);
        const read = found.document;
        return {
          id: found.id,
          name: found.name,
          revision: found.revision,
          kind: read.layout.kind,
          ...(pointer ? { pointer, value: getByPointer(read, pointer) } : { document: read }),
        };
      })
  );

  if (boardState) {
    define(
      'board_state',
      {
        description:
          'What a saved board shows now, part by part: the state each part is in (its states rule), its connection quality and why, how old its data is — no values, a few hundred bytes. Ask it before look to check what a change does to the states; look shows how it is drawn.',
        inputSchema: z.strictObject({ board: boardId }),
      },
      async ({ board }) => tool(() => client.getBoardState(board))
    );
  }

  define(
    'create_board',
    {
      description: 'Makes a board of a kind ("grid" for an ordinary dashboard, "canvas" to place over a drawing), optionally with a whole first board.',
      inputSchema: z.strictObject({
        name: z.string().min(1).max(200),
        kind: z.enum(['grid', 'canvas']),
        document: document.optional(),
      }),
    },
    async ({ name, kind, document }) =>
      tool(async () => {
        // A refused first board makes no board: checked here first, as the server would — and should the server still
        // refuse it, the board just made is taken away again, so a retry never leaves empty boards behind.
        const first = (document as unknown as Board | undefined) ?? emptyBoard(kind);
        const { issues } = checkBoard(first);
        const laidOut = (first as { layout?: { kind?: unknown } }).layout?.kind;
        if (laidOut !== undefined && laidOut !== kind) issues.unshift({ path: '/layout/kind', message: `expected "${kind}", the kind asked for — got "${String(laidOut)}"` });
        refuseInvalid(issues, 'no board was made — fix the board and call create_board again');
        const created = await client.createBoard(name, kind);
        try {
          return await client.putDocument(created.id, first, created.revision);
        } catch (error) {
          await client.deleteBoard(created.id).catch(() => {});
          if (error instanceof UBoardApiError) error.body.message = 'no board was made — the server refused the board';
          throw error;
        }
      })
  );

  define(
    'delete_board',
    {
      description:
        'Deletes a board for good — one you made and no longer need, or one the user asked you to remove. A data source is removed by a person in the console.',
      inputSchema: z.strictObject({ board: boardId }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ board }) =>
      tool(async () => {
        await client.deleteBoard(board);
        return { deleted: board };
      })
  );

  define(
    'rename_board',
    {
      description:
        'Renames a board. Its id stays, and with it the links it is shared by and its history — rename it rather than making a new board and deleting the old one. The name is not part of the document.',
      inputSchema: z.strictObject({ board: boardId, name: z.string().trim().min(1).max(200) }),
      annotations: { idempotentHint: true },
    },
    async ({ board, name }) =>
      tool(async () => {
        const saved = await client.renameBoard(board, name);
        return { id: saved.id, name: saved.name, revision: saved.revision };
      })
  );

  define(
    'patch_board',
    {
      description: 'Changes part of a board with a JSON Patch, applied entirely or not at all, and saves it. Answers the new revision and advice.',
      inputSchema: z.strictObject({ board: boardId, revision, patch }),
    },
    async ({ board, revision, patch }) =>
      tool(async () => {
        return client.patchDocument(board, patch, revision);
      })
  );

  define(
    'validate',
    {
      description: 'Checks without saving: a whole board, or what a board would become with a patch. Answers issues (each with its path) and advice.',
      inputSchema: z.strictObject({ document: document.optional(), board: boardId.optional(), patch: patch.optional() }),
    },
    async ({ document, board, patch }) =>
      tool(async () => {
        let candidate: unknown = document;
        let revision: number | undefined;
        if (candidate === undefined) {
          if (!board || !patch) throw new Error('give a document, or a board and a patch');
          const current = await client.getBoard(board);
          revision = current.revision;
          candidate = applyJsonPatch(current.document, patch);
        }
        const { issues, advice } = checkBoard(candidate);
        // As saving advises: a read whose source is not one of the workspace's.
        if (issues.length === 0) advice.push(...sourceAdvice(candidate as Board, await client.listSources()));
        // A check of a change to a board saves nothing: say so, with the revision the change is to be sent on — a
        // writer that took the check for the save sends the next patch on a revision the board never reached.
        const unsaved = revision !== undefined && issues.length === 0 && { next: `nothing is saved yet — send this patch with patch_board, on revision ${revision}` };
        return { valid: issues.length === 0, issues, advice, ...unsaved };
      })
  );

  if (looker) {
    define(
      'look',
      {
        description: looker.picture === false
          ? 'Draws a saved board as its viewers see it and answers what went wrong while drawing (problems: an element’s error, a widget whose content runs past its box, values not live) and the advice that stands (parts drawn over one another) — no picture. Look after a change, then fix what it reports and advises. `focus` a part for only its problems and advice.'
          : 'Draws a saved board as its viewers see it and answers a picture of it, with what went wrong while drawing (problems: an element’s error, a widget whose content runs past its box, values not live) and the advice that stands (parts drawn over one another). Look after a change, then fix what you see and what it advises. `focus` a part to see it up close — and only its problems and advice.',
        inputSchema: z.strictObject({
          board: boardId,
          focus: z.string().max(200).optional().describe('One part: "/parts/<id>".'),
          appearance: z.enum(['light', 'dark']).optional().describe('Draw it on this paper instead of the board’s own — to check the other one.'),
          width: z.number().int().min(320).max(2560).optional().describe('The screen width, px (1600).'),
          height: z.number().int().min(240).max(1600).optional().describe('The screen height, px (900).'),
        }),
      },
      async ({ board, focus, appearance, width = 1600, height = 900 }) => {
        try {
          const found = await client.getBoard(board);
          const read = found.document;
          // What the viewers' page draws: the board's picture, made by the server with its data's items.
          const { picture } = found;
          const { image, report } = await looker.look({ board, focus: focus && inPicture(picture, focus), appearance, width, height }, picture);
          // What saving advised stands until it is fixed: the picture's last word must not read as «nothing wrong» over it.
          // Up close, every layout finding is read before keeping the part's own — a fold past the limit would hide some.
          const layout = lintViewDocument(picture, focus ? { geometryLimit: Infinity } : {}).map(a => inBoard(read, picture, a));
          const advice = [...checkBoard(read).advice, ...layout].filter(a => !focus || concerns(a, focus));
          // A folded line stands for the findings it counts.
          const left = advice.reduce((n, a) => n + ((a as { count?: number }).count ?? 1), 0);
          // What went wrong while drawing is the whole board's; up close, only the part's — as its advice is.
          const seen = [
            ...report.problems.map(p => inBoard(read, picture, p)),
            // Items placed by their fields that were left out: no number in a field, or outside the frame.
            ...Object.entries(found.unplaced ?? {}).map(([part, count]) => ({
              path: `/parts/${part}`,
              message: `${count} item${count === 1 ? '' : 's'} of "${part}" ${count === 1 ? 'is' : 'are'} not drawn: no number in the fields its place names, or outside its frame — check "at" and "frame"`,
            })),
          ];
          const problems = focus ? seen.filter(p => concerns(p, focus)) : seen;
          const said = { type: 'text' as const, text: JSON.stringify({ revision: found.revision, status: lookStatus(problems.length, left, focus), ...report, problems, advice }) };
          return { content: image ? [{ type: 'image' as const, data: image, mimeType: 'image/png' }, said] : [said] };
        } catch (error) {
          return failed(error);
        }
      }
    );
  }

  define(
    'list_sources',
    {
      description:
        "The workspace's data sources: id (a data read's `from`), name, the description its owner wrote — the paths it answers and what each holds — and, for one called over HTTP, its base URL and how it authenticates; for one that answers what is stored (`static`), the paths it has answers at and whether they are example data (`sample`). Never a credential.",
      inputSchema: z.strictObject({}),
    },
    async () =>
      tool(async () => ({
        // A static source's answers are read with sample_source, path by path — listed, they could be a table each.
        sources: (await client.listSources()).map(({ answers, ...source }) => (answers === undefined ? source : { ...source, paths: Object.keys(answers) })),
      }))
  );

  define(
    'sample_source',
    {
      description:
        "Reads a request from a data source and answers what the response looks like — each value's JSON Pointer, type and an example, and for each list of objects the fields that tell its items apart — not the response itself. Use it to choose a binding's ref.",
      inputSchema: z.strictObject({
        source: z.string().min(1).max(100).describe('The data source id, from list_sources — or its name, when no other source has it.'),
        path: z.string().min(1).max(2000).describe('The request, relative to the source’s base URL: "/api/readings?line=1".'),
        timeZone: z
          .string()
          .min(1)
          .max(64)
          .optional()
          .describe('For a path with time places ({{now:yyyyMMdd}}): the IANA zone whose clock they are read on, as the binding will have it.'),
        requestTime: z
          .strictObject({ delaySeconds: z.number().min(0).optional(), stepSeconds: z.number().gt(0).optional() })
          .optional()
          .describe('For a path with time places: the binding’s requestTime, so the request asks for the time the binding will.'),
      }),
    },
    async ({ source, path, timeZone, requestTime }) =>
      tool(async () => {
        const { id, read } = await readSource(source, { path, ...(timeZone && { timeZone }), ...(requestTime && { requestTime }) });
        // Named by its name: the answer gives the id, which is what a binding's adapter takes.
        const named = id !== source ? { source: id, note: `"${source}" is this source's name; a binding's adapter takes its id` } : {};
        if (read.quality === 'disconnected') return { ...named, read: false, reason: read.reason, message: read.message, next: UNREAD[read.reason ?? ''] ?? UNREAD.transport };
        return { ...named, read: true, quality: read.quality, shape: shapeOf(read.value) };
      })
  );

  /** A request read from a source named as people name it — by its id, or else by its name (case and spaces aside) when
   *  only that one source has it. Two of the same name are not guessed between: their ids are said instead. */
  async function readSource(source: string, ref: Parameters<UBoardClient['resolve']>[1]): Promise<{ id: string; read: Awaited<ReturnType<UBoardClient['resolve']>> }> {
    try {
      return { id: source, read: await client.resolve(source, ref) };
    } catch (error) {
      if (!(error instanceof UBoardApiError && error.status === 404)) throw error;
      const key = source.trim().toLowerCase();
      const named = (await client.listSources()).filter(s => s.name.trim().toLowerCase() === key);
      if (named.length > 1) throw new UBoardApiError(404, { code: 'NOT_FOUND', message: `${named.length} sources are named "${source}" — use one's id: ${named.map(s => s.id).join(', ')}` });
      if (named.length === 0) throw error;
      return { id: named[0].id, read: await client.resolve(named[0].id, ref) };
    }
  }

  define(
    'create_source',
    {
      description:
        'Makes a data source that needs no credential: a public or internal API with no key (`baseUrl`), or — when no source has the values yet — one that answers what you store in it (`answers`), read by path as any source is; mark example values `sample: true`, and say the board shows example data. A source that needs a key, token or OAuth is made by a person in the console — ask them, then use its id.',
      inputSchema: z.strictObject({
        name: z.string().min(1).max(200),
        baseUrl: z.string().url().max(2000).optional().describe('Where the requests go, e.g. "https://api.example.com". Not with `answers`.'),
        answers: z
          .array(
            z.strictObject({
              path: z.string().regex(/^\/[^?]*$/).max(2000).describe('The request path it answers at: "/equipment" (a query in a read is ignored).'),
              answer: z.unknown().describe('What it answers there, as an HTTP source would: an object, a list of rows, a value.'),
            })
          )
          .min(1)
          .max(50)
          .optional()
          .describe('A source that answers what is stored in it, by path — example data or a reference table. Not with `baseUrl`.'),
        sample: z.boolean().optional().describe('With `answers`: they are example data — a board that reads them says so under it.'),
        attribution: z.strictObject({ text: z.string().min(1).max(200), url: z.string().url().optional() }).optional().describe('How the source asks to be credited, shown under a board that uses it.'),
        description: z.string().min(1).max(2000).optional().describe('The paths it answers and what each holds, for whoever binds to it next: "GET /readings?line=N — one row per machine, by id".'),
        sourceError: z
          .strictObject({
            path: z.string().regex(/^\/./).describe('A JSON Pointer to the status the source writes in its answer: "/code", "/response/header/resultCode".'),
            ok: z.array(z.string().min(1)).min(1).optional().describe('The statuses that mean success ("00"). Absent: the source writes a status there only when it fails.'),
            messagePath: z.string().regex(/^\/./).optional().describe('A JSON Pointer to its words for the error: "/message".'),
          })
          .optional()
          .describe('For a source that answers an error with success (HTTP 200) and a status in the body — where it says so, so a read fails with its words instead of a missing value.'),
      }),
    },
    async ({ name, baseUrl, answers, sample, attribution, description, sourceError }) =>
      tool(async () => {
        if ((baseUrl === undefined) === (answers === undefined)) throw new Error('give a source either a `baseUrl` (an API it calls) or `answers` (what it answers by path), not both or neither');
        if (answers !== undefined) {
          if (sourceError !== undefined) throw new Error('`sourceError` is for a source called over HTTP — a source with `answers` answers what you stored');
          const byPath = Object.fromEntries(answers.map(({ path, answer }) => [path, answer]));
          return { source: await client.createSource({ name, answers: byPath, ...(sample !== undefined && { sample }), attribution, description }) };
        }
        if (sample !== undefined) throw new Error('`sample` is for a source with `answers`');
        return { source: await client.createSource({ name, baseUrl: baseUrl!, attribution, description, sourceError }) };
      })
  );

  return tools;
}
