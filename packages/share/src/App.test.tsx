import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { App } from './App.js';

vi.mock('@iyulab/u-board/viewer', async () => {
  const actual = await vi.importActual('@iyulab/u-board/viewer');
  return {
    ...actual,
    ViewerPage: (props: any) => (
      <div data-testid="viewer-page" data-adapter-ids={props.adapters.map((a: any) => a.id).join(',')}>
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
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    expect(await screen.findByTestId('viewer-page')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/share/boards/b1?token=tok');
  });

  it('shows an error when the fetch fails', async () => {
    setLocation('?board=b1&token=bad');
    (fetch as any).mockResolvedValueOnce({ ok: false });
    render(<App />);
    expect(await screen.findByText(/더 이상 유효하지 않습니다/)).toBeInTheDocument();
  });

  it('wires each returned connectorId into a ShareConnectorAdapter alongside the DemoAdapter', async () => {
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'A', document: DOC, connectorIds: ['c1', 'c2'] }),
    });
    render(<App />);
    const viewer = await screen.findByTestId('viewer-page');
    expect(viewer.dataset.adapterIds).toBe('demo-cmms,c1,c2');
  });

  it('prefixes the board fetch with VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr');
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    await screen.findByTestId('viewer-page');
    expect(fetch).toHaveBeenCalledWith('https://api.board.u-platform.kr/share/boards/b1?token=tok');
    vi.unstubAllEnvs();
  });

  it('strips a trailing slash from VITE_API_BASE_URL to avoid a double slash', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr/');
    setLocation('?board=b1&token=tok');
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'A', document: DOC, connectorIds: [] }) });
    render(<App />);
    await screen.findByTestId('viewer-page');
    expect(fetch).toHaveBeenCalledWith('https://api.board.u-platform.kr/share/boards/b1?token=tok');
    vi.unstubAllEnvs();
  });
});
