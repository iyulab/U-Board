import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { AuthoringView, KO_LABELS, type ViewDocument, type Adapter } from '@iyulab/u-board';
import { DemoAdapter } from '@iyulab/u-board/demo';
import {
  getBoard, updateBoard, listConnectors, type ConnectorSummary,
  listMembers, apiClock,
} from '../api-client.js';
import { HttpConnectorAdapter } from '../http-connector-adapter.js';
import './BoardEditorPage.css';
import { Loading } from '../design-system/Loading.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { ShareDialog } from './ShareDialog.js';

/** True when any node's widget binds to `adapterId`. Used to warn before sharing a document bound
 * to the demo adapter: the server drops that adapter id from the share viewer's connector list
 * (`packages/server/src/routes/share.ts`, by design — a client-side mock must never reach a real
 * data path), so every such binding renders as `disconnected` there with no other indication. */
function documentHasBindingFor(doc: ViewDocument, adapterId: string): boolean {
  return doc.nodes.some(node =>
    Object.values(node.widget.bindings ?? {}).some(binding => binding.adapter === adapterId)
  );
}

export function BoardEditorPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const { boardId } = useParams<{ boardId: string }>();
  const [document, setDocument] = useState<ViewDocument | null>(null);
  const [boardName, setBoardName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Tracks the last *saved* document, not whatever AuthoringView holds mid-edit — a share link
  // is always generated from the server's copy (Task 4's `share.ts` reads `board.document`), so
  // this must reflect exactly what a new share link would actually serve.
  const [hasDemoBinding, setHasDemoBinding] = useState(false);

  const demoAdapter = useMemo(() => new DemoAdapter(), []);

  useEffect(() => {
    setDocument(null);
    setLoadError(null);
    getBoard(workspaceId, boardId!)
      .then(board => {
        setDocument(board.document);
        setBoardName(board.name);
        setHasDemoBinding(documentHasBindingFor(board.document, demoAdapter.id));
      })
      .catch(() => setLoadError('보드를 불러오지 못했습니다'));
  }, [workspaceId, boardId, demoAdapter]);

  useEffect(() => {
    listConnectors(workspaceId)
      .then(res => setConnectors(res.connectors))
      .catch(() => setConnectorsError('데이터소스 목록을 불러오지 못했습니다'));
  }, [workspaceId]);

  useEffect(() => {
    listMembers(workspaceId)
      .then(res => setIsOwner(res.members.find(m => m.userId === userId)?.role === 'owner'))
      .catch(() => setMembersError('구성원 정보를 불러오지 못했습니다'));
  }, [workspaceId, userId]);

  const adapters: readonly Adapter[] = useMemo(() => {
    const real = connectors.map(c => new HttpConnectorAdapter(workspaceId, c.id));
    // The binding form starts on the first: a real connector when there is one, the demo data otherwise.
    return [...real, demoAdapter];
  }, [demoAdapter, workspaceId, connectors]);

  const connectorLabels = useMemo(
    () => ({
      // The demo adapter's id is never in `connectors` (a real workspace data source), so this
      // never collides with — or gets overwritten by — a real connector's label below.
      [demoAdapter.id]: '데모 데이터 (예시, 실제 연결 아님)',
      ...Object.fromEntries(connectors.map(c => [c.id, c.name])),
    }),
    [demoAdapter, connectors]
  );

  function handleBackClick(e: MouseEvent) {
    // AuthoringView's unsaved-changes guard is a native `beforeunload` listener, which only
    // fires on a real page navigation — a client-side <Link> navigation would bypass it
    // silently, so this link needs its own guard for the in-app case.
    if (hasUnsavedChanges && !window.confirm('저장되지 않은 변경 사항이 있습니다. 목록으로 돌아갈까요?')) {
      e.preventDefault();
    }
  }

  // The editor sits outside the app shell, for the room its canvas needs; this header takes the
  // shell's place — the way back, which board this is, whether it is saved, and sharing.
  const header = (status?: ReactNode, actions?: ReactNode) => (
    <header className="ub-editor-header">
      <Link className="ub-editor-header__back" to="/boards" onClick={handleBackClick}>
        ◂ 보드 목록으로
      </Link>
      <h1 className="ub-editor-header__title">{boardName}</h1>
      <span className="ub-editor-header__status" role="status">
        {status}
      </span>
      <div className="ub-editor-header__actions">{actions}</div>
    </header>
  );

  if (loadError)
    return (
      <div className="ub-editor">
        {header()}
        <Alert>{loadError}</Alert>
      </div>
    );
  if (!document)
    return (
      <div className="ub-editor">
        {header()}
        <Loading />
      </div>
    );

  async function handleSave(doc: ViewDocument) {
    try {
      await updateBoard(workspaceId, boardId!, { document: doc });
      setSaveError(null);
      setSavedAt(new Date());
      setHasDemoBinding(documentHasBindingFor(doc, demoAdapter.id));
    } catch (err) {
      setSaveError('저장 실패');
      setSavedAt(null);
      // Rethrow so `AuthoringView`'s unsaved-changes guard knows this save didn't actually
      // happen — it awaits `onSave` and only clears the beforeunload warning on success.
      throw err;
    }
  }

  function handleDirtyChange(dirty: boolean) {
    setHasUnsavedChanges(dirty);
    // A fresh edit makes the last "저장됨" stale — only an edit re-dirties the document (a
    // successful save calls this with `false`, which must NOT clear the status it just set).
    if (dirty) setSavedAt(null);
  }

  // Always the same slot, so a change of state never moves the editor.
  const saveStatus = hasUnsavedChanges ? (
    <Badge variant="warning">저장되지 않은 변경 사항</Badge>
  ) : savedAt ? (
    <Badge variant="success">저장됨</Badge>
  ) : null;

  return (
    <div className="ub-editor">
      {header(
        saveStatus,
        isOwner && (
          <Button variant="ghost" onClick={() => setIsShareOpen(true)}>
            공유
          </Button>
        )
      )}
      {connectorsError && <Alert>{connectorsError}</Alert>}
      {membersError && <Alert>{membersError}</Alert>}
      {saveError && <Alert>{saveError}</Alert>}
      <div className="ub-editor-canvas">
        <AuthoringView
          key={boardId}
          initialDocument={document}
          adapters={adapters}
          connectorLabels={connectorLabels}
          onDirtyChange={handleDirtyChange}
          onSave={handleSave}
          labels={KO_LABELS}
          clock={apiClock.now}
        />
      </div>
      {isOwner && (
        <ShareDialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          workspaceId={workspaceId}
          boardId={boardId!}
          boardName={boardName}
          hasDemoBinding={hasDemoBinding}
        />
      )}
    </div>
  );
}
