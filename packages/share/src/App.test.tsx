import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { App, SHARE_POLL_INTERVAL_MS, retryDelayMs } from './App.js';
import { apiClock } from './api-base.js';

vi.mock('@iyulab/u-board/viewer', async () => {
  const actual = await vi.importActual('@iyulab/u-board/viewer');
  return {
    ...actual,
    ViewerPage: (props: any) => (
      <div data-testid="viewer-page" data-adapter-ids={props.adapters.map((a: any) => a.id).join(',')} data-attributions={JSON.stringify(props.adapters.map((a: any) => a.attribution ?? null))} data-attribution-shown={String(props.attribution !== false)} data-label={props.ariaLabel} data-poll={props.pollIntervalMs} data-server-clock={String(props.clock === apiClock.now)}>
        {props.initialDocument.background ? 'rendered' : ''}
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

describe('App', () => {
  it('says the address is malformed when board or token query params are missing, without asking the server', async () => {
    setLocation('');
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/공유 링크 주소가 올바르지 않습니다/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches the board and renders ViewerPage on success', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/share/boards/b1', expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }));
  });

  it('says the link has expired when the server answers 410', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: false, headers: new Headers(), status: 410 });
    render(<App />);
    expect(await screen.findByText(/만료되었습니다/)).toBeInTheDocument();
  });

  it('keeps the open board current by polling its values', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    expect((await screen.findByTestId('viewer-page')).dataset.poll).toBe(String(SHARE_POLL_INTERVAL_MS));
  });

  it('measures ages and update times by the server clock, not the screen clock', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    expect((await screen.findByTestId('viewer-page')).dataset.serverClock).toBe('true');
  });

  it('names the board view after the board', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'Line 2 floor', document: DOC, connectorIds: [] }) });
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
        .mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
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
      .mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '지금 다시 시도' }));
    expect(await screen.findByText(/4초 뒤에 다시 시도합니다/)).toBeInTheDocument();
    window.dispatchEvent(new Event('online'));
    expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
  });

  it('waits longer after each failed attempt, holding at a minute', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(retryDelayMs)).toEqual([2_000, 4_000, 8_000, 16_000, 32_000, 60_000, 60_000]);
  });

  it('wires each returned connectorId into a ShareConnectorAdapter, with no DemoAdapter mixed in', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ name: 'A', document: DOC, connectorIds: ['c1', 'c2'] }),
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
      json: async () => ({ name: 'A', document: DOC, connectorIds: ['c1', 'c2'], attributions: { c1: credit } }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(JSON.parse(viewer.dataset.attributions!)).toEqual([credit, null]);
    expect(viewer.dataset.attributionShown).toBe('true');
  });

  it('renders with no adapters when the board has no connectors, rather than falling back to DemoAdapter', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ name: 'A', document: DOC, connectorIds: [] }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(viewer.dataset.adapterIds).toBe('');
  });
});
