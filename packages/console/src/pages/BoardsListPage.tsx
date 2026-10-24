import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { listBoards, createBoard, deleteBoard, listConnectors, ApiError, type ConnectorSummary } from '../api-client.js';
import { createBoardFromSample, keysToAsk, loadSamplePacks, MissingSampleKeyError, sampleHosts } from '../sample-boards.js';
import type { SamplePack } from '@iyulab/u-board-samples';
import type { ViewKind } from '@iyulab/u-board/picture';

import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';
import { Modal } from '../design-system/Modal.js';
import { Card, CardGrid } from '../design-system/Card.js';
import { EmptyState } from '../design-system/EmptyState.js';
import './BoardsListPage.css';
import { Loading } from '../design-system/Loading.js';
import { Timestamp } from '../format-time.js';

type BoardSummary = { id: string; name: string; kind: ViewKind; updatedAt: string };

/** What each kind of board is called, and what it is for — said where a board is made. */
const KIND_NAMES: Record<ViewKind, string> = { canvas: '캔버스', grid: '그리드' };
const KIND_HINTS: Record<ViewKind, string> = {
  canvas: '도면·지도 같은 배경 위에 위젯을 제자리에 놓습니다',
  grid: '위젯을 순서대로 칸에 늘어놓고, 화면 폭에 맞춰 줄을 바꿉니다',
};

export function BoardsListPage({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardKind, setNewBoardKind] = useState<ViewKind>('canvas');
  const [createError, setCreateError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [samples, setSamples] = useState<readonly SamplePack[]>([]);
  const [creatingSample, setCreatingSample] = useState<string | null>(null);
  // The workspace's data sources, to tell which keys a sample still needs: one it already has keeps its key.
  const [workspaceConnectors, setWorkspaceConnectors] = useState<readonly ConnectorSummary[]>([]);
  // The keys typed per sample, by the sample's connector key.
  const [sampleKeys, setSampleKeys] = useState<Record<string, Record<string, string>>>({});
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
    setNewBoardKind('canvas');
    setCreateError(null);
    setIsCreateOpen(true);
    // Offered once they arrive; the dialog works without them.
    loadSamplePacks().then(setSamples, () => setSamples([]));
    setSampleKeys({});
    Promise.resolve()
      .then(() => listConnectors(workspaceId))
      .then(res => setWorkspaceConnectors(res.connectors), () => setWorkspaceConnectors([]));
  }

  function setSampleKey(packId: string, connectorKey: string, value: string) {
    setSampleKeys(prev => ({ ...prev, [packId]: { ...prev[packId], [connectorKey]: value } }));
  }

  async function handleSample(pack: SamplePack) {
    setCreateError(null);
    setCreatingSample(pack.id);
    try {
      const boardId = await createBoardFromSample(workspaceId, pack, newBoardName.trim() || pack.title.ko, sampleKeys[pack.id]);
      setIsCreateOpen(false);
      navigate(`/boards/${boardId}/edit`);
    } catch (err) {
      setCreateError(
        err instanceof MissingSampleKeyError
          ? `‘${err.connector.name}’ 키를 입력하세요 — 이 원천은 샘플 키를 주지 않아, 이용자마다 발급받은 키로 읽습니다`
          : err instanceof ApiError && err.status === 403
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
      const created = await createBoard(workspaceId, newBoardName, newBoardKind);
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
                {KIND_NAMES[b.kind]} · 수정 <Timestamp value={b.updatedAt} />
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
          <fieldset className="ub-kind-choice">
            <legend className="ub-field__label">보드 종류</legend>
            {(['canvas', 'grid'] as const).map(kind => (
              <label key={kind} className="ub-kind-choice__option">
                <input type="radio" name="board-kind" value={kind} checked={newBoardKind === kind} onChange={() => setNewBoardKind(kind)} />
                <span>
                  <strong>{KIND_NAMES[kind]}</strong> — {KIND_HINTS[kind]}
                </span>
              </label>
            ))}
          </fieldset>
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
                    {keysToAsk(pack, workspaceConnectors).length > 0 && <Badge variant="warning">발급 키 필요</Badge>}
                    <span>
                      {pack.field.ko} · {pack.kind.ko}
                    </span>
                  </div>
                  <p>{pack.summary.ko}</p>
                  <p className="ub-samples__meta">연결: {sampleHosts(pack).join(', ')}</p>
                  {keysToAsk(pack, workspaceConnectors).map(connector => (
                    <div key={connector.key} className="ub-samples__key">
                      <FormField label={`${connector.name} 키`}>
                        <input
                          type="password"
                          autoComplete="off"
                          value={sampleKeys[pack.id]?.[connector.key] ?? ''}
                          onChange={e => setSampleKey(pack.id, connector.key, e.target.value)}
                        />
                      </FormField>
                      <p className="ub-samples__meta">
                        이 원천은 이용자마다 키를 발급합니다 —{' '}
                        <a href={connector.ownKey!.signUpUrl} target="_blank" rel="noreferrer">
                          {new URL(connector.ownKey!.signUpUrl).host}
                        </a>
                        에서 받은 키를 넣으면 데이터소스에 저장됩니다.{connector.ownKey!.hint && ` ${connector.ownKey!.hint}`}
                      </p>
                    </div>
                  ))}
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
