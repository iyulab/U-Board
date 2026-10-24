// One turn of the chat panel: the person's words go to the model with the board tools; the tools it calls run here,
// on the board the editor has open, and their answers go back — until the model answers in words alone.
import { functionTool, type BoardTool } from '@iyulab/u-board-mcp/tools';
import { ModelError, streamChat, type ChatMessage, type ModelSettings } from './chat-model.js';

/** The tools that change the open board — after one of them succeeds, the editor reads the board again. */
export const BOARD_WRITES = new Set(['patch_board', 'rename_board']);
/** The tools the panel does not offer: it draws the board that is open, it does not make or delete others. */
const LEFT_OUT = new Set(['create_board', 'delete_board']);

/** A turn may call this many tools before the panel stops it — a model caught in a loop of failing patches. */
export const MAX_TOOL_CALLS = 40;
/** How many times a turn is sent back to a model that answered while the board was not done. */
export const MAX_FOLLOW_UPS = 2;

export interface OpenBoard {
  id: string;
  name: string;
  kind: string;
}

export function panelTools(tools: BoardTool[]): BoardTool[] {
  return tools.filter(t => !LEFT_OUT.has(t.name));
}

/** What `describe` answers for the rules — the tools' workflow and the board language, with its kinds of part — read
 *  by the panel before the first turn, so the model starts drawing without asking for them. */
export interface Primer {
  rules: string;
}

/** The language a message is written in, by its script — named to the model, which drifts into the English of the
 *  rules more often when told only "the person's language". None when the script does not say. */
export function languageOf(text: string): string | undefined {
  if (/\p{Script=Hangul}/u.test(text)) return 'Korean';
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return 'Japanese';
  if (/\p{Script=Han}/u.test(text)) return 'Chinese';
  return undefined;
}

/** The reminder sent after the tools' answers, in the language it asks for — words in that language hold the model
 *  there better than English words naming it. */
const REMINDERS: Record<string, string> = {
  Korean: '(다음 메시지는 한국어로 쓰세요.)',
  Japanese: '(次のメッセージは日本語で書いてください。)',
  Chinese: '(下一条消息请用中文写。)',
};

/** What the model is told before the conversation: the board it draws and how to draw it well, in `language` when the
 *  person's first message says which. */
export function systemPrompt(board: OpenBoard, primer?: Primer, language?: string): string {
  const theirs = language ?? 'the language the person writes in';
  return `Write every message in ${theirs}.

You are the drawing assistant in U-Board's board editor. The person sees the board you draw beside this chat, and each change you save appears there at once.

The board open in the editor: id "${board.id}", named "${board.name}", a ${board.kind} board. Draw on this board only — read it with get_board, change it with patch_board (a JSON Patch on the board, every part addressed by its id), check a change with validate when unsure. Its layout stays a ${board.kind}.${board.kind === 'grid' ? ' Parts go in the grid\'s items; a canvas item is only for a plan, a map or a diagram that places things.' : ''}

${
    primer
      ? 'The rules — what describe({ "topic": "rules" }) answers — are at the end of these instructions: do not read them again.'
      : 'Before the first change, read describe({ "topic": "rules" }).'
  } Read describe({ "topic": "kind:<a>,<b>" }) for the kinds of part you have not used, all in one read.

Values come from the workspace's data sources: list_sources names them, and sample_source shows what a path answers, value by value — read before you bind. When no source holds what the person asks for, make one with example values — create_source with answers (by path) and sample: true — draw the board from it, and tell the person the board shows example data and that a live source takes its place by changing a data read's from; a public source that needs no key can be added with create_source and its baseUrl. Never write values into the board itself.

Make it beautiful and easy to read: a clear title, a balanced layout with room around each part, the most important figures largest, a title on every chart. The board's look is said once, in "board" — its theme ("light" or "dark"), accent and skin; parts never set fonts or colours, and statuses are coloured by the board's statuses.

Draw it in a few steps the person can watch: the layout and the main figures first, then the charts, then the finishing touches — each step one patch_board with several operations, not one operation per call. After each step, call look on the board and fix what it reports — a part whose content runs past its box needs more room (a larger span or size) or less in it; go on until look says nothing is left to fix. When a tool answers an error, fix what it says and go on.

Write every message in ${theirs}, from the first sentence on. Answer in two or three plain sentences (no Markdown — the chat shows text as it is): what you drew, and what they could ask for next. Before a step, say in one short sentence — in ${theirs} — what you are about to draw.${primer ? `

# The rules

${primer.rules}

# Last: your language

Every message you write — before a step, between steps, and the answer — is in ${theirs}, not the language of the rules above.` : ''}`;
}

/** Reads the rules with the panel's own `describe`, for `systemPrompt` — none when it cannot. */
export async function readPrimer(tools: BoardTool[]): Promise<Primer | undefined> {
  const describe = tools.find(t => t.name === 'describe');
  if (!describe) return undefined;
  const answer = await describe.run({ topic: 'rules' } as never);
  if (answer.isError) return undefined;
  const rules = answer.content.map(part => (part.type === 'text' ? part.text : '')).join('\n');
  return rules ? { rules } : undefined;
}

