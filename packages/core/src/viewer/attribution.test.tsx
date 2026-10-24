import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AttributionLine, boardAttributions, showsExampleData } from './attribution';
import { ViewerPage } from './ViewerPage';
import { DEFAULT_LABELS } from '../labels';
import type { CanvasView } from '../view-document';
import type { Adapter, Attribution } from '../adapter';

vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));

function adapter(id: string, attribution?: Attribution): Adapter {
  return { id, attribution, resolve: async () => ({ value: 1, quality: 'live' }) };
}

function board(...adapterIds: string[]): CanvasView {
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

  it('says first that a board shows example data, alone or before its sources', () => {
    const { unmount } = render(<AttributionLine attributions={[]} example labels={DEFAULT_LABELS} />);
    expect(screen.getByText('Example data')).toBeInTheDocument();
    expect(screen.queryByText(/Data:/)).not.toBeInTheDocument();
    unmount();
    render(<AttributionLine attributions={[USGS]} example labels={DEFAULT_LABELS} />);
    expect(screen.getByText('Example data').closest('p')).toHaveTextContent('Example data · Data: U.S. Geological Survey');
  });

  it('reads example data from an adapter the board binds to — not one it leaves alone', () => {
    const sample: Adapter = { ...adapter('example'), sample: true };
    expect(showsExampleData(board('seoul', 'example'), [adapter('seoul'), sample])).toBe(true);
    expect(showsExampleData(board('seoul'), [adapter('seoul'), sample])).toBe(false);
  });

  it('draws nothing when no source asks to be named', () => {
    const { container } = render(<AttributionLine attributions={[]} labels={DEFAULT_LABELS} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ViewerPage', () => {
  it('names the board’s sources under it, unless the host shows them itself', async () => {
    const { unmount } = render(<ViewerPage adapters={[adapter('seoul', SEOUL)]} document={board('seoul')} width={400} height={300} />);
    expect(await screen.findByText(/^Data:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SEOUL.text })).toBeInTheDocument();
    unmount();

    render(<ViewerPage adapters={[adapter('seoul', SEOUL)]} document={board('seoul')} width={400} height={300} attribution={false} />);
    await screen.findByTestId('viewer');
    expect(screen.queryByText(/^Data:/)).not.toBeInTheDocument();
  });

  it('says the board shows example data even when the host names its sources itself', async () => {
    render(<ViewerPage adapters={[{ ...adapter('example'), sample: true }]} document={board('example')} width={400} height={300} attribution={false} />);
    expect(await screen.findByText('Example data')).toBeInTheDocument();
  });
});
