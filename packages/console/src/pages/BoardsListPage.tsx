import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listBoards, createBoard, deleteBoard } from '../api-client.js';

type BoardSummary = { id: string; name: string; updatedAt: string };

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  // `<dialog>` (native modal — focus trap, Escape-to-close, and top-layer rendering come for
  // free from the platform, none of which a plain positioned `<div>` gives you without hand-
  // rolling it) is driven imperatively per the HTML spec — `open` as a JSX prop alone would
  // render it non-modal. `onClose` below covers every way it can close (Cancel, Escape, and
  // after a successful create) so the two stay in sync regardless of which one happened.
  useEffect(() => {
    if (isCreateOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isCreateOpen]);

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
      // Left open — same "fix and resubmit without retyping" pattern ConnectorsPage's inline
      // form uses on a failed create.
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

  return (
    <div>
      <h2>보드</h2>
      {loadError && (
        <p role="alert">
          {loadError} <button onClick={reload}>다시 시도</button>
        </p>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      <button onClick={openCreateDialog}>새 보드</button>
      <ul>
        {boards.map(b => (
          <li key={b.id}>
            <Link to={`/boards/${b.id}/edit`}>{b.name}</Link> — {b.updatedAt}{' '}
            <button onClick={() => handleDelete(b.id)}>삭제</button>
          </li>
        ))}
      </ul>
      <dialog ref={dialogRef} onClose={() => setIsCreateOpen(false)} aria-labelledby="create-board-heading">
        <h3 id="create-board-heading">새 보드</h3>
        <form onSubmit={handleCreateSubmit}>
          <label>
            보드 이름
            <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} required autoFocus />
          </label>
          {createError && <p role="alert">{createError}</p>}
          <button type="submit">생성</button>{' '}
          <button type="button" onClick={() => setIsCreateOpen(false)}>
            취소
          </button>
        </form>
      </dialog>
    </div>
  );
}
