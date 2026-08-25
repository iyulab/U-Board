import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { AuthoringView } from './AuthoringView';
import type { ViewDocument } from '../view-document';

// AuthoringView delegates all Konva/canvas rendering to these two packages — they're already
// tested in their own repo (canvas-kit). Stubbing them here keeps this test focused on
// AuthoringView's own state (import error handling), matching how canvas-kit's own tests stub
// react-konva rather than exercising real canvas rendering.
vi.mock('@canvas-kit/designer', () => ({
  KonvaDesigner: ({ onSelectionChange }: any) => (
    <div data-testid="konva-designer">
      <button onClick={() => onSelectionChange?.([{ type: 'rect', id: 'node-1', x: 0, y: 0, width: 10, height: 10 }])}>
        select-node-1
      </button>
      <button onClick={() => onSelectionChange?.([])}>deselect</button>
    </div>
  ),
}));
vi.mock('@canvas-kit/viewer', () => ({
  Viewer: () => <div data-testid="viewer" />,
}));

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
    expect(screen.getByText('노드를 선택하세요.')).toBeInTheDocument();
  });

  it('shows the selected node in the property panel', () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));

    expect(screen.getByLabelText('위젯 타입')).toHaveValue('status');
  });

  it('returns to the placeholder when the selection is cleared', () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));
    fireEvent.click(screen.getByText('deselect'));

    expect(screen.getByText('노드를 선택하세요.')).toBeInTheDocument();
  });

  it('clears the selection when the selected node disappears from an imported document', async () => {
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} />);

    fireEvent.click(screen.getByText('select-node-1'));
    expect(screen.getByLabelText('위젯 타입')).toHaveValue('status');

    // Import replaces `doc` wholesale without going through onSelectionChange — the effect at
    // AuthoringView.tsx:51 is what has to notice node-1 is gone and reset selectedNodeId itself.
    const input = screen.getByTestId('import-file-input');
    const file = new File([JSON.stringify(doc())], 'empty.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText('노드를 선택하세요.')).toBeInTheDocument());
  });

  it('writes a widget-type change back onto the selected node in the document', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AuthoringView initialDocument={docWithNode()} adapters={[]} width={400} height={300} onSave={onSave} />);

    fireEvent.click(screen.getByText('select-node-1'));
    fireEvent.change(screen.getByLabelText('위젯 타입'), { target: { value: 'gauge' } });
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
