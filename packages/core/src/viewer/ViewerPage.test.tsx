import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ViewerPage } from './ViewerPage';
import type { ViewDocument } from '../view-document';
import type { Adapter, ResolvedBinding } from '../adapter';

const viewerProps = vi.fn();
const fitToRect = vi.fn();

vi.mock('@canvas-kit/viewer', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return {
    Viewer: forwardRef((props: Record<string, unknown>, ref) => {
      useImperativeHandle(ref, () => ({ fitToRect }));
      viewerProps(props);
      return <div data-testid="viewer" />;
    }),
  };
});

afterEach(() => {
  vi.useRealTimers();
  viewerProps.mockClear();
  fitToRect.mockClear();
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

  describe('sizing and fit', () => {
    function docWithBackground(): ViewDocument {
      return { kind: 'canvas', background: { image: { src: 'bg.png', width: 1200, height: 800 } }, nodes: [], connectors: [] };
    }

    it('lets the viewer follow its container when width/height are omitted', async () => {
      render(<ViewerPage adapters={[]} initialDocument={doc()} />);
      await screen.findByTestId('viewer');
      const props = viewerProps.mock.lastCall![0];
      expect(props.width).toBeUndefined();
      expect(props.height).toBeUndefined();
    });

    it('passes an explicit width/height through to the viewer', async () => {
      render(<ViewerPage adapters={[]} width={400} height={300} initialDocument={doc()} />);
      await screen.findByTestId('viewer');
      const props = viewerProps.mock.lastCall![0];
      expect(props.width).toBe(400);
      expect(props.height).toBe(300);
    });

    it('fits the whole document into view when it opens', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      expect(fitToRect).toHaveBeenCalledTimes(1);
      expect(fitToRect.mock.lastCall![0]).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
      // Shrinks a large board to fit but never magnifies a small one past its natural size.
      expect(fitToRect.mock.lastCall![1]).toMatchObject({ maxScale: 1 });
    });

    it('fits again on demand from the "Fit to view" control', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      fitToRect.mockClear();

      fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));

      expect(fitToRect).toHaveBeenCalledTimes(1);
      expect(fitToRect.mock.lastCall![0]).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
    });

    it("does not re-fit when a poll refreshes the values, so the user's pan/zoom survives", async () => {
      vi.useFakeTimers();
      render(<ViewerPage adapters={[new SpyAdapter()]} initialDocument={docWithBinding()} pollIntervalMs={1000} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fitToRect).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(fitToRect).toHaveBeenCalledTimes(1);
    });

    it('offers no fit control for an empty document', async () => {
      render(<ViewerPage adapters={[]} initialDocument={doc()} />);
      await screen.findByTestId('viewer');
      expect(screen.queryByRole('button', { name: 'Fit to view' })).not.toBeInTheDocument();
      expect(fitToRect).not.toHaveBeenCalled();
    });
  });
});
