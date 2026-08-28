import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { ViewerPage } from './ViewerPage';
import type { ViewDocument } from '../view-document';
import type { Adapter, ResolvedBinding } from '../adapter';

vi.mock('@canvas-kit/viewer', () => ({
  Viewer: () => <div data-testid="viewer" />,
}));

afterEach(() => {
  vi.useRealTimers();
});

function doc(): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [] };
}

function docWithBinding(): ViewDocument {
  return {
    kind: 'canvas',
    background: {},
    nodes: [
      {
        id: 'n1',
        x: 0,
        y: 0,
        anchored: false,
        widget: { type: 'uw-status', bindings: { value: { adapter: 'cmms', ref: 'k' } } },
      },
    ],
    connectors: [],
  };
}

class SpyAdapter implements Adapter {
  readonly id = 'cmms';
  resolve = vi.fn(
    async (): Promise<ResolvedBinding> => ({ value: 'running', quality: 'live' })
  );
}

describe('ViewerPage', () => {
  it('shows the Import UI and "no document" message when initialDocument is omitted (no regression)', () => {
    render(<ViewerPage adapters={[]} width={400} height={300} />);
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText(/No document loaded/i)).toBeInTheDocument();
  });

  it('renders the given document immediately with no Import UI when initialDocument is provided', async () => {
    render(<ViewerPage adapters={[]} width={400} height={300} initialDocument={doc()} />);
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
    expect(screen.queryByText(/No document loaded/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId('viewer')).toBeInTheDocument();
  });

  it('re-resolves bindings on each pollIntervalMs tick when given', async () => {
    vi.useFakeTimers();
    const adapter = new SpyAdapter();
    const adapters = [adapter];
    const initialDocument = docWithBinding();

    render(
      <ViewerPage
        adapters={adapters}
        width={400}
        height={300}
        initialDocument={initialDocument}
        pollIntervalMs={1000}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2);
  });
});
