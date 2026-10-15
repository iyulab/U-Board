import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ViewerPage } from './ViewerPage';
import type { CanvasView, GridView } from '../view-document';
import type { Adapter, ResolvedBinding } from '../adapter';
import { NodeFrame, type NodeFrameProps } from '../renderer/node-frame';

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

/** The title a node's frame carries — its quality in words — read off the `NodeFrame` an overlay draws. */
function frameTitle(content: React.ReactNode): string | undefined {
  const element = content as React.ReactElement<NodeFrameProps>;
  return (NodeFrame(element.props) as React.ReactElement<{ title?: string }>).props.title;
}

function doc(): CanvasView {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [] };
}

function docWithBinding(): CanvasView {
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
  it('renders the given document at once, with no import control of its own', async () => {
    render(<ViewerPage adapters={[]} width={400} height={300} document={doc()} />);
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
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
        document={initialDocument}
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

  it('shows a document given later in place of the first, resolving its bindings', async () => {
    const adapter = new SpyAdapter();
    const adapters = [adapter];
    const first = docWithBinding();
    const { rerender } = render(<ViewerPage adapters={adapters} width={400} height={300} document={first} />);
    await waitFor(() => expect(adapter.resolve).toHaveBeenCalledWith('k'));

    const second = docWithBinding();
    second.nodes[0].widget.bindings = { value: { adapter: 'cmms', ref: 'k2' } };
    rerender(<ViewerPage adapters={adapters} width={400} height={300} document={second} />);
    await waitFor(() => expect(adapter.resolve).toHaveBeenCalledWith('k2'));

    // The same document object again is not a new document.
    const calls = adapter.resolve.mock.calls.length;
    rerender(<ViewerPage adapters={adapters} width={400} height={300} document={second} />);
    await new Promise(r => setTimeout(r, 20));
    expect(adapter.resolve.mock.calls.length).toBe(calls);
  });

  describe('sizing and fit', () => {
    function docWithBackground(): CanvasView {
      return { kind: 'canvas', background: { image: { src: 'bg.png', width: 1200, height: 800 } }, nodes: [], connectors: [] };
    }

    it('lets the viewer follow its container when width/height are omitted', async () => {
      render(<ViewerPage adapters={[]} document={doc()} />);
      await screen.findByTestId('viewer');
      const props = viewerProps.mock.lastCall![0];
      expect(props.width).toBeUndefined();
      expect(props.height).toBeUndefined();
    });

    it('passes an explicit width/height through to the viewer', async () => {
      render(<ViewerPage adapters={[]} width={400} height={300} document={doc()} />);
      await screen.findByTestId('viewer');
      const props = viewerProps.mock.lastCall![0];
      expect(props.width).toBe(400);
      expect(props.height).toBe(300);
    });

    it('fits the whole document into view when it opens, once the viewport size is known', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      // (632 - 2×16) / 1200 = 0.5, centered
      expect(lastViewerProps().transform).toEqual({ x: 16, y: 16, scale: 0.5 });
    });

    it('never magnifies a board smaller than the view', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 4000, height: 3000 }));
      expect(lastViewerProps().transform.scale).toBe(1);
    });

    it('keeps the board fitted as the view resizes, until the user pans or zooms', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onViewportResize({ width: 332, height: 232 }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.25);

      act(() => lastViewerProps().onTransformChange({ x: 1, y: 2, scale: 0.7 }));
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      expect(lastViewerProps().transform).toEqual({ x: 1, y: 2, scale: 0.7 });
    });

    it('fits again on demand from the "Fit to view" control', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onTransformChange({ x: 1, y: 2, scale: 0.7 }));

      fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));

      expect(lastViewerProps().transform).toEqual({ x: 16, y: 16, scale: 0.5 });
    });

    it("does not re-fit when a poll refreshes the values, so the user's pan/zoom survives", async () => {
      vi.useFakeTimers();
      render(<ViewerPage adapters={[new SpyAdapter()]} document={docWithBinding()} pollIntervalMs={1000} />);
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
      render(<ViewerPage adapters={[]} document={doc()} ariaLabel="Line 2 floor" />);
      await screen.findByTestId('viewer');
      expect(lastViewerProps().ariaLabel).toBe('Line 2 floor');
    });

    it('lets a keyboard pan or zoom in the view end following, like a pointer one', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));
      act(() => lastViewerProps().onTransformChange({ x: -24, y: 16, scale: 0.5 })); // an arrow press
      act(() => lastViewerProps().onViewportResize({ width: 332, height: 232 }));
      expect(lastViewerProps().transform).toEqual({ x: -24, y: 16, scale: 0.5 });
    });

    it('zooms in and out from keyboard-operable controls, around the middle of the view', async () => {
      render(<ViewerPage adapters={[]} document={docWithBackground()} />);
      await screen.findByTestId('viewer');
      act(() => lastViewerProps().onViewportResize({ width: 632, height: 432 }));

      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.625);
      fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
      expect(lastViewerProps().transform.scale).toBeCloseTo(0.5);
    });

    it('offers no fit control for an empty document, and leaves its view at identity', async () => {
      render(<ViewerPage adapters={[]} document={doc()} />);
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
      reason: { transport: '연결 불가', auth: '자격 거부', address: '값 없음', format: '형식 오류', throttled: '한도 초과', lagging: '갱신 지연' },
      age: () => '조금 전',
      brief: {
        quality: { stale: '지난 값', disconnected: '값 없음' },
        reason: { transport: '응답 없음', auth: '인증 거부', address: '값 못 찾음', format: '형식 오류', throttled: '한도', lagging: '늦음' },
      },
    },
  };

  it('shows the given text on its controls, view and quality tooltips', async () => {
    render(<ViewerPage adapters={[new FailingAdapter()]} document={docWithBinding()} labels={ko} />);
    await screen.findByTestId('viewer');
    expect(screen.getByRole('button', { name: '확대' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '축소' })).toBeInTheDocument();
    expect(lastViewerProps().ariaLabel).toBe('보드');
    await vi.waitFor(() => {
      expect(frameTitle(lastViewerProps().overlays[0].content)).toBe('연결 끊김 (자격 거부)');
    });
  });

  it('keeps English for any label not given', async () => {
    render(<ViewerPage adapters={[new SpyAdapter()]} document={docWithBinding()} labels={{ zoomIn: '확대' }} />);
    await screen.findByTestId('viewer');
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(lastViewerProps().ariaLabel).toBe('Board');
  });

  it('settles when labels are passed as a new object on every render', async () => {
    const { rerender } = render(<ViewerPage adapters={[new SpyAdapter()]} document={docWithBinding()} labels={{ ...ko }} />);
    await screen.findByTestId('viewer');
    rerender(<ViewerPage adapters={[new SpyAdapter()]} document={docWithBinding()} labels={{ ...ko }} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    const calls = viewerProps.mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(viewerProps.mock.calls.length).toBe(calls);
  });
});

