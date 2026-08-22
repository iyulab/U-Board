import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { BoardsListPage } from './BoardsListPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/boards']}>
      <Routes>
        <Route path="/boards" element={<BoardsListPage workspaceId="w1" />} />
        <Route path="/boards/:boardId/edit" element={<div>editor page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BoardsListPage', () => {
  it('lists boards for the workspace', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', updatedAt: '2026-08-20T00:00:00.000Z' }] });
    renderPage();
    expect(await screen.findByText('Floor 1')).toBeInTheDocument();
    expect(api.listBoards).toHaveBeenCalledWith('w1');
  });

  it('creates a board via prompt and navigates to its editor', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b2', name: 'New Board', updatedAt: 't' });
    vi.spyOn(window, 'prompt').mockReturnValue('New Board');

    renderPage();
    await screen.findByRole('button', { name: '새 보드' });
    await userEvent.click(screen.getByRole('button', { name: '새 보드' }));

    await waitFor(() => expect(api.createBoard).toHaveBeenCalledWith('w1', 'New Board'));
    expect(await screen.findByText('editor page')).toBeInTheDocument();
  });

  it('does not create a board when the prompt is cancelled', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));

    expect(api.createBoard).not.toHaveBeenCalled();
  });

  it('deletes a board after confirmation and removes it from the list', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', updatedAt: 't' }] });
    vi.mocked(api.deleteBoard).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Floor 1');
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(api.deleteBoard).toHaveBeenCalledWith('w1', 'b1'));
    expect(screen.queryByText('Floor 1')).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when the list fails to load, and recovers on retry', async () => {
    vi.mocked(api.listBoards).mockRejectedValueOnce(new Error('network down'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 목록을 불러오지 못했습니다');

    vi.mocked(api.listBoards).mockResolvedValueOnce({ boards: [{ id: 'b1', name: 'Floor 1', updatedAt: 't' }] });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('Floor 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when creating a board fails', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.createBoard).mockRejectedValue(new Error('network down'));
    vi.spyOn(window, 'prompt').mockReturnValue('New Board');

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 생성에 실패했습니다');
  });

  it('shows an error when deleting a board fails', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', updatedAt: 't' }] });
    vi.mocked(api.deleteBoard).mockRejectedValue(new Error('network down'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Floor 1');
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 삭제에 실패했습니다');
    expect(screen.getByText('Floor 1')).toBeInTheDocument();
  });
});
