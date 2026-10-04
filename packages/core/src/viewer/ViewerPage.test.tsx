import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ViewerPage } from './ViewerPage';
import type { ViewDocument } from '../view-document';
import type { Adapter, ResolvedBinding } from '../adapter';

const viewerProps = vi.fn();

vi.mock('@canvas-kit/viewer', () => ({
  Viewer: (props: Record<string, unknown>) => {
    viewerProps(props);
    return <div data-testid="viewer" />;
  },
}));

afterEach(() => {
  vi.useRealTimers();
  viewerProps.mockClear();
});

const lastViewerProps = () => viewerProps.mock.lastCall![0] as Record<string, any>;

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

    it('fits the whole document into view when it opens, once the viewport size is known', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      // (632 - 2×16) / 1200 = 0.5, centered
      expect(lastViewerProps().transform).toEqual({ x: 16, y: 16, scale: 0.5 });
    });

    it('never magnifies a board smaller than the view', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 4000, height: 3000 }));
      expect(lastViewerProps().transform.scale).toBe(1);
    });

    it('keeps the board fitted as the view resizes, until the user pans or zooms', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onViewportResize({ width: 332, height: 232 }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.25);

      act(() => lastViewerProps().onTransformChange({ x: 1, y: 2, scale: 0.7 }));
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      expect(lastViewerProps().transform).toEqual({ x: 1, y: 2, scale: 0.7 });
    });

    it('fits again on demand from the "Fit to view" control', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onTransformChange({ x: 1, y: 2, scale: 0.7 }));

      fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));

      expect(lastViewerProps().transform).toEqual({ x: 16, y: 16, scale: 0.5 });
    });

    it("does not re-fit when a poll refreshes the values, so the user's pan/zoom survives", async () => {
      vi.useFakeTimers();
      render(<ViewerPage adapters={[new SpyAdapter()]} initialDocument={docWithBinding()} pollIntervalMs={1000} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onTransformChange({ x: 1, y: 2, scale: 0.7 }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(lastViewerProps().transform).toEqual({ x: 1, y: 2, scale: 0.7 });
    });

    it('names the board view for assistive technology', async () => {
      render(<ViewerPage adapters={[]} initialDocument={doc()} ariaLabel="Line 2 floor" />);
      await screen.findByTestId('viewer');
      expect(lastViewerProps().ariaLabel).toBe('Line 2 floor');
    });

    it('lets a keyboard pan or zoom in the view end following, like a pointer one', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onTransformChange({ x: -24, y: 16, scale: 0.5 })); // an arrow press
      act(() => lastViewerProps().onViewportResize({ width: 332, height: 232 }));
      expect(lastViewerProps().transform).toEqual({ x: -24, y: 16, scale: 0.5 });
    });

    it('zooms in and out from keyboard-operable controls, around the middle of the view', async () => {
      render(<ViewerPage adapters={[]} initialDocument={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));

      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.625);
      fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.5);
    });

    it('offers no fit control for an empty document, and leaves its view at identity', async () => {
      render(<ViewerPage adapters={[]} initialDocument={doc()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      expect(screen.queryByRole('button', { name: 'Fit to view' })).not.toBeInTheDocument();
      expect(lastViewerProps().transform).toEqual({ x: 0, y: 0, scale: 1 });
    });
  });
});

describe('ViewerPage labels', () => {
  class FailingAdapter implements Adapter {
    readonly id = 'cmms';
    resolve = vi.fn(async (): Promise<ResolvedBinding> => ({ value: undefined, quality: 'disconnected', reason: 'auth' }));
  }
  const ko = {
    zoomIn: '확대',
    zoomOut: '축소',
    fitToView: '화면에 맞추기',
    boardRegion: '보드',
    qualityText: {
      quality: { stale: '갱신 지연', disconnected: '연결 끊김' },
      reason: { transport: '연결 불가', auth: '자격 거부', address: '값 없음', throttled: '한도 초과' },
    },
  };

  it('shows the given text on its controls, view and quality tooltips', async () => {
    render(<ViewerPage adapters={[new FailingAdapter()]} initialDocument={docWithBinding()} labels={ko} />);
    await screen.findByTestId('viewer');
    expect(screen.getByRole('button', { name: '확대' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '축소' })).toBeInTheDocument();
    expect(lastViewerProps().ariaLabel).toBe('보드');
    await vi.waitFor(() => {
      const content = lastViewerProps().overlays[0].content as React.ReactElement<{ title?: string }>;
      expect(content.props.title).toBe('연결 끊김 (자격 거부)');
    });
  });

  it('keeps English for any label not given', async () => {
    render(<ViewerPage adapters={[new SpyAdapter()]} initialDocument={docWithBinding()} labels={{ zoomIn: '확대' }} />);
    await screen.findByTestId('viewer');
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(lastViewerProps().ariaLabel).toBe('Board');
  });

  it('settles when labels are passed as a new object on every render', async () => {
    const { rerender } = render(<ViewerPage adapters={[new SpyAdapter()]} initialDocument={docWithBinding()} labels={{ ...ko }} />);
    await screen.findByTestId('viewer');
    rerender(<ViewerPage adapters={[new SpyAdapter()]} initialDocument={docWithBinding()} labels={{ ...ko }} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    const calls = viewerProps.mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(viewerProps.mock.calls.length).toBe(calls);
  });
});
