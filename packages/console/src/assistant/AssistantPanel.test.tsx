import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantPanel } from './AssistantPanel.js';

const BOARD = { id: 'b1', name: 'Line 1', kind: 'grid' };
const SETTINGS = { baseUrl: 'https://models.example.com/v1', model: 'test-model', apiKey: 'k' };

const sse = (...deltas: Array<Record<string, unknown>>) =>
  new Response(deltas.map(delta => `data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`).join('') + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });

describe('the assistant panel', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('asks for the model first, and keeps it in this browser', async () => {
    render(<AssistantPanel workspaceId="w1" board={BOARD} lookSetting={{ adapters: [] }} onBoardChanged={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/U-Board 서버를 거치지 않음/)).toBeInTheDocument();
    const save = screen.getByRole('button', { name: '저장' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: '엔드포인트 주소' }), SETTINGS.baseUrl);
    await userEvent.type(screen.getByRole('textbox', { name: '모델' }), SETTINGS.model);
    await userEvent.type(screen.getByLabelText('API 키'), SETTINGS.apiKey);
    await userEvent.click(save);
    expect(JSON.parse(localStorage.getItem('ub-assistant-model')!)).toEqual(SETTINGS);
    expect(screen.getByRole('textbox', { name: '비서에게 보낼 말' })).toBeInTheDocument();
  });

  it('draws with the model: the tool it ran shows as a line, the board is read again, the answer follows', async () => {
    localStorage.setItem('ub-assistant-model', JSON.stringify(SETTINGS));
    const patch = JSON.stringify({ board: 'b1', revision: 3, patch: [{ op: 'add', path: '/parts/a', value: { as: 'stat', of: 'line', show: 'temp' } }] });
    const requests: string[] = [];
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/chat/completions')) {
        const turn = requests.filter(r => r.endsWith('/chat/completions')).length;
        return turn === 1 ? sse({ tool_calls: [{ index: 0, id: 'c1', function: { name: 'patch_board', arguments: patch } }] }) : sse({ content: '숫자 카드를 하나 그렸습니다.' });
      }
      // The board API, on this origin, with the session.
      expect(init?.credentials).toBe('same-origin');
      const answer = (init?.method ?? 'GET') === 'GET'
        ? { id: 'b1', name: 'B', revision: 3, updatedAt: 't', document: { parts: {}, layout: { kind: 'grid', items: [] } } }
        : { id: 'b1', revision: 4, advice: [] };
      return new Response(JSON.stringify(answer), { headers: { 'Content-Type': 'application/json' } });
    });
    const onBoardChanged = vi.fn();
    render(<AssistantPanel workspaceId="w1" board={BOARD} lookSetting={{ adapters: [] }} onBoardChanged={onBoardChanged} onClose={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: '비서에게 보낼 말' }), '카드 하나 그려줘{Enter}');

    // It answered without looking at the board it changed: the panel sends it back to look, twice at most.
    await waitFor(() => expect(screen.getAllByText('숫자 카드를 하나 그렸습니다.')).toHaveLength(3), { timeout: 3000 });
    expect(screen.getAllByText('마지막 변경을 그려 보고 확인합니다')).toHaveLength(2);
    expect(screen.getByText('카드 하나 그려줘')).toBeInTheDocument();
    expect(screen.getByText('보드에 그리기 · 변경 1개')).toBeInTheDocument();
    expect(onBoardChanged).toHaveBeenCalledTimes(1);
    expect(requests).toContain(`PATCH ${window.location.origin}/api/workspaces/w1/boards/b1`);
  });

  it('holds the message while the author has unsaved edits', () => {
    localStorage.setItem('ub-assistant-model', JSON.stringify(SETTINGS));
    render(<AssistantPanel workspaceId="w1" board={BOARD} blocked="먼저 저장하세요" lookSetting={{ adapters: [] }} onBoardChanged={() => {}} onClose={() => {}} />);
    expect(screen.getByText('먼저 저장하세요')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '비서에게 보낼 말' })).toBeDisabled();
    for (const starter of screen.getAllByRole('button').filter(b => b.textContent?.includes('그려줘'))) expect(starter).toBeDisabled();
  });

  it('says plainly when the endpoint cannot be reached', async () => {
    localStorage.setItem('ub-assistant-model', JSON.stringify(SETTINGS));
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    render(<AssistantPanel workspaceId="w1" board={BOARD} lookSetting={{ adapters: [] }} onBoardChanged={() => {}} onClose={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: '비서에게 보낼 말' }), '그려줘{Enter}');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/CORS/));
  });
});
