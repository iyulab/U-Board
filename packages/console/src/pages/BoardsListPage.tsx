import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { listBoards, createBoard, deleteBoard, ApiError } from '../api-client.js';
import { createBoardFromSample, loadSamplePacks, sampleHosts } from '../sample-boards.js';
import type { SamplePack } from '@iyulab/u-board-samples';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Modal } from '../design-system/Modal.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './BoardsListPage.css';
import { Loading } from '../design-system/Loading.js';
import { Timestamp } from '../format-time.js';

type BoardSummary = { id: string; name: string; updatedAt: string };

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [samples, setSamples] = useState<readonly SamplePack[]>([]);
  const [creatingSample, setCreatingSample] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredBoards = useMemo(
    () => boards.filter(b => b.name.toLowerCase().includes(query.trim().toLowerCase())),
    [boards, query]
  );

  const reload = useCallback(() => {
    setLoadError(null);
    return listBoards(workspaceId)
      .then(res => setBoards(res.boards))
      .catch(() => setLoadError('보드 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreateDialog() {
    setNewBoardName('');
    setCreateError(null);
    setIsCreateOpen(true);
    // Offered once they arrive; the dialog works without them.
    loadSamplePacks().then(setSamples, () => setSamples([]));
  }

  async function handleSample(pack: SamplePack) {
    setCreateError(null);
    setCreatingSample(pack.id);
    try {
      const boardId = await createBoardFromSample(workspaceId, pack, newBoardName.trim() || pack.title.ko);
      setIsCreateOpen(false);
      navigate(`/boards/${boardId}/edit`);
    } catch (err) {
      setCreateError(
        err instanceof ApiError && err.status === 403
          ? '샘플은 데이터소스를 함께 만들기 때문에 워크스페이스 소유자만 추가할 수 있습니다'
          : '샘플로 보드를 만들지 못했습니다'
      );
    } finally {
      setCreatingSample(null);
    }
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

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="ub-boards-header">
        <h2>보드</h2>
        <input
          className="ub-boards-search"
          type="search"
          aria-label="보드 검색"
          placeholder="보드 검색"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button onClick={openCreateDialog}>새 보드</Button>
      </div>
      {loadError && <Alert onRetry={reload}>{loadError}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {boards.length === 0 ? (
        <EmptyState>
          <p>아직 보드가 없습니다.</p>
          <Button onClick={openCreateDialog}>첫 보드 만들기</Button>
        </EmptyState>
      ) : filteredBoards.length === 0 ? (
        <EmptyState>
          <p>검색 결과가 없습니다.</p>
        </EmptyState>
      ) : (
        <CardGrid>
          {filteredBoards.map(b => (
            <Card key={b.id}>
              <Link className="ub-board-card__link" to={`/boards/${b.id}/edit`}>{b.name}</Link>
              <span className="ub-board-card__meta">
                수정 <Timestamp value={b.updatedAt} />
              </span>
              <div className="ub-board-card__footer">
                <Button variant="danger" aria-label={`${b.name} 삭제`} onClick={() => handleDelete(b.id)}>삭제</Button>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} labelledBy="create-board-heading">
        <h3 id="create-board-heading">새 보드</h3>
        <form onSubmit={handleCreateSubmit}>
          <FormField label="보드 이름">
            <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} required />
          </FormField>
          {createError && <Alert>{createError}</Alert>}
          <Button type="submit">생성</Button>{' '}
          <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
            취소
          </Button>
        </form>
        {samples.length > 0 && (
          <section className="ub-samples" aria-labelledby="samples-heading">
            <h4 id="samples-heading">샘플에서 시작</h4>
            <p className="ub-samples__note">
              공공기관이 개방한 데이터로 만든 보드입니다. 데이터소스를 함께 만들어 아래 주소에 연결하며, 이 설치본이
              인터넷에 닿지 않으면 값이 ‘연결 끊김’으로 보입니다. 보드 이름을 적지 않으면 샘플 이름을 씁니다.
            </p>
            <ul className="ub-samples__list">
              {samples.map(pack => (
                <li key={pack.id} className="ub-samples__item">
                  <div className="ub-samples__title">
                    <strong>{pack.title.ko}</strong>
                    <span>
                      {pack.field.ko} · {pack.kind.ko}
                    </span>
                  </div>
                  <p>{pack.summary.ko}</p>
                  <p className="ub-samples__meta">연결: {sampleHosts(pack).join(', ')}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`${pack.title.ko} 샘플로 만들기`}
                    disabled={creatingSample !== null}
                    onClick={() => handleSample(pack)}
                  >
                    {creatingSample === pack.id ? '만드는 중…' : '이 샘플로 만들기'}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Modal>
    </div>
  );
}
