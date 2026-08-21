import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthoringView, DemoAdapter, type ViewDocument, type Adapter } from '@iyulab/u-board';
import {
  getBoard, updateBoard, listConnectors, type ConnectorSummary,
  listMembers, listShareTokens, createShareToken, deleteShareToken, type ShareTokenSummary,
} from '../api-client.js';
import { HttpConnectorAdapter } from '../http-connector-adapter.js';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export function BoardEditorPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const { boardId } = useParams<{ boardId: string }>();
  const [document, setDocument] = useState<ViewDocument | null>(null);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [isOwner, setIsOwner] = useState(false);
  const [shareTokens, setShareTokens] = useState<ShareTokenSummary[]>([]);
  const [shareError, setShareError] = useState<string | null>(null);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);

  useEffect(() => {
    getBoard(workspaceId, boardId!).then(board => setDocument(board.document));
  }, [workspaceId, boardId]);

  useEffect(() => {
    listConnectors(workspaceId)
      .then(res => setConnectors(res.connectors))
      .catch(() => setConnectorsError('데이터소스 목록을 불러오지 못했습니다'));
  }, [workspaceId]);

  useEffect(() => {
    listMembers(workspaceId).then(res => setIsOwner(res.members.find(m => m.userId === userId)?.role === 'owner'));
  }, [workspaceId, userId]);

  function reloadShareTokens() {
    return listShareTokens(workspaceId, boardId!)
      .then(res => {
        setShareError(null);
        setShareTokens(res.tokens);
      })
      .catch(() => setShareError('공유 링크 목록을 불러오지 못했습니다'));
  }

  useEffect(() => {
    // Gated on `isOwner`, not just the panel's visibility: the server's list route is
    // owner-only too (Task 3), so firing this for a member would 403 and show a spurious
    // "failed to load" alert on a page that member never sees the share panel on at all.
    if (isOwner) reloadShareTokens();
  }, [workspaceId, boardId, isOwner]);

  async function handleCreateShareToken() {
    try {
      const created = await createShareToken(workspaceId, boardId!);
      setShareError(null);
      setNewShareUrl(`${window.location.origin}/?board=${boardId}&token=${created.token}`);
      await reloadShareTokens();
    } catch {
      setShareError('공유 링크 생성에 실패했습니다');
    }
  }

  async function handleRevokeShareToken(tokenId: string) {
    try {
      await deleteShareToken(workspaceId, boardId!, tokenId);
      setShareError(null);
      setShareTokens(prev => prev.filter(t => t.id !== tokenId));
    } catch {
      setShareError('공유 링크 회수에 실패했습니다');
    }
  }

  const adapters: readonly Adapter[] = useMemo(() => {
    const demo = new DemoAdapter();
    const real = connectors.map(c => new HttpConnectorAdapter(workspaceId, c.id));
    return [demo, ...real];
  }, [workspaceId, connectors]);

  if (!document) return <p>불러오는 중...</p>;

  const width = document.background.image?.width ?? DEFAULT_WIDTH;
  const height = document.background.image?.height ?? DEFAULT_HEIGHT;

  async function handleSave(doc: ViewDocument) {
    try {
      await updateBoard(workspaceId, boardId!, { document: doc });
      setSaveError(null);
      setSavedAt(new Date());
    } catch {
      setSaveError('저장 실패');
    }
  }

  return (
    <>
      {connectorsError && <p role="alert">{connectorsError}</p>}
      {saveError && <p role="alert">{saveError}</p>}
      {savedAt && <p role="status">저장됨</p>}
      <AuthoringView key={boardId} initialDocument={document} adapters={adapters} width={width} height={height} onSave={handleSave} />

      {isOwner && (
        <details>
          <summary>공유</summary>
          {shareError && <p role="alert">{shareError}</p>}
          <ul>
            {shareTokens.map(t => (
              <li key={t.id}>
                {`•••• ${t.tokenMask}`} — {t.createdAt}
                {t.lastUsedAt ? ` (마지막 사용: ${t.lastUsedAt})` : ' (미사용)'}{' '}
                <button onClick={() => handleRevokeShareToken(t.id)}>회수</button>
              </li>
            ))}
          </ul>
          <button onClick={handleCreateShareToken}>새 공유 링크 생성</button>
          {newShareUrl && (
            <p>
              이 링크는 다시 볼 수 없습니다 — 지금 복사하세요: <code>{newShareUrl}</code>
            </p>
          )}
        </details>
      )}
    </>
  );
}
