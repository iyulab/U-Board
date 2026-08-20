import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { BoardEditorPage } from './BoardEditorPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
vi.mock('@canvas-kit/designer', () => ({ KonvaDesigner: () => <div data-testid="konva-designer" /> }));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));
beforeEach(() => vi.resetAllMocks());

function renderPage(boardId = 'b1') {
  return render(
    <MemoryRouter initialEntries={[`/boards/${boardId}/edit`]}>
      <Routes>
        <Route path="/boards/:boardId/edit" element={<BoardEditorPage workspaceId="w1" />} />
      </Routes>
    </MemoryRouter>
  );
}

const EMPTY_DOC = { kind: 'canvas' as const, background: {}, nodes: [], connectors: [] };

describe('BoardEditorPage', () => {
  it('loads the board and renders the editor with a Save button', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    renderPage();
    expect(api.getBoard).toHaveBeenCalledWith('w1', 'b1');
    expect(await screen.findByText('Save')).toBeInTheDocument();
  });

  it('saves via updateBoard when Save is clicked', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', updatedAt: 't2' });
    renderPage();

    await userEvent.click(await screen.findByText('Save'));

    await waitFor(() => expect(api.updateBoard).toHaveBeenCalledWith('w1', 'b1', { document: EMPTY_DOC }));
    expect(await screen.findByRole('status')).toHaveTextContent('저장됨');
  });

  it('shows an error message when saving fails', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockRejectedValue(new Error('network down'));
    renderPage();

    await userEvent.click(await screen.findByText('Save'));

    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패');
  });
});