describe('ViewerPage liveness', () => {
  class GatedAdapter implements Adapter {
    readonly id = 'cmms';
    hold = false;
    resolve = vi.fn((): Promise<ResolvedBinding> =>
      this.hold ? new Promise(() => {}) : Promise.resolve({ value: 'running', quality: 'live', observedAt: new Date().toISOString() })
    );
  }

  it('shows when the values were last updated while it polls, and nothing of the kind when it does not', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T05:00:00Z') });
    const adapters = [new GatedAdapter()];
    const { unmount } = render(<ViewerPage adapters={adapters} document={docWithBinding()} pollIntervalMs={1000} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const time = new Intl.DateTimeFormat('en', { timeStyle: 'medium' }).format(Date.parse('2026-10-07T05:00:00Z'));
    expect(screen.getByText(`Updated ${time}`)).toBeInTheDocument();
    unmount();

    render(<ViewerPage adapters={adapters} document={docWithBinding()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it('says it is not updating and shows every value as last known, once a poll goes unanswered', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T05:00:00Z') });
    const adapter = new GatedAdapter();
    render(<ViewerPage adapters={[adapter]} document={docWithBinding()} pollIntervalMs={1000} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const contentTitle = () => frameTitle(lastViewerProps().overlays[0].content);
    expect(contentTitle()).toBeUndefined(); // live: not announced
    // The live region is there before it has anything to say — one inserted with its text already
    // in it is not announced by many screen readers.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    adapter.hold = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    const time = new Intl.DateTimeFormat('en', { timeStyle: 'medium' }).format(Date.parse('2026-10-07T05:00:00Z'));
    expect(screen.getByRole('status')).toHaveTextContent(`Not updating — last updated ${time}`);
    expect(contentTitle()).toMatch(/^stale — showing last known value/);
  });

  it('writes the time in the language of the labels it is given', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T05:00:00Z') });
    render(
      <ViewerPage
        adapters={[new GatedAdapter()]}
        document={docWithBinding()}
        pollIntervalMs={1000}
        labels={{ lastUpdated: '갱신 {time}', time: () => '오후 2:00:00' }}
      />
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('갱신 오후 2:00:00')).toBeInTheDocument();
  });
});

describe('ViewerPage clock', () => {
  // The machine running the view says 05:10, but the source's timestamps — and the real time — say 05:02.
  class StaleAdapter implements Adapter {
    readonly id = 'cmms';
    resolve = vi.fn(async (): Promise<ResolvedBinding> => ({
      value: 'running',
      quality: 'stale',
      observedAt: '2026-10-07T05:00:00Z',
    }));
  }
  const clock = () => Date.parse('2026-10-07T05:02:00Z');

  it('measures how long ago a value was obtained against the clock it is given', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T05:10:00Z') });
    render(<ViewerPage adapters={[new StaleAdapter()]} document={docWithBinding()} clock={clock} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(frameTitle(lastViewerProps().overlays[0].content)).toMatch(/2 minutes ago\)$/);
  });

  it('tells the time of the last update by the clock it is given', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T05:10:00Z') });
    render(<ViewerPage adapters={[new StaleAdapter()]} document={docWithBinding()} pollIntervalMs={1000} clock={clock} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const time = new Intl.DateTimeFormat('en', { timeStyle: 'medium' }).format(clock());
    expect(screen.getByText(`Updated ${time}`)).toBeInTheDocument();
  });
});

describe('ViewerPage with a grid view', () => {
  function grid(): GridView {
    return {
      kind: 'grid',
      appearance: 'dark',
      items: [
        { id: 'pump', span: 6, widget: { type: 'uw-status', bindings: { value: { adapter: 'cmms', ref: 'k' } } } },
        { id: 'note', span: 3, spanMedium: 6, height: 120, widget: { type: 'markdown', props: { content: 'x' } } },
        { id: 'plain', widget: { type: 'gauge' } },
      ],
    };
  }

  it('lays the items out in order in a named region, without the canvas or its pan and zoom', async () => {
    render(<ViewerPage document={grid()} adapters={[new SpyAdapter()]} ariaLabel="Line 3" />);
    const region = await screen.findByRole('region', { name: 'Line 3' });
    const items = [...region.querySelectorAll<HTMLElement>('[data-item-id]')];
    expect(items.map(item => item.dataset.itemId)).toEqual(['pump', 'note', 'plain']);
    expect(viewerProps).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Fit to view' })).not.toBeInTheDocument();
    expect(region.closest('.ub-viewer__surface')).toHaveAttribute('data-appearance', 'dark');
  });

  it('gives each item its spans at full and medium width — the default span 4, medium half of it rounded up', async () => {
    render(<ViewerPage document={grid()} adapters={[new SpyAdapter()]} />);
    const region = await screen.findByRole('region');
    const style = (id: string) => region.querySelector<HTMLElement>(`[data-item-id="${id}"]`)!.style;
    expect([style('pump').getPropertyValue('--_ub-span'), style('pump').getPropertyValue('--_ub-span-medium')]).toEqual(['6', '3']);
    expect([style('note').getPropertyValue('--_ub-span'), style('note').getPropertyValue('--_ub-span-medium'), style('note').height]).toEqual(['3', '6', '120px']);
    expect([style('plain').getPropertyValue('--_ub-span'), style('plain').getPropertyValue('--_ub-span-medium'), style('plain').height]).toEqual(['4', '2', '']);
  });

  it('shows each item with its quality, as a canvas node does, and keeps updating it', async () => {
    const adapter = new SpyAdapter();
    adapter.resolve.mockResolvedValue({ value: undefined, quality: 'disconnected' });
    render(<ViewerPage document={grid()} adapters={[adapter]} pollIntervalMs={60_000} />);
    const region = await screen.findByRole('region');
    await waitFor(() => expect(region.querySelector('[data-item-id="pump"] [title]')).toHaveAttribute('title', expect.stringMatching(/^disconnected/)));
    expect(region.ownerDocument.querySelector('.ub-freshness')).toBeInTheDocument();
  });
});
