import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { App, SHARE_POLL_INTERVAL_MS, retryDelayMs, tellEmbeddingPage } from './App.js';
import { apiClock } from './api-base.js';

vi.mock('@iyulab/u-board/viewer', async () => {
  const actual = await vi.importActual('@iyulab/u-board/viewer');
  return {
    ...actual,
    ViewerPage: (props: any) => (
      <div data-testid="viewer-page" data-adapter-ids={props.adapters.map((a: any) => a.id).join(',')} data-attributions={JSON.stringify(props.adapters.map((a: any) => a.attribution ?? null))} data-samples={JSON.stringify(props.adapters.map((a: any) => a.sample === true))} data-attribution-shown={String(props.attribution !== false)} data-label={props.ariaLabel} data-poll={props.pollIntervalMs} data-server-clock={String(props.clock === apiClock.now)}>
        {props.document.background ? 'rendered' : ''}
        <span data-testid="node-ids">{props.document.nodes.map((n: any) => n.id).join(',')}</span>
        <button type="button" onClick={() => props.adapters[0]?.resolve({ path: '/x' })}>
          resolve
        </button>
        <button type="button" data-board={props.boardId} onClick={() => props.onTrigger?.({ name: 'pump-details', node: 'pump', state: 'fault', board: props.boardId })}>
          trigger
        </button>
      </div>
    ),
  };
});

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

function setLocation(search: string) {
  Object.defineProperty(window, 'location', { value: { search, origin: 'http://localhost:5176' }, writable: true });
}

const DOC = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
// The board as stored — the viewer draws the picture the server made of it, never the board itself.
const BOARD = { parts: {}, layout: { kind: 'canvas', size: [400, 300], place: {} } };

