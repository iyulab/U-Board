import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { BoardsListPage } from './BoardsListPage.js';
import type { Board } from '@iyulab/u-board/domain';
import * as api from '../api-client.js';
import { formatDateTime } from '../format-time.js';

vi.mock('../api-client.js');
// The page loads the samples lazily, and the first load transforms every pack's source — longer, as the gallery grows,
// than a query waits for the cards to appear. Loaded once here, the page's own import resolves at once.
beforeAll(async () => {
  await import('@iyulab/u-board-samples');
}, 30_000);
beforeEach(() => {
  vi.resetAllMocks();
  // The create dialog reads the workspace's data sources to tell which sample keys it still needs.
  vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
});

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
  it('shows a loading state before the initial list resolves', async () => {
    let resolveList!: (value: { boards: { id: string; name: string; kind: 'canvas' | 'grid'; updatedAt: string }[] }) => void;
    vi.mocked(api.listBoards).mockReturnValue(new Promise(resolve => { resolveList = resolve; }));

    renderPage();
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    resolveList({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: 't' }] });
    expect(await screen.findByText('Floor 1')).toBeInTheDocument();
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
  });

  it('lists boards for the workspace', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: '2026-08-20T00:00:00.000Z' }] });
    renderPage();
    expect(await screen.findByText('Floor 1')).toBeInTheDocument();
    expect(api.listBoards).toHaveBeenCalledWith('w1');
  });


  it('says when each board was last changed, in readable words rather than raw ISO text', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: '2026-08-20T00:00:00.000Z' }] });
    renderPage();
    const time = await screen.findByText(formatDateTime('2026-08-20T00:00:00.000Z'));
    expect(time).toHaveAttribute('datetime', '2026-08-20T00:00:00.000Z');
    expect(screen.queryByText(/2026-08-20T/)).not.toBeInTheDocument();
  });

  it("creates a grid board when the grid kind is chosen, and says each board's kind in the list", async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Line 3', kind: 'grid', updatedAt: '2026-08-20T00:00:00.000Z' }] });
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b2', name: 'OEE', kind: 'grid', updatedAt: 't' });
    renderPage();
    expect(await screen.findByText(/^그리드 · 수정/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '새 보드' }));
    const kinds = screen.getByRole('group', { name: '보드 종류' });
    expect(within(kinds).getByRole('radio', { name: /^캔버스/ })).toBeChecked();
    await userEvent.click(within(kinds).getByRole('radio', { name: /^그리드/ }));
    await userEvent.type(screen.getByLabelText('보드 이름'), 'OEE');
    await userEvent.click(screen.getByRole('button', { name: '생성' }));
    await waitFor(() => expect(api.createBoard).toHaveBeenCalledWith('w1', 'OEE', 'grid'));
  });

  it('creates a board via the create-board dialog and navigates to its editor', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b2', name: 'New Board', kind: 'canvas', updatedAt: 't' });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));
    await userEvent.type(screen.getByLabelText('보드 이름'), 'New Board');
    await userEvent.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => expect(api.createBoard).toHaveBeenCalledWith('w1', 'New Board', 'canvas'));
    expect(await screen.findByText('editor page')).toBeInTheDocument();
  });

  it('does not create a board when the dialog is cancelled', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));
    await userEvent.type(screen.getByLabelText('보드 이름'), 'Some Name');
    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(api.createBoard).not.toHaveBeenCalled();
  });

  it('requires a non-empty name before the dialog can be submitted', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));

    expect(screen.getByLabelText('보드 이름')).toBeRequired();
    await userEvent.click(screen.getByRole('button', { name: '생성' }));

    expect(api.createBoard).not.toHaveBeenCalled();
  });

  it('resets the name field the next time the dialog is opened', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));
    await userEvent.type(screen.getByLabelText('보드 이름'), 'Draft Name');
    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    await userEvent.click(screen.getByRole('button', { name: '새 보드' }));
    expect(screen.getByLabelText('보드 이름')).toHaveValue('');
  });

  it('deletes a board after confirmation and removes it from the list', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: 't' }] });
    vi.mocked(api.deleteBoard).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Floor 1');
    await userEvent.click(screen.getByRole('button', { name: 'Floor 1 삭제' }));

    await waitFor(() => expect(api.deleteBoard).toHaveBeenCalledWith('w1', 'b1'));
    expect(screen.queryByText('Floor 1')).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when the list fails to load, and recovers on retry', async () => {
    vi.mocked(api.listBoards).mockRejectedValueOnce(new Error('network down'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 목록을 불러오지 못했습니다');

    vi.mocked(api.listBoards).mockResolvedValueOnce({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: 't' }] });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('Floor 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error inside the dialog when creating a board fails, and leaves it open to retry', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.createBoard).mockRejectedValue(new Error('network down'));

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '새 보드' }));
    await userEvent.type(screen.getByLabelText('보드 이름'), 'New Board');
    await userEvent.click(screen.getByRole('button', { name: '생성' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 생성에 실패했습니다');
    expect(screen.getByLabelText('보드 이름')).toHaveValue('New Board');
  });

  it('shows an empty state with a call-to-action when the workspace has no boards yet', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    renderPage();

    expect(await screen.findByText('아직 보드가 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '첫 보드 만들기' })).toBeInTheDocument();
  });

  it('filters the board list by name as the search query changes', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({
      boards: [
        { id: 'b1', name: 'Factory Floor 1', kind: 'canvas', updatedAt: 't' },
        { id: 'b2', name: 'Warehouse Overview', kind: 'canvas', updatedAt: 't' },
      ],
    });
    renderPage();
    await screen.findByText('Factory Floor 1');

    await userEvent.type(screen.getByLabelText('보드 검색'), 'floor');

    expect(screen.getByText('Factory Floor 1')).toBeInTheDocument();
    expect(screen.queryByText('Warehouse Overview')).not.toBeInTheDocument();
  });

  it('shows a no-results empty state when the search query matches nothing, without hiding the create action', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Factory Floor 1', kind: 'canvas', updatedAt: 't' }] });
    renderPage();
    await screen.findByText('Factory Floor 1');

    await userEvent.type(screen.getByLabelText('보드 검색'), 'nonexistent');

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('Factory Floor 1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 보드' })).toBeInTheDocument();
  });

  it('gives each board card delete button a distinct accessible name', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({
      boards: [
        { id: 'b1', name: 'Factory Floor 1', kind: 'canvas', updatedAt: 't' },
        { id: 'b2', name: 'Warehouse Overview', kind: 'canvas', updatedAt: 't' },
      ],
    });
    renderPage();
    await screen.findByText('Factory Floor 1');

    expect(screen.getByRole('button', { name: 'Factory Floor 1 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Warehouse Overview 삭제' })).toBeInTheDocument();
  });

  it('shows an error when deleting a board fails', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [{ id: 'b1', name: 'Floor 1', kind: 'canvas', updatedAt: 't' }] });
    vi.mocked(api.deleteBoard).mockRejectedValue(new Error('network down'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Floor 1');
    await userEvent.click(screen.getByRole('button', { name: 'Floor 1 삭제' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('보드 삭제에 실패했습니다');
    expect(screen.getByText('Floor 1')).toBeInTheDocument();
  });
  it('starts a board from an open-data sample: makes its data source, points the bindings at it, opens the editor', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    vi.mocked(api.createConnector).mockImplementation(async (_w, input: any) => ({ id: `new-${input.name}`, type: 'http', updatedAt: 't', ...input, attribution: input.attribution ?? undefined, description: input.description ?? undefined, sourceError: input.sourceError ?? undefined }));
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b9', name: '서울 도심 미세먼지', kind: 'canvas', updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b9', name: '서울 도심 미세먼지', updatedAt: 't', revision: 2 });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '첫 보드 만들기' }));
    await userEvent.click(await screen.findByRole('button', { name: '서울 도심 미세먼지 샘플로 만들기' }));

    expect(await screen.findByText('editor page')).toBeInTheDocument();
    expect(api.createConnector).toHaveBeenCalledWith('w1', expect.objectContaining({ authType: 'path', authValue: 'sample', attribution: expect.objectContaining({ text: expect.stringContaining('공공누리') }) }));
    expect(api.createBoard).toHaveBeenCalledWith('w1', '서울 도심 미세먼지');
    // Its data read from the source made for it.
    const document = vi.mocked(api.updateBoard).mock.calls[0][2].document as Board;
    expect([...new Set(Object.values(document.data ?? {}).map(read => read.from))]).toEqual(['new-서울시 실시간 대기환경']);
  });

  it('asks for the key of a source that issues each user one, and refuses to start without it', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.createConnector).mockImplementation(async (_w, input: any) => ({ id: 'new-subway', type: 'http', updatedAt: 't', ...input, attribution: undefined, description: undefined, sourceError: undefined }));
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b9', name: 'x', kind: 'canvas', updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b9', name: 'x', updatedAt: 't', revision: 2 });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '첫 보드 만들기' }));
    const start = await screen.findByRole('button', { name: '시청 일대 지하철 실시간 도착 샘플로 만들기' });
    const card = start.closest('li')!;
    expect(within(card).getByText('발급 키 필요')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'data.seoul.go.kr' })).toHaveAttribute('href', 'https://data.seoul.go.kr');

    await userEvent.click(start);
    expect(await screen.findByRole('alert')).toHaveTextContent('‘서울시 지하철 실시간 도착정보’ 키를 입력하세요');
    expect(api.createConnector).not.toHaveBeenCalled();

    await userEvent.type(within(card).getByLabelText('서울시 지하철 실시간 도착정보 키'), 'my-key');
    await userEvent.click(start);
    expect(await screen.findByText('editor page')).toBeInTheDocument();
    expect(api.createConnector).toHaveBeenCalledWith('w1', expect.objectContaining({ authType: 'path', authValue: 'my-key', sourceError: { path: '/code', messagePath: '/message' } }));
  });

  it('asks no key for a source the workspace already has a data source for', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.listConnectors).mockResolvedValue({
      connectors: [{ id: 'mine', name: '내 키', type: 'http', baseUrl: 'http://swopenapi.seoul.go.kr/api/subway/{key}', authType: 'path', updatedAt: 't' }],
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '첫 보드 만들기' }));
    const card = (await screen.findByRole('button', { name: '시청 일대 지하철 실시간 도착 샘플로 만들기' })).closest('li')!;
    await waitFor(() => expect(within(card).queryByText('발급 키 필요')).not.toBeInTheDocument());
    expect(within(card).queryByLabelText('서울시 지하철 실시간 도착정보 키')).not.toBeInTheDocument();
  });

  it('reuses a data source the workspace already has for the same address', async () => {
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    vi.mocked(api.listConnectors).mockResolvedValue({
      connectors: [{ id: 'mine', name: '내 키', type: 'http', baseUrl: 'http://openapi.seoul.go.kr:8088/{key}', authType: 'path', updatedAt: 't' }],
    });
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b9', name: 'x', kind: 'canvas', updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b9', name: 'x', updatedAt: 't', revision: 2 });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '첫 보드 만들기' }));
    await userEvent.type(screen.getByLabelText('보드 이름'), '광장');
    await userEvent.click(await screen.findByRole('button', { name: '광화문·덕수궁 실시간 샘플로 만들기' }));

    await screen.findByText('editor page');
    expect(api.createConnector).not.toHaveBeenCalled();
    expect(api.createBoard).toHaveBeenCalledWith('w1', '광장');
  });
});
