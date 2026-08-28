import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listBoards, createBoard, deleteBoard } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Modal } from '../design-system/Modal.js';

type BoardSummary = { id: string; name: string; updatedAt: string };

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();

  function reload() {
    setLoadError(null);
    return listBoards(workspaceId)
      .then(res => setBoards(res.boards))
      .catch(() => setLoadError('보드 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, [workspaceId]);

  function openCreateDialog() {
    setNewBoardName('');
    setCreateError(null);
    setIsCreateOpen(true);
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await createBoard(workspaceId, newBoardName);
      setIsCreateOpen(false);
      navigate(`/boards/${created.id}/edit`);
    } catch {
      setCreateError('보드 생성에 실패했습니다');
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

  if (isLoading) return <p>불러오는 중...</p>;

  return (
    <div>
      <h2>보드</h2>
      {loadError && <Alert onRetry={reload}>{loadError}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      <Button onClick={openCreateDialog}>새 보드</Button>
      <ul>
        {boards.map(b => (
          <li key={b.id}>
            <Link to={`/boards/${b.id}/edit`}>{b.name}</Link> — {b.updatedAt}{' '}
            <Button variant="danger" onClick={() => handleDelete(b.id)}>삭제</Button>
          </li>
        ))}
      </ul>
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} labelledBy="create-board-heading">
        <h3 id="create-board-heading">새 보드</h3>
        <form onSubmit={handleCreateSubmit}>
          <FormField label="보드 이름">
            <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} required autoFocus />
          </FormField>
          {createError && <Alert>{createError}</Alert>}
          <Button type="submit">생성</Button>{' '}
          <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
            취소
          </Button>
        </form>
      </Modal>
    </div>
  );
}
