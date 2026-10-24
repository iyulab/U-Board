import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { BoardTool } from '@iyulab/u-board-mcp/tools';
import { languageOf, panelTools, readPrimer, runTurn, systemPrompt, type TurnEvent } from './assistant-loop.js';
import { chatCompletionsUrl, streamChat, type ChatMessage } from './chat-model.js';

const SETTINGS = { baseUrl: 'https://models.example.com/v1/', model: 'm', apiKey: 'k' };

/** A chat completions endpoint that answers each request with the next of `answers`, streamed in small pieces. */
function endpoint(answers: Array<Array<Record<string, unknown>>>) {
  const requests: Array<{ url: string; body: { messages: ChatMessage[]; tools: unknown[]; stream: boolean }; headers: Record<string, string> }> = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), body: JSON.parse(String(init!.body)), headers: init!.headers as Record<string, string> });
    const deltas = answers[requests.length - 1] ?? [{ content: 'done' }];
    const text = deltas.map(delta => `data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`).join('') + 'data: [DONE]\n\n';
    // Cut across event boundaries, as a network does.
    const bytes = new TextEncoder().encode(text);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
        controller.close();
      },
    });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }) as typeof fetch;
  return { requests, fetchImpl };
}

function fakeTool(name: string, answer: (args: Record<string, unknown>) => { text: string; isError?: boolean }, calls: unknown[] = []): BoardTool {
  return {
    name,
    description: `the ${name} tool`,
    inputSchema: z.strictObject({ board: z.string().optional(), patch: z.array(z.unknown()).optional(), focus: z.string().optional() }),
    run: (async (args: Record<string, unknown>) => {
      calls.push(args);
      const { text, isError } = answer(args);
      return { content: [{ type: 'text', text }], ...(isError && { isError }) };
    }) as BoardTool['run'],
  };
}

describe('the model endpoint', () => {
  it('is asked at chat/completions, with the key as a bearer token, streamed', async () => {
    const { requests, fetchImpl } = endpoint([[{ content: '안녕' }, { content: '하세요' }]]);
    const answer = await streamChat(SETTINGS, [{ role: 'user', content: 'hi' }], [], {}, undefined, fetchImpl);
    expect(chatCompletionsUrl(SETTINGS.baseUrl)).toBe('https://models.example.com/v1/chat/completions');
    expect(requests[0].url).toBe('https://models.example.com/v1/chat/completions');
    expect(requests[0].headers.Authorization).toBe('Bearer k');
    expect(requests[0].body.stream).toBe(true);
    expect(answer).toEqual({ content: '안녕하세요', toolCalls: [] });
  });

  it('puts a tool call back together from its pieces', async () => {
    const { fetchImpl } = endpoint([
      [
        { reasoning_content: 'let me think' },
        { tool_calls: [{ index: 0, id: 'c1', function: { name: 'get_', arguments: '{"bo' } }] },
        { tool_calls: [{ index: 0, function: { name: 'board', arguments: 'ard":"b1"}' } }] },
      ],
    ]);
    const thought: string[] = [];
    const answer = await streamChat(SETTINGS, [], [], { onThinking: () => thought.push('thinking') }, undefined, fetchImpl);
    expect(thought).toEqual(['thinking']);
    expect(answer.toolCalls).toEqual([{ id: 'c1', type: 'function', function: { name: 'get_board', arguments: '{"board":"b1"}' } }]);
  });

  it('says what the endpoint answered when it refuses', async () => {
    const fetchImpl = (async () => new Response('{"error":"model not found"}', { status: 404 })) as typeof fetch;
    await expect(streamChat(SETTINGS, [], [], {}, undefined, fetchImpl)).rejects.toThrow(/404.*model not found/);
  });
});

