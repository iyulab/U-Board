import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AuthoringView } from './AuthoringView';
import type { ViewDocument } from '../view-document';

// AuthoringView delegates all Konva/canvas rendering to these two packages — they're already
// tested in their own repo (canvas-kit). Stubbing them here keeps this test focused on
// AuthoringView's own state (import error handling), matching how canvas-kit's own tests stub
// react-konva rather than exercising real canvas rendering.
const designerProps = vi.fn();
const viewerProps = vi.fn();

vi.mock('@canvas-kit/designer', async () => {
  return {
    KonvaDesigner: ({ onSelectionChange, ...props }: any) => {
      designerProps({ onSelectionChange, ...props });
      return (
        <div data-testid="konva-designer">
          <button onClick={() => onSelectionChange?.([{ type: 'rect', id: 'node-1', x: 0, y: 0, width: 10, height: 10 }])}>
            select-node-1
          </button>
          <button onClick={() => onSelectionChange?.([{ type: 'text', id: 'decoration-1', x: 0, y: 0, text: 'Zone A' }])}>
            select-decoration-1
          </button>
          <button onClick={() => onSelectionChange?.([])}>deselect</button>
          <button
            onClick={() =>
              onSelectionChange?.([
                { type: 'rect', id: 'node-1', x: 0, y: 0, width: 10, height: 10 },
                { type: 'text', id: 'decoration-1', x: 0, y: 0, text: 'Zone A' },
              ])
            }
          >
            select-both
          </button>
        </div>
      );
    },
  };
});
vi.mock('@canvas-kit/viewer', () => ({
  Viewer: (props: any) => {
    viewerProps(props);
    return <div data-testid="viewer" />;
  },
}));

afterEach(() => {
  designerProps.mockClear();
  viewerProps.mockClear();
});

const lastDesignerProps = () => designerProps.mock.lastCall![0] as Record<string, any>;

function doc(): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [] };
}

// jsdom doesn't implement real navigation — Export's `link.click()` would otherwise log a
// "not implemented: navigation" warning unrelated to what this file is testing.
HTMLAnchorElement.prototype.click = vi.fn();

async function importInvalidFile() {
  const input = screen.getByTestId('import-file-input');
  const file = new File(['not valid json'], 'bad.json', { type: 'application/json' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => screen.getByText(/not valid json/i));
}

describe('AuthoringView import error', () => {
  it('shows an error message when an imported file fails to parse', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    await importInvalidFile();
    expect(screen.getByText(/not valid json/i)).toBeInTheDocument();
  });

  it('clears a stale import error once the author moves on and adds a node', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    await importInvalidFile();

    fireEvent.click(screen.getByText('Add node'));

    expect(screen.queryByText(/not valid json/i)).not.toBeInTheDocument();
  });

  it('clears a stale import error once the author moves on and exports', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    await importInvalidFile();

    fireEvent.click(screen.getByText('Export'));

    expect(screen.queryByText(/not valid json/i)).not.toBeInTheDocument();
  });
});

describe('AuthoringView onSave', () => {
  it('renders a Save button and calls onSave with the current document when provided', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(doc()));
  });

  it('does not download a file when onSave is provided', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    clickSpy.mockClear();

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('still exports to a local file when onSave is omitted (no regression)', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });
});

describe('AuthoringView unsaved changes guard', () => {
  function dispatchBeforeUnload(): Event {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event;
  }

  it('does not warn before unload when nothing has changed', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);

    const event = dispatchBeforeUnload();

    expect(event.defaultPrevented).toBe(false);
  });

  it('warns before unload once the author edits the document', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('Add rect decoration'));
    const event = dispatchBeforeUnload();

    expect(event.defaultPrevented).toBe(true);
  });

  it('clears the unload guard once a save completes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('Add rect decoration'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // `onSave` resolving is a separate microtask from the click that invoked it — wait for the
    // guard to actually clear rather than asserting immediately after the call is observed.
    await waitFor(() => expect(dispatchBeforeUnload().defaultPrevented).toBe(false));
  });

  it('keeps warning before unload when a save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('network down'));
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('Add rect decoration'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const event = dispatchBeforeUnload();

    expect(event.defaultPrevented).toBe(true);
  });

  it('clears the unload guard once an export completes (no onSave)', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('Add rect decoration'));
    fireEvent.click(screen.getByText('Export'));

    const event = dispatchBeforeUnload();

    expect(event.defaultPrevented).toBe(false);
  });

  it('reports dirty state changes via onDirtyChange', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDirtyChange = vi.fn();
    render(
      <AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} onDirtyChange={onDirtyChange} />
    );

    expect(onDirtyChange).toHaveBeenCalledWith(false);
    onDirtyChange.mockClear();

    fireEvent.click(screen.getByText('Add rect decoration'));
    expect(onDirtyChange).toHaveBeenCalledWith(true);
    onDirtyChange.mockClear();

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onDirtyChange).toHaveBeenCalledWith(false));
  });
});

