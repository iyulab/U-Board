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
  KonvaDesigner: () => <div data-testid="konva-designer" />,
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