describe('a turn', () => {
  const board = { id: 'b1', name: 'Line 1', kind: 'grid' };

  it('runs the tools the model calls, answers them, and goes on until the model answers in words', async () => {
    const { requests, fetchImpl } = endpoint([
      [{ tool_calls: [{ index: 0, id: 'c1', function: { name: 'patch_board', arguments: '{"board":"b1","patch":[{"op":"add"}]}' } }] }],
      [{ content: '그렸습니다.' }],
    ]);
    const calls: unknown[] = [];
    const events: TurnEvent[] = [];
    const history: ChatMessage[] = [{ role: 'system', content: systemPrompt(board) }, { role: 'user', content: '그려줘' }];
    await runTurn(SETTINGS, history, [fakeTool('patch_board', () => ({ text: '{"revision":5}' }), calls)], board, e => events.push(e), undefined, fetchImpl);

    expect(calls).toEqual([{ board: 'b1', patch: [{ op: 'add' }] }]);
    expect(events.map(e => e.type)).toEqual(['tool-start', 'tool-end', 'board-changed', 'text']);
    // The second request carries the call and its answer — and, read last, the person's language named again.
    expect(requests[1].body.messages.slice(-3)).toEqual([
      { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'patch_board', arguments: '{"board":"b1","patch":[{"op":"add"}]}' } }] },
      { role: 'tool', tool_call_id: 'c1', content: '{"revision":5}' },
      { role: 'user', content: '(다음 메시지는 한국어로 쓰세요.)' },
    ]);
    // Only sent: the history keeps the conversation as it was, so the reminder does not pile up.
    expect(history.some(m => m.content === '(다음 메시지는 한국어로 쓰세요.)')).toBe(false);
    // The first request ends with the person's own words: nothing to remind of yet.
    expect(requests[0].body.messages.at(-1)).toEqual({ role: 'user', content: '그려줘' });
    expect(requests[0].body.tools).toEqual([{ type: 'function', function: { name: 'patch_board', description: 'the patch_board tool', parameters: expect.objectContaining({ type: 'object' }) } }]);
  });

  it('answers a call it cannot run with what is wrong, without telling the editor the board changed', async () => {
    const { requests, fetchImpl } = endpoint([
      [
        { tool_calls: [{ index: 0, id: 'c1', function: { name: 'patch_board', arguments: '{"board":"b1","extra":1}' } }] },
        { tool_calls: [{ index: 1, id: 'c2', function: { name: 'paint', arguments: '{}' } }] },
        { tool_calls: [{ index: 2, id: 'c3', function: { name: 'patch_board', arguments: '{"board":' } }] },
      ],
      [{ content: 'ok' }],
    ]);
    const events: TurnEvent[] = [];
    await runTurn(SETTINGS, [], [fakeTool('patch_board', () => ({ text: '{}' }))], board, e => events.push(e), undefined, fetchImpl);
    const answers = requests[1].body.messages.filter(m => m.role === 'tool').map(m => JSON.parse((m as { content: string }).content));
    expect(answers[0].error).toBe('invalid arguments');
    expect(answers[1].error).toContain('no tool "paint"');
    expect(answers[2].error).toContain('not JSON');
    expect(events.some(e => e.type === 'board-changed')).toBe(false);
  });

  it('does not tell the editor a refused change happened', async () => {
    const { fetchImpl } = endpoint([[{ tool_calls: [{ index: 0, id: 'c1', function: { name: 'patch_board', arguments: '{"board":"b1"}' } }] }], [{ content: 'ok' }]]);
    const events: TurnEvent[] = [];
    await runTurn(SETTINGS, [], [fakeTool('patch_board', () => ({ text: '{"status":412}', isError: true }))], board, e => events.push(e), undefined, fetchImpl);
    expect(events.find(e => e.type === 'tool-end')).toMatchObject({ ok: false });
    expect(events.some(e => e.type === 'board-changed')).toBe(false);
  });

  it('sends a model that answers with problems left back to fix them, and stops sending it back after two tries', async () => {
    const look = (status: string) => [{ tool_calls: [{ index: 0, id: `l-${status}`, function: { name: 'look', arguments: '{"board":"b1"}' } }] }];
    const { requests, fetchImpl } = endpoint([look('a'), [{ content: 'done?' }], look('b'), [{ content: 'done?' }], look('c'), [{ content: 'gave up' }]]);
    const events: TurnEvent[] = [];
    const lookTool = fakeTool('look', () => ({ text: '{"status":"not done — 1 problem to fix"}' }));
    await runTurn(SETTINGS, [], [lookTool], board, e => events.push(e), undefined, fetchImpl);
    expect(events.filter(e => e.type === 'follow-up')).toEqual([{ type: 'follow-up', reason: 'problems' }, { type: 'follow-up', reason: 'problems' }]);
    expect(requests).toHaveLength(6);
    expect(requests[2].body.messages.at(-1)).toMatchObject({ role: 'user', content: expect.stringContaining('not done') });
  });

  it('asks for a look when the board changed after the last one, and lets a clean look end the turn', async () => {
    const { requests, fetchImpl } = endpoint([
      [{ tool_calls: [{ index: 0, id: 'p', function: { name: 'patch_board', arguments: '{"board":"b1"}' } }] }],
      [{ content: 'done' }],
      [{ tool_calls: [{ index: 0, id: 'l', function: { name: 'look', arguments: '{"board":"b1"}' } }] }],
      [{ content: 'done, checked' }],
    ]);
    const events: TurnEvent[] = [];
    const tools = [fakeTool('patch_board', () => ({ text: '{}' })), fakeTool('look', () => ({ text: '{"status":"done — nothing to fix"}' }))];
    await runTurn(SETTINGS, [], tools, board, e => events.push(e), undefined, fetchImpl);
    expect(events.filter(e => e.type === 'follow-up')).toEqual([{ type: 'follow-up', reason: 'unchecked' }]);
    expect(requests).toHaveLength(4);
  });

  it('never sends a model back when the panel has no look to check with', async () => {
    const { requests, fetchImpl } = endpoint([[{ tool_calls: [{ index: 0, id: 'p', function: { name: 'patch_board', arguments: '{"board":"b1"}' } }] }], [{ content: 'done' }]]);
    await runTurn(SETTINGS, [], [fakeTool('patch_board', () => ({ text: '{}' }))], board, () => {}, undefined, fetchImpl);
    expect(requests).toHaveLength(2);
  });

  it('starts the model with the rules the panel read itself — the workflow and the board language — so it need not ask for them', async () => {
    const topics: unknown[] = [];
    const describe = fakeTool('describe', args => (topics.push((args as { topic?: string }).topic), { text: 'the rules text' }));
    const primer = await readPrimer([describe]);
    expect(primer).toEqual({ rules: 'the rules text' });
    expect(topics).toEqual(['rules']);
    const prompt = systemPrompt(board, { rules: 'RULES' });
    expect(prompt).toContain('do not read them again');
    expect(prompt).toMatch(/# The rules\s+RULES\s+# Last: your language/);
    expect(prompt).toContain('describe({ "topic": "kind:<a>,<b>" })');
    expect(prompt).not.toContain('edit_board');
    expect(systemPrompt(board)).toContain('Before the first change, read describe');
    expect(await readPrimer([])).toBeUndefined();
  });

  it('names the language of the first message to the model, from its script — the person’s own words otherwise', () => {
    expect([languageOf('물류센터 현황을 그려줘'), languageOf('倉庫の出荷状況'), languageOf('仓库出货情况'), languageOf('Draw the warehouse')]).toEqual(['Korean', 'Japanese', 'Chinese', undefined]);
    const prompt = systemPrompt(board, { rules: 'RULES' }, 'Korean');
    expect(prompt.startsWith('Write every message in Korean.')).toBe(true);
    expect(prompt).toMatch(/is in Korean, not the language of the rules above\.$/);
    expect(systemPrompt(board)).toContain('Write every message in the language the person writes in.');
  });

  it('offers the tools that draw the open board, not the ones that make or delete boards', () => {
    const names = panelTools(['create_board', 'delete_board', 'patch_board', 'describe'].map(n => fakeTool(n, () => ({ text: '' })))).map(t => t.name);
    expect(names).toEqual(['patch_board', 'describe']);
    expect(systemPrompt(board)).toContain('id "b1"');
  });
});