describe('App', () => {
  it('says the address is malformed when board or token query params are missing, without asking the server', async () => {
    setLocation('');
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/공유 링크 주소가 올바르지 않습니다/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches the board and renders ViewerPage on success', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
    render(<App />);
    expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/share/boards/b1', expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }));
  });

  it('draws a board from the picture the server made of it', async () => {
    setLocation('?board=b1&token=tok');
    const picture = { ...DOC, nodes: [{ id: 'pump/P1' }, { id: 'pump/P2' }] };
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture, connectorIds: [] }) });
    render(<App />);
    expect(await screen.findByTestId('node-ids')).toHaveTextContent('pump/P1,pump/P2');
  });

  describe('events from a board’s triggers', () => {
    it('names the board to the viewer and hands its events to the embedding page', async () => {
      setLocation('?board=b1&token=tok');
      (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
      const parent = { postMessage: vi.fn() };
      const framed = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window);
      try {
        render(<App />);
        const trigger = await screen.findByRole('button', { name: 'trigger' });
        expect(trigger).toHaveAttribute('data-board', 'b1');
        fireEvent.click(trigger);
        expect(parent.postMessage).toHaveBeenCalledWith({ type: 'u-board:event', name: 'pump-details', board: 'b1', node: 'pump', state: 'fault' }, '*');
      } finally {
        framed.mockRestore();
      }
    });

    it('carries only the name, board, part and state — nothing else an event object might hold', () => {
      const parent = { postMessage: vi.fn() };
      const framed = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window);
      try {
        tellEmbeddingPage({ name: 'opened', board: 'b1', value: 42 } as never);
        expect(parent.postMessage).toHaveBeenCalledWith({ type: 'u-board:event', name: 'opened', board: 'b1', node: undefined, state: undefined }, '*');
      } finally {
        framed.mockRestore();
      }
    });

    it('tells no one when the link is opened on its own', () => {
      const post = vi.spyOn(window, 'postMessage');
      tellEmbeddingPage({ name: 'opened', board: 'b1' });
      expect(post).not.toHaveBeenCalled();
      post.mockRestore();
    });
  });

  describe('a board saved again while it is open', () => {
    const board = (nodeId: string, revision: number) => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ name: 'A', revision, document: BOARD, picture: { ...DOC, nodes: [{ id: nodeId }] }, connectorIds: ['c1'] }),
    });
    const values = (revision: number) => ({ ok: true, status: 200, headers: new Headers(), json: async () => ({ revision, results: [{ value: 1, quality: 'live' }] }) });

    it('shows the new document once a value batch says the board has a newer revision', async () => {
      setLocation('?board=b1&token=tok');
      (fetch as any).mockResolvedValueOnce(board('before', 1)).mockResolvedValueOnce(values(2)).mockResolvedValueOnce(board('after', 2));
      render(<App />);
      expect((await screen.findByTestId('node-ids')).textContent).toBe('before');
      fireEvent.click(screen.getByText('resolve'));
      await vi.waitFor(() => expect(screen.getByTestId('node-ids').textContent).toBe('after'));
      expect(fetch).toHaveBeenLastCalledWith('/api/share/boards/b1', expect.objectContaining({ headers: { Authorization: 'Bearer tok', 'If-None-Match': '"1"' } }));
    });

    it('stops checking once the link turns out expired', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        setLocation('?board=b1&token=tok');
        (fetch as any).mockResolvedValueOnce(board('before', 1)).mockResolvedValueOnce({ ok: false, status: 410, headers: new Headers() });
        render(<App />);
        await screen.findByTestId('node-ids');
        await vi.advanceTimersByTimeAsync(SHARE_POLL_INTERVAL_MS);
        expect(await screen.findByText(/만료되었습니다/)).toBeInTheDocument();
        await vi.advanceTimersByTimeAsync(3 * SHARE_POLL_INTERVAL_MS);
        expect(fetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('takes an answer of the revision on screen as the same board, though the proxy dropped the tag', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        setLocation('?board=b1&token=tok');
        (fetch as any).mockResolvedValueOnce(board('before', 1)).mockResolvedValueOnce(board('same-revision', 1));
        render(<App />);
        await screen.findByTestId('node-ids');
        await vi.advanceTimersByTimeAsync(SHARE_POLL_INTERVAL_MS);
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        await new Promise(r => setTimeout(r, 20));
        expect(screen.getByTestId('node-ids').textContent).toBe('before');
      } finally {
        vi.useRealTimers();
      }
    });

    it('asks for a board with no bindings itself once a poll goes by without a value batch, and follows it', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        setLocation('?board=b1&token=tok');
        const unchanged = { ok: false, status: 304, headers: new Headers() };
        (fetch as any).mockResolvedValueOnce(board('before', 1)).mockResolvedValueOnce(unchanged).mockResolvedValueOnce(board('after', 2));
        render(<App />);
        expect((await screen.findByTestId('node-ids')).textContent).toBe('before');

        await vi.advanceTimersByTimeAsync(SHARE_POLL_INTERVAL_MS);
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(fetch).toHaveBeenLastCalledWith('/api/share/boards/b1', expect.objectContaining({ headers: { Authorization: 'Bearer tok', 'If-None-Match': '"1"' } }));
        expect(screen.getByTestId('node-ids').textContent).toBe('before');

        await vi.advanceTimersByTimeAsync(SHARE_POLL_INTERVAL_MS);
        await vi.waitFor(() => expect(screen.getByTestId('node-ids').textContent).toBe('after'));
      } finally {
        vi.useRealTimers();
      }
    });

    it('reads nothing again while the revision stays the same', async () => {
      setLocation('?board=b1&token=tok');
      (fetch as any).mockResolvedValueOnce(board('before', 1)).mockResolvedValueOnce(values(1));
      render(<App />);
      await screen.findByTestId('node-ids');
      fireEvent.click(screen.getByText('resolve'));
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await new Promise(r => setTimeout(r, 20));
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('node-ids').textContent).toBe('before');
    });

    it('keeps the board on screen when reading the new revision fails, to try again at the next poll', async () => {
      setLocation('?board=b1&token=tok');
      (fetch as any)
        .mockResolvedValueOnce(board('before', 1))
        .mockResolvedValueOnce(values(2))
        .mockResolvedValueOnce({ ok: false, status: 503, headers: new Headers() });
      render(<App />);
      await screen.findByTestId('node-ids');
      fireEvent.click(screen.getByText('resolve'));
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
      await new Promise(r => setTimeout(r, 20));
      expect(screen.getByTestId('node-ids').textContent).toBe('before');
    });
  });

  it('says the link has expired when the server answers 410', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: false, headers: new Headers(), status: 410 });
    render(<App />);
    expect(await screen.findByText(/만료되었습니다/)).toBeInTheDocument();
  });

  it('keeps the open board current by polling its values', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
    render(<App />);
    expect((await screen.findByTestId('viewer-page')).dataset.poll).toBe(String(SHARE_POLL_INTERVAL_MS));
  });

  it('measures ages and update times by the server clock, not the screen clock', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
    render(<App />);
    expect((await screen.findByTestId('viewer-page')).dataset.serverClock).toBe('true');
  });

  it('names the board view after the board', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'Line 2 floor', document: BOARD, picture: DOC, connectorIds: [] }) });
    render(<App />);
    expect((await screen.findByTestId('viewer-page')).dataset.label).toBe('Line 2 floor');
  });

  it('says the link is not valid when the server does not know it (404 — unknown or revoked)', async () => {
    setLocation('?board=b1&token=bad');
    (fetch as any).mockResolvedValueOnce({ ok: false, headers: new Headers(), status: 404 });
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/이 공유 링크는 유효하지 않습니다/);
  });

  // A screen on a wall that opens during a deploy or a cold start must not settle on "this link is
  // dead": the server did not answer, so the viewer says so and tries again on its own.
  it('retries a server that did not answer, and shows the board once it does', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setLocation('?board=b1&token=tok');
      (fetch as any)
        .mockResolvedValueOnce({ ok: false, headers: new Headers(), status: 502 })
        .mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
      render(<App />);
      expect(await screen.findByText(/보드를 불러오지 못했습니다. 2초 뒤에 다시 시도합니다/)).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(retryDelayMs(0));
      expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries at once when asked, or when the network comes back', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }) });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '지금 다시 시도' }));
    expect(await screen.findByText(/4초 뒤에 다시 시도합니다/)).toBeInTheDocument();
    window.dispatchEvent(new Event('online'));
    expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
  });

  it('waits longer after each failed attempt, holding at a minute', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(retryDelayMs)).toEqual([2_000, 4_000, 8_000, 16_000, 32_000, 60_000, 60_000]);
  });

  it('wires each returned connectorId into a ShareConnectorAdapter, and nothing else', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: ['c1', 'c2'] }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(viewer.dataset.adapterIds).toBe('c1,c2');
  });

  it('gives each adapter the credit its source asks for, and always shows it', async () => {
    setLocation('?board=b1&token=tok');
    const credit = { text: 'Seoul Open Data Plaza', url: 'https://data.example.org' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: ['c1', 'c2'], attributions: { c1: credit }, samples: ['c2'] }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(JSON.parse(viewer.dataset.attributions!)).toEqual([credit, null]);
    expect(JSON.parse(viewer.dataset.samples!)).toEqual([false, true]);
    expect(viewer.dataset.attributionShown).toBe('true');
  });

  it('renders with no adapters when the board has no connectors, rather than a stand-in', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ name: 'A', document: BOARD, picture: DOC, connectorIds: [] }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(viewer.dataset.adapterIds).toBe('');
  });
});
