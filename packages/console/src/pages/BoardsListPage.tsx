import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listBoards, createBoard, deleteBoard } from '../api-client.js';

type BoardSummary = { id: string; name: string; updatedAt: string };

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  function reload() {
    setLoadError(null);
    return listBoards(workspaceId)
      .then(res => setBoards(res.boards))
      .catch(() => setLoadError('보드 목록을 불러오지 못했습니다'));
  }

  useEffect(() => {
    reload();
  }, [workspaceId]);

  async function handleCreate() {
    const name = window.prompt('보드 이름');
    if (!name) return;
    try {
      const created = await createBoard(workspaceId, name);
      navigate(`/boards/${created.id}/edit`);
    } catch {
      setActionError('보드 생성에 실패했습니다');
    }
  }

  async function handleDelete(boardId: string) {
    if (!window.confirm('이 보드를 삭제할까요?')) return;
    try {
      await deleteBoard(workspaceId, boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
    } catch {
      setActionError('보드 삭제에 실패했습니다');
    }
  }

  return (
    <div>
      <h2>보드</h2>
      {loadError && (
        <p role="alert">
          {loadError} <button onClick={reload}>다시 시도</button>
        </p>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      <button onClick={handleCreate}>새 보드</button>
      <ul>
        {boards.map(b => (
          <li key={b.id}>
            <Link to={`/boards/${b.id}/edit`}>{b.name}</Link> — {b.updatedAt}{' '}
            <button onClick={() => handleDelete(b.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
