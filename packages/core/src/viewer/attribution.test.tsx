import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AttributionLine, boardAttributions } from './attribution';
import { ViewerPage } from './ViewerPage';
import { DEFAULT_LABELS } from '../labels';
import type { ViewDocument } from '../view-document';
import type { Adapter, Attribution } from '../adapter';

vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

function adapter(id: string, attribution?: Attribution): Adapter {
  return { id, attribution, resolve: async () => ({ value: 1, quality: 'live' }) };
}

function board(...adapterIds: string[]): ViewDocument {
  return {
    kind: 'canvas',
    background: {},
    connectors: [],
    nodes: adapterIds.map((id, i) => ({
      id: `n${i}`, x: 0, y: 0, anchored: false,
      widget: { type: 'metric', bindings: { 'data.value': { adapter: id, ref: { path: `/${i}` } } } },
    })),
  };
}

const SEOUL = { text: 'Seoul Open Data Plaza (KOGL Type 1)', url: 'https://data.example.org' };
const USGS = { text: 'U.S. Geological Survey' };

describe('boardAttributions', () => {
  it('names each source the board binds to once, in the order the board first uses them', () => {
    const adapters = [adapter('usgs', USGS), adapter('seoul', SEOUL), adapter('seoul-2', SEOUL)];
    expect(boardAttributions(board('seoul', 'usgs', 'seoul', 'seoul-2'), adapters)).toEqual([SEOUL, USGS]);
  });

  it('leaves out a source the board does not bind to, and one that asks for nothing', () => {
    const adapters = [adapter('usgs', USGS), adapter('plain'), adapter('blank', { text: ' ' })];
    expect(boardAttributions(board('plain', 'blank'), adapters)).toEqual([]);
  });
});

describe('AttributionLine', () => {
  it('links an http(s) address and shows any other as text', () => {
    render(<AttributionLine attributions={[SEOUL, { text: 'Bad link', url: 'javascript:alert(1)' }]} labels={DEFAULT_LABELS} />);
    expect(screen.getByRole('link', { name: SEOUL.text })).toHaveAttribute('href', 'https://data.example.org/');
    expect(screen.queryByRole('link', { name: 'Bad link' })).not.toBeInTheDocument();
    expect(screen.getByText(/Bad link/)).toBeInTheDocument();
  });

  it('draws nothing when no source asks to be named', () => {
    const { container } = render(<AttributionLine attributions={[]} labels={DEFAULT_LABELS} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ViewerPage', () => {
  it('names the board’s sources under it, unless the host shows them itself', async () => {
    const { unmount } = render(<ViewerPage adapters={[adapter('seoul', SEOUL)]} initialDocument={board('seoul')} width={400} height={300} />);
    expect(await screen.findByText(/^Data:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SEOUL.text })).toBeInTheDocument();
    unmount();

    render(<ViewerPage adapters={[adapter('seoul', SEOUL)]} initialDocument={board('seoul')} width={400} height={300} attribution={false} />);
    await screen.findByTestId('viewer');
    expect(screen.queryByText(/^Data:/)).not.toBeInTheDocument();
  });
});
