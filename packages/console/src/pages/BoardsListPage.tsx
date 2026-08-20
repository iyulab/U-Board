import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listBoards, createBoard, deleteBoard } from '../api-client.js';

type BoardSummary = { id: string; name: string; updatedAt: string };

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listBoards(workspaceId).then(res => setBoards(res.boards));
  }, [workspaceId]);

  async function handleCreate() {
    const name = window.prompt('보드 이름');
    if (!name) return;
    const created = await createBoard(workspaceId, name);
    navigate(`/boards/${created.id}/edit`);
  }

  async function handleDelete(boardId: string) {
    if (!window.confirm('이 보드를 삭제할까요?')) return;
    await deleteBoard(workspaceId, boardId);
    setBoards(prev => prev.filter(b => b.id !== boardId));
  }

  return (
    <div>
      <h2>보드</h2>
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
