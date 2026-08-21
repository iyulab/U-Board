import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ViewerPage } from './ViewerPage';
import type { ViewDocument } from '../view-document';

vi.mock('@canvas-kit/viewer', () => ({
  Viewer: () => <div data-testid="viewer" />,
}));

function doc(): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [] };
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
});