describe('AuthoringView node selection', () => {
  function docWithNode(): ViewDocument {
    return {
      kind: 'canvas',
      background: {},
      nodes: [
        {
          id: 'node-1',
          x: 0,
          y: 0,
          anchored: false,
          widget: { type: 'status', props: { data: { label: 'Pump A', level: 'info', value: 'running' } } },
        },
      ],
      connectors: [],
    };
  }

  it('shows the placeholder when nothing is selected', () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);
    expect(screen.getByText('Select a node.')).toBeInTheDocument();
  });

  it('shows the selected node in the property panel', () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));

    expect(screen.getByLabelText('Widget type')).toHaveValue('status');
  });

  it('returns to the placeholder when the selection is cleared', () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));
    fireEvent.click(screen.getByText('deselect'));

    expect(screen.getByText('Select a node.')).toBeInTheDocument();
  });

  it('clears the selection when the selected node disappears from an imported document', async () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));
    expect(screen.getByLabelText('Widget type')).toHaveValue('status');

    // Import replaces `doc` wholesale without going through onSelectionChange — the effect at
    // AuthoringView.tsx:51 is what has to notice node-1 is gone and reset selectedNodeId itself.
    const input = screen.getByTestId('import-file-input');
    const file = new File([JSON.stringify(doc())], 'empty.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText('Select a node.')).toBeInTheDocument());
  });

  it('writes a widget-type change back onto the selected node in the document', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('select-node-1'));
    fireEvent.change(screen.getByLabelText('Widget type'), { target: { value: 'gauge' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        kind: 'canvas',
        background: {},
        nodes: [{ id: 'node-1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', props: { data: { value: 0 } } } }],
        connectors: [],
      })
    );
  });
});

describe('AuthoringView decoration authoring', () => {
  it('adds a rect decoration to the document when "Add rect decoration" is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('Add rect decoration'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const saved = onSave.mock.calls[0][0];
    expect(saved.decorations).toHaveLength(1);
    expect(saved.decorations[0]).toMatchObject({ type: 'rect' });
  });

  it('adds a text decoration to the document when "Add text decoration" is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('Add text decoration'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const saved = onSave.mock.calls[0][0];
    expect(saved.decorations).toHaveLength(1);
    expect(saved.decorations[0]).toMatchObject({ type: 'text' });
  });

  function docWithTextDecoration(): ViewDocument {
    return {
      kind: 'canvas',
      background: {},
      nodes: [],
      connectors: [],
      decorations: [{ id: 'decoration-1', type: 'text', x: 0, y: 0, text: 'Zone A' }],
    };
  }

  it('shows the decoration panel (not the node property panel) when a decoration is selected', () => {
    render(<AuthoringView initialDocument={docWithTextDecoration()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-decoration-1'));

    expect(screen.getByLabelText('Text')).toHaveValue('Zone A');
    expect(screen.queryByLabelText('Widget type')).not.toBeInTheDocument();
  });

  it("writes a label change back onto the selected text decoration", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={docWithTextDecoration()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('select-decoration-1'));
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Zone B' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ decorations: [{ id: 'decoration-1', type: 'text', x: 0, y: 0, text: 'Zone B' }] })
      )
    );
  });

  it('a node selection still shows the property panel, not the decoration panel (no regression)', () => {
    const withBoth: ViewDocument = { ...docWithTextDecoration(), nodes: [{ id: 'node-1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }] };
    render(<AuthoringView initialDocument={withBoth} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));

    expect(screen.getByLabelText('Widget type')).toBeInTheDocument();
    expect(screen.queryByLabelText('Text')).not.toBeInTheDocument();
  });
});

