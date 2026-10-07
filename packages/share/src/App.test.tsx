import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { App, SHARE_POLL_INTERVAL_MS } from './App.js';
import { apiClock } from './api-base.js';

vi.mock('@iyulab/u-board/viewer', async () => {
  const actual = await vi.importActual('@iyulab/u-board/viewer');
  return {
    ...actual,
    ViewerPage: (props: any) => (
      <div data-testid="viewer-page" data-adapter-ids={props.adapters.map((a: any) => a.id).join(',')} data-label={props.ariaLabel} data-poll={props.pollIntervalMs} data-server-clock={String(props.clock === apiClock.now)}>
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
  it('shows an error when board or token query params are missing', async () => {
    setLocation('');
    render(<App />);
    expect(await screen.findByText(/더 이상 유효하지 않습니다/)).toBeInTheDocument();
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

  it('shows an error when the fetch fails', async () => {
    setLocation('?board=b1&token=bad');
    (fetch as any).mockResolvedValueOnce({ ok: false, headers: new Headers() });
    render(<App />);
    expect(await screen.findByText(/더 이상 유효하지 않습니다/)).toBeInTheDocument();
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

  it('prefixes the board fetch with VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    await screen.findByTestId('viewer-page');
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/share/boards/b1', expect.anything());
    vi.unstubAllEnvs();
  });

  it('strips a trailing slash from VITE_API_BASE_URL to avoid a double slash', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers(), json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    await screen.findByTestId('viewer-page');
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/share/boards/b1', expect.anything());
    vi.unstubAllEnvs();
  });
});
