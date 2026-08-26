import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { BoardEditorPage } from './BoardEditorPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
vi.mock('@canvas-kit/designer', () => ({
  KonvaDesigner: ({ onSelectionChange }: any) => (
    <div data-testid="konva-designer">
      <button onClick={() => onSelectionChange?.([{ type: 'rect', id: 'n1', x: 0, y: 0, width: 10, height: 10 }])}>
        select-n1
      </button>
    </div>
  ),
}));
vi.mock('@canvas-kit/viewer', () => ({ Viewer: () => <div data-testid="viewer" /> }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
  vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }] });
  vi.mocked(api.listShareTokens).mockResolvedValue({ tokens: [] });
});

function renderPage(boardId = 'b1') {
  return render(
    <MemoryRouter initialEntries={[`/boards/${boardId}/edit`]}>
      <Routes>
        <Route path="/boards/:boardId/edit" element={<BoardEditorPage workspaceId="w1" userId="u1" />} />
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

  it('shows no unsaved-changes indicator right after loading', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    renderPage();

    await screen.findByText('Save');

    expect(screen.queryByText('저장되지 않은 변경 사항이 있습니다')).not.toBeInTheDocument();
  });

  it('shows an unsaved-changes indicator once the author edits the document', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    renderPage();

    await userEvent.click(await screen.findByText('Add rect decoration'));

    expect(await screen.findByText('저장되지 않은 변경 사항이 있습니다')).toBeInTheDocument();
  });

  it('clears the unsaved-changes indicator once the save succeeds', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', updatedAt: 't2' });
    renderPage();

    await userEvent.click(await screen.findByText('Add rect decoration'));
    await screen.findByText('저장되지 않은 변경 사항이 있습니다');
    await userEvent.click(screen.getByText('Save', { exact: true }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('저장됨'));
    expect(screen.queryByText('저장되지 않은 변경 사항이 있습니다')).not.toBeInTheDocument();
  });

  it('keeps the unsaved-changes indicator when the save fails', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockRejectedValue(new Error('network down'));
    renderPage();

    await userEvent.click(await screen.findByText('Add rect decoration'));
    await userEvent.click(screen.getByText('Save', { exact: true }));

    await screen.findByRole('alert');
    expect(screen.getByText('저장되지 않은 변경 사항이 있습니다')).toBeInTheDocument();
  });

  it('hides a stale "저장됨" status once the author edits again after a successful save', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', updatedAt: 't2' });
    renderPage();

    await userEvent.click(await screen.findByText('Add rect decoration'));
    await userEvent.click(screen.getByText('Save', { exact: true }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('저장됨'));

    await userEvent.click(screen.getByText('Add text decoration'));

    expect(screen.queryByText('저장됨')).not.toBeInTheDocument();
    expect(screen.getByText('저장되지 않은 변경 사항이 있습니다')).toBeInTheDocument();
  });

  it('shows an error instead of getting stuck on the loading placeholder when the board fails to load', async () => {
    vi.mocked(api.getBoard).mockRejectedValue(new Error('network down'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('보드를 불러오지 못했습니다');
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
  });

  it('shows an error when the member list fails to load, and keeps the owner-only share panel hidden', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'Floor 1', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.listMembers).mockRejectedValue(new Error('network down'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('구성원 정보를 불러오지 못했습니다');
    expect(screen.queryByText('공유')).not.toBeInTheDocument();
  });

  it('does not keep showing the previous board while the next one is still loading after an in-place navigation', async () => {
    let resolveB2: (v: { id: string; name: string; document: typeof EMPTY_DOC; updatedAt: string }) => void;
    vi.mocked(api.getBoard).mockImplementation((_workspaceId: string, boardId: string) => {
      if (boardId === 'b1') return Promise.resolve({ id: 'b1', name: 'A', document: EMPTY_DOC, updatedAt: 't' });
      return new Promise(resolve => {
        resolveB2 = resolve;
      });
    });

    render(
      <MemoryRouter initialEntries={['/boards/b1/edit']}>
        <Routes>
          <Route
            path="/boards/:boardId/edit"
            element={
              <>
                <Link to="/boards/b2/edit">Go to b2</Link>
                <BoardEditorPage workspaceId="w1" userId="u1" />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Save');

    fireEvent.click(screen.getByText('Go to b2'));

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    resolveB2!({ id: 'b2', name: 'B', document: EMPTY_DOC, updatedAt: 't2' });
    await screen.findByText('Save');
  });

  it('clears the "saved" status when a save fails after a previous successful save', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValueOnce({ id: 'b1', name: 'A', updatedAt: 't2' });
    renderPage();

    await userEvent.click(await screen.findByText('Save'));
    await screen.findByRole('status');

    vi.mocked(api.updateBoard).mockRejectedValueOnce(new Error('network down'));
    await userEvent.click(screen.getByText('Save'));

    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('BoardEditorPage connector wiring', () => {
  it('loads workspace connectors alongside the board document', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({
      connectors: [{ id: 'c1', name: 'Plant API', type: 'http', baseUrl: 'https://plant.example.com', authType: 'none', updatedAt: 't' }],
    });
    renderPage();

    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(api.listConnectors).toHaveBeenCalledWith('w1');
  });

  it('still renders the editor when the connector list fails to load (DemoAdapter still works)', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: EMPTY_DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockRejectedValue(new Error('network'));
    renderPage();

    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('데이터소스 목록을 불러오지 못했습니다');
  });
});

describe('BoardEditorPage share panel', () => {
  const DOC = { kind: 'canvas' as const, background: {}, nodes: [], connectors: [] };

  it('hides the entire share panel for a non-owner, and never calls listShareTokens', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'm@x.com', name: 'M', role: 'member' }] });
    renderPage();

    await screen.findByText('Save'); // wait for the page to finish its initial loads
    expect(screen.queryByText('공유')).not.toBeInTheDocument();
    expect(api.listShareTokens).not.toHaveBeenCalled();
  });

  it('owner creates a share link and sees the one-time URL', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.listShareTokens).mockResolvedValue({ tokens: [] });
    vi.mocked(api.createShareToken).mockResolvedValue({ id: 't1', token: 'plaintext-secret-value', tokenMask: 'ab12cd34', createdAt: 't' });

    renderPage();
    // `<details>` renders closed by default; its content is outside the accessibility tree
    // (hence unreachable by `getByRole`) until opened, so every test that needs the panel's
    // contents must open it first — clicking the native `<summary>` toggles `open`.
    fireEvent.click(await screen.findByText('공유'));
    const createButton = await screen.findByRole('button', { name: '새 공유 링크 생성' });
    fireEvent.click(createButton);

    await waitFor(() => expect(api.createShareToken).toHaveBeenCalledWith('w1', 'b1'));
    expect(await screen.findByText(/plaintext-secret-value/)).toBeInTheDocument();
  });

  it('owner revokes a share link', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.listShareTokens).mockResolvedValue({ tokens: [{ id: 't1', tokenMask: 'ab12cd34', createdAt: 't' }] });
    vi.mocked(api.deleteShareToken).mockResolvedValue(undefined);

    renderPage();
    fireEvent.click(await screen.findByText('공유'));
    const revokeButton = await screen.findByRole('button', { name: '회수' });
    fireEvent.click(revokeButton);

    await waitFor(() => expect(api.deleteShareToken).toHaveBeenCalledWith('w1', 'b1', 't1'));
    await waitFor(() => expect(screen.queryByText(/ab12cd34/)).not.toBeInTheDocument());
  });

  it('shows an error when the share token list fails to load', async () => {
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: DOC, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'o@x.com', name: 'O', role: 'owner' }] });
    vi.mocked(api.listShareTokens).mockRejectedValue(new Error('network'));

    renderPage();
    fireEvent.click(await screen.findByText('공유'));
    expect(await screen.findByRole('alert')).toHaveTextContent('공유 링크 목록을 불러오지 못했습니다');
  });
});

describe('BoardEditorPage binding editor wiring', () => {
  it('passes connector display names (not raw ids) down to the binding editor', async () => {
    const doc = {
      kind: 'canvas' as const,
      background: {},
      nodes: [
        {
          id: 'n1',
          x: 0,
          y: 0,
          anchored: false,
          widget: { type: 'status' as const, props: { data: { label: 'A', level: 'info' as const, value: 'x' } } },
        },
      ],
      connectors: [],
    };
    vi.mocked(api.getBoard).mockResolvedValue({ id: 'b1', name: 'A', document: doc, updatedAt: 't' });
    vi.mocked(api.listConnectors).mockResolvedValue({
      connectors: [{ id: 'c1', name: 'Plant API', type: 'http', baseUrl: 'https://plant.example.com', authType: 'none', updatedAt: 't' }],
    });
    renderPage();

    await screen.findByText('Save');
    fireEvent.click(screen.getByText('select-n1'));

    expect(await screen.findByRole('option', { name: 'Plant API' })).toBeInTheDocument();
  });
});