describe('AuthoringView viewport', () => {
  function docWithBackground(): ViewDocument {
    return { kind: 'canvas', background: { image: { src: 'plan.png', width: 3000, height: 2000 } }, nodes: [], connectors: [] };
  }

  it('lets the editor and preview follow their panes when width/height are omitted', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} />);
    await screen.findByTestId('viewer');
    expect(designerProps.mock.lastCall![0].width).toBeUndefined();
    expect(designerProps.mock.lastCall![0].height).toBeUndefined();
    expect(viewerProps.mock.lastCall![0].width).toBeUndefined();
  });

  it('passes an explicit width/height through to both panes', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    await screen.findByTestId('viewer');
    expect(designerProps.mock.lastCall![0]).toMatchObject({ width: 400, height: 300 });
    expect(viewerProps.mock.lastCall![0]).toMatchObject({ width: 400, height: 300 });
  });

  it('opens the document fitted into the editor, shrunk to fit and never magnified', () => {
    render(<AuthoringView initialDocument={docWithBackground()} adapters={[]} />);
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    // (632 - 2×16) / 3000 = 0.2, centered on the 3000×2000 background
    expect(lastDesignerProps().transform).toEqual({ x: 16, y: 16, scale: 0.2 });
  });

  it('keeps the document fitted as the panes resize, until the author pans or zooms', () => {
    render(<AuthoringView initialDocument={docWithBackground()} adapters={[]} />);
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    act(() => lastDesignerProps().onViewportResize({ width: 332, height: 232 }));
    expect(lastDesignerProps().transform.scale).toBeCloseTo(0.1);

    act(() => lastDesignerProps().onTransformChange({ x: 3, y: 4, scale: 0.5 }));
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    expect(lastDesignerProps().transform).toEqual({ x: 3, y: 4, scale: 0.5 });
  });

  it('does not fit an empty document, and offers no fit control for it', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} />);
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    expect(lastDesignerProps().transform).toEqual({ x: 0, y: 0, scale: 1 });
    expect(screen.queryByRole('button', { name: 'Fit to view' })).not.toBeInTheDocument();
  });

  it('fits again on demand from the "Fit to view" control', () => {
    render(<AuthoringView initialDocument={docWithBackground()} adapters={[]} />);
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    act(() => lastDesignerProps().onTransformChange({ x: 3, y: 4, scale: 0.5 }));
    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(lastDesignerProps().transform).toEqual({ x: 16, y: 16, scale: 0.2 });
  });

  it('zooms the editor and preview together from keyboard-operable controls', () => {
    render(<AuthoringView initialDocument={docWithBackground()} adapters={[]} />);
    act(() => lastDesignerProps().onViewportResize({ width: 632, height: 432 }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(lastDesignerProps().transform.scale).toBeCloseTo(0.25);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('keeps the preview on the same pan/zoom as the editor, whichever pane moves it', async () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} />);
    await screen.findByTestId('viewer');

    act(() => lastDesignerProps().onTransformChange({ x: -30, y: -20, scale: 0.5 }));
    expect(designerProps.mock.lastCall![0].transform).toEqual({ x: -30, y: -20, scale: 0.5 });
    expect(viewerProps.mock.lastCall![0].transform).toEqual({ x: -30, y: -20, scale: 0.5 });

    act(() => viewerProps.mock.lastCall![0].onTransformChange({ x: 5, y: 6, scale: 2 }));
    expect(designerProps.mock.lastCall![0].transform).toEqual({ x: 5, y: 6, scale: 2 });
  });

  it('adds a node where the author is looking, not at the scene origin', async () => {
    const onSave = vi.fn();
    render(<AuthoringView initialDocument={doc()} adapters={[]} onSave={onSave} />);
    // the author has panned to the scene region starting at (1000, 500)
    act(() => lastDesignerProps().onTransformChange({ x: -1000, y: -500, scale: 1 }));

    fireEvent.click(screen.getByText('Add node'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [node] = onSave.mock.lastCall![0].nodes;
    expect(node).toMatchObject({ x: 1040, y: 540 });
  });
});

describe('AuthoringView document source', () => {
  it('does not show the document JSON unless asked to', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    expect(screen.queryByText('ViewDocument (debug)')).not.toBeInTheDocument();
  });

  it('shows the document JSON with showDocumentSource', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} showDocumentSource />);
    expect(screen.getByText('ViewDocument (debug)')).toBeInTheDocument();
  });
});

describe('AuthoringView multiple selection', () => {
  it('says how many items are selected instead of showing a single item panel, and names the editor', () => {
    render(<AuthoringView initialDocument={doc()} adapters={[]} width={400} height={300} />);
    expect(designerProps.mock.lastCall![0].ariaLabel).toBe('Editor');

    fireEvent.click(screen.getByText('select-both'));
    expect(screen.getByText('2 items selected — select one to edit it.')).toBeInTheDocument();
    expect(screen.queryByText('Select a node.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('deselect'));
    expect(screen.getByText('Select a node.')).toBeInTheDocument();
  });
});