export type TurnEvent =
  | { type: 'text'; delta: string }
  | { type: 'thinking' }
  | { type: 'tool-start'; id: string; name: string; args: unknown }
  | { type: 'tool-end'; id: string; name: string; ok: boolean; answer: string }
  | { type: 'board-changed' }
  /** The model answered while the board was not done — looked at with problems left, or changed since its last look —
   *  and the panel sent it back to finish. */
  | { type: 'follow-up'; reason: 'problems' | 'unchecked' };

/**
 * Runs one turn on `history` (which it extends with what the model says and what the tools answer) and resolves when
 * the model is done. `signal` stops it between and during calls.
 */
export async function runTurn(
  settings: ModelSettings,
  history: ChatMessage[],
  tools: BoardTool[],
  board: OpenBoard,
  onEvent: (event: TurnEvent) => void,
  signal?: AbortSignal,
  fetchImpl?: typeof fetch
): Promise<void> {
  const byName = new Map(tools.map(t => [t.name, t]));
  const functions = tools.map(functionTool);
  let calls = 0;
  let followUps = 0;
  // What the last look said, and whether the board was changed after it — a turn is not done while either says so.
  let lookedNotDone = false;
  let changedSinceLook = false;
  const looks = byName.has('look');
  // The language the person writes in, named again where the model reads last: after the tools' answers — English
  // rules, widget specs, look reports — it drifted into English despite the instructions at the top. Sent with each
  // request, never kept in the history, so it does not pile up.
  const first = history.find(m => m.role === 'user');
  const language = typeof first?.content === 'string' ? languageOf(first.content) : undefined;
  const reminder: ChatMessage | undefined = language ? { role: 'user', content: REMINDERS[language] ?? `(Write your next message to the person in ${language}.)` } : undefined;
  for (;;) {
    const { content, toolCalls } = await streamChat(
      settings,
      reminder && history[history.length - 1]?.role === 'tool' ? [...history, reminder] : history,
      functions,
      { onText: delta => onEvent({ type: 'text', delta }), onThinking: () => onEvent({ type: 'thinking' }) },
      signal,
      fetchImpl
    );
    history.push({ role: 'assistant', content: content || null, ...(toolCalls.length > 0 && { tool_calls: toolCalls }) });
    if (toolCalls.length === 0) {
      const reason = !looks || followUps >= MAX_FOLLOW_UPS ? undefined : lookedNotDone ? 'problems' : changedSinceLook ? 'unchecked' : undefined;
      if (!reason) return;
      followUps += 1;
      onEvent({ type: 'follow-up', reason });
      history.push({
        role: 'user',
        content:
          reason === 'problems'
            ? '(The editor checked: your last look still reports problems — the board is not done. Fix each one, look again, and answer only when look says nothing is left to fix.)'
            : '(The editor checked: you changed the board after your last look. Look at it, fix what it reports, then answer.)',
      });
      continue;
    }
    for (const call of toolCalls) {
      signal?.throwIfAborted();
      calls += 1;
      const args = parseArgs(call.function.arguments);
      onEvent({ type: 'tool-start', id: call.id, name: call.function.name, args });
      const { ok, answer } = await runTool(byName.get(call.function.name), call.function.name, args);
      history.push({ role: 'tool', tool_call_id: call.id, content: answer });
      onEvent({ type: 'tool-end', id: call.id, name: call.function.name, ok, answer });
      if (ok && BOARD_WRITES.has(call.function.name) && (args as { board?: unknown } | undefined)?.board === board.id) {
        changedSinceLook = true;
        onEvent({ type: 'board-changed' });
      }
      if (ok && call.function.name === 'look' && !(args as { focus?: unknown } | undefined)?.focus) {
        changedSinceLook = false;
        lookedNotDone = lookSaysNotDone(answer);
      }
    }
    if (calls >= MAX_TOOL_CALLS) throw new ModelError(`도구를 ${MAX_TOOL_CALLS}번 부른 뒤 멈췄습니다 — 보드는 거기까지 저장돼 있습니다. 이어서 하려면 다시 요청하세요.`);
  }
}

/** Whether a look's answer says the board is not done (its `status`, `lookStatus` in the MCP tools). */
function lookSaysNotDone(answer: string): boolean {
  try {
    return String((JSON.parse(answer) as { status?: unknown }).status ?? '').startsWith('not done');
  } catch {
    return false;
  }
}

function parseArgs(text: string): unknown {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** A tool's answer as the model reads it: its text, or what is wrong with the call — as the MCP server answers. */
async function runTool(tool: BoardTool | undefined, name: string, args: unknown): Promise<{ ok: boolean; answer: string }> {
  if (!tool) return { ok: false, answer: JSON.stringify({ error: `there is no tool "${name}"` }) };
  if (args === undefined) return { ok: false, answer: JSON.stringify({ error: 'the arguments are not JSON — send them as one JSON object' }) };
  const parsed = tool.inputSchema.safeParse(args);
  if (!parsed.success) {
    return { ok: false, answer: JSON.stringify({ error: 'invalid arguments', issues: parsed.error.issues.map(i => ({ path: i.path.join('/'), message: i.message })) }) };
  }
  const result = await tool.run(parsed.data as never);
  const answer = result.content.map(part => (part.type === 'text' ? part.text : '[image]')).join('\n');
  return { ok: !result.isError, answer };
}
