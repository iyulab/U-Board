import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { BoardAuthoring, KO_DESIGNER_LABELS, type AuthoringMode } from '@iyulab/u-board-designer';
import type { Adapter, Board } from '@iyulab/u-board';
import {
  getBoard, updateBoard, listConnectors, type ConnectorSummary,
  listMembers, apiClock, ApiError,
} from '../api-client.js';
import { HttpConnectorAdapter } from '../http-connector-adapter.js';
import './BoardEditorPage.css';
import { Loading } from '../design-system/Loading.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { ShareDialog } from './ShareDialog.js';
import { AssistantPanel } from '../assistant/AssistantPanel.js';

// The editor's words, plus where a workspace without a data source goes next: the console's own
// screens, which the library's generic wording cannot name.
const EDITOR_LABELS = {
  ...KO_DESIGNER_LABELS,
  noDataSources: '연결된 데이터소스가 없습니다. 워크스페이스 소유자가 «데이터소스»에서 추가하면 여기서 고를 수 있습니다. 실제 데이터로 바로 보려면 보드 목록의 «샘플에서 시작»을 쓰세요.',
};

export function BoardEditorPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const { boardId } = useParams<{ boardId: string }>();
  // `?scripts=off` opens the board without running its script elements — the way back to a board whose element code
  // never finishes, in a browser where such code holds the whole page.
  const [searchParams] = useSearchParams();
  const scriptsOff = searchParams.get('scripts') === 'off';
  // The board as stored; the editor draws it as any host does, through the workspace's data sources.
  const [document, setDocument] = useState<Board | null>(null);
  // The origins this installation lets a board's elements load from, as the server says with the board.
  const [elementOrigins, setElementOrigins] = useState<readonly string[]>([]);
  // Where the board's script elements' frames are served: the server says when each definition has an origin of its own.
  const [elementFrames, setElementFrames] = useState<string | undefined>();
  const [boardName, setBoardName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // The revision the editor's copy was read or last saved at — what a save names (If-Match), so a save
  // made after someone else's is refused instead of overwriting it unseen. A ref, read when a save is
  // sent: a save queued behind another must name the revision that one produced.
  const revision = useRef<number | undefined>(undefined);
  // Saves go one after another, so a second click while one is on its way is not refused as a conflict
  // with the first.
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  // The author chose to keep their changes over someone else's save: the next save overwrites it.
  const [overwriteArmed, setOverwriteArmed] = useState(false);
  // A save refused because the board was saved by someone else meanwhile: the author's document, and
  // the revision the board is at now.
  const [conflict, setConflict] = useState<{ revision: number } | null>(null);
  // Bumped to start the editor afresh on a document — after a conflict is settled either way.
  const [editorGeneration, setEditorGeneration] = useState(0);

  const [isOwner, setIsOwner] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  // The chat that draws this board with a model the person chooses (demo chat builder).
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  // Edit or View, kept across the editor being opened again on a saved change — one watching the assistant draw in
  // View stays in View.
  const [editorMode, setEditorMode] = useState<AuthoringMode>('edit');
  useEffect(() => {
    // A board opened after another must not be overwritten by the first one's late answer.
    let cancelled = false;
    setDocument(null);
    setLoadError(null);
    setConflict(null);
    setOverwriteArmed(false);
    getBoard(workspaceId, boardId!)
      .then(board => {
        if (cancelled) return;
        setDocument(board.document);
        setElementOrigins(board.elementOrigins ?? []);
        setElementFrames(board.elementFrames);
        revision.current = board.revision;
        setBoardName(board.name);
      })
      .catch(() => {
        if (!cancelled) setLoadError('보드를 불러오지 못했습니다');
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, boardId]);

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

  const adapters: readonly Adapter[] = useMemo(
    () => connectors.map(c => new HttpConnectorAdapter(workspaceId, c.id, c.attribution, c.type === 'static' && c.sample)),
    [workspaceId, connectors]
  );

  const connectorLabels = useMemo(() => Object.fromEntries(connectors.map(c => [c.id, c.name])), [connectors]);

  // A board's trigger asking for another board (in View) opens that board here — asking first, as the way back does,
  // when changes are unsaved.
  const navigate = useNavigate();
  function handleNavigate({ board }: { board: string }) {
    if (hasUnsavedChanges && !window.confirm('저장되지 않은 변경 사항이 있습니다. 다른 보드로 이동할까요?')) return;
    navigate(`/boards/${encodeURIComponent(board)}/edit`);
  }

  function handleBackClick(e: MouseEvent) {
    // BoardAuthoring's unsaved-changes guard is a native `beforeunload` listener, which only
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

  function handleSave(doc: Board): Promise<void> {
    const save = saving.current.catch(() => {}).then(() => saveNow(doc));
    saving.current = save;
    return save;
  }

  async function saveNow(doc: Board) {
    try {
      const saved = await updateBoard(workspaceId, boardId!, { document: doc }, revision.current);
      revision.current = saved.revision;
      setSaveError(null);
      setConflict(null);
      setOverwriteArmed(false);
      setSavedAt(new Date());
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BOARD_CHANGED' && typeof err.body.revision === 'number') {
        setConflict({ revision: err.body.revision });
        setOverwriteArmed(false);
        setSaveError(null);
      } else {
        setSaveError('저장 실패');
      }
      setSavedAt(null);
      // Rethrow so the editor's unsaved-changes guard knows this save didn't actually
      // happen — it awaits `onSave` and only clears the beforeunload warning on success.
      throw err;
    }
  }

  // Keeps the author's changes — including any made since the refused save — over the other save: the
  // next save names the revision the board is at now, so a third save in between is caught the same way.
  function keepMine() {
    if (!conflict) return;
    revision.current = conflict.revision;
    setConflict(null);
    setOverwriteArmed(true);
  }

  // Drops the author's unsaved document for the board as it is saved now.
  async function reloadTheirs() {
    try {
      const board = await getBoard(workspaceId, boardId!);
      setDocument(board.document);
      revision.current = board.revision;
      setBoardName(board.name);
      setConflict(null);
      setOverwriteArmed(false);
      setSavedAt(null);
      setSaveError(null);
      setEditorGeneration(g => g + 1);
    } catch {
      setSaveError('보드를 불러오지 못했습니다');
    }
  }

  // The assistant saved a change: the editor shows the board as it is saved now — read through the workspace's sources as
  // they are now, a source the assistant made for it among them. Sending is held while there are unsaved edits, so
  // nothing of the author's is dropped here.
  async function reloadSaved() {
    try {
      const [board, sources] = await Promise.all([getBoard(workspaceId, boardId!), listConnectors(workspaceId)]);
      setConnectors(sources.connectors);
      setDocument(board.document);
      revision.current = board.revision;
      setBoardName(board.name);
      setSavedAt(new Date());
      setEditorGeneration(g => g + 1);
    } catch {
      setSaveError('보드를 불러오지 못했습니다');
    }
  }

  function handleDirtyChange(dirty: boolean) {
    setHasUnsavedChanges(dirty);
    // A fresh edit makes the last "저장됨" stale — only an edit re-dirties the document (a
    // successful save calls this with `false`, which must NOT clear the status it just set).
    if (dirty) setSavedAt(null);
  }

  // The server serves the frames the board's script elements run in under this address — none while opened with scripts
  // off, so no element code runs.
  const elementFramesAt = scriptsOff ? undefined : (elementFrames ?? `/api/element-frames/${encodeURIComponent(boardId!)}`);

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
        <>
          <Button variant={isAssistantOpen ? 'solid' : 'ghost'} onClick={() => setIsAssistantOpen(open => !open)} aria-pressed={isAssistantOpen}>
            ✦ AI 비서
          </Button>
          {isOwner && (
            <Button variant="ghost" onClick={() => setIsShareOpen(true)}>
              공유
            </Button>
          )}
        </>
      )}
      {connectorsError && <Alert>{connectorsError}</Alert>}
      {membersError && <Alert>{membersError}</Alert>}
      {saveError && <Alert>{saveError}</Alert>}
      {scriptsOff && (
        <Alert>
          스크립트 요소를 실행하지 않고 열었습니다 — 멈추는 요소 코드는 «요소» 목록에서 고쳐 저장하세요. 이미 멈춘
          코드는 브라우저가 계속 돌릴 수 있어, 고친 요소가 그려지지 않으면 브라우저를 다시 시작하세요.{' '}
          <Link to={`/boards/${encodeURIComponent(boardId!)}/edit`} reloadDocument>
            스크립트를 켜고 열기
          </Link>
        </Alert>
      )}
      {conflict && (
        <Alert>
          다른 사람이 그사이 이 보드를 저장해, 내 변경은 저장되지 않았습니다.{' '}
          <Button variant="ghost" onClick={reloadTheirs}>
            그쪽 보드 불러오기(내 변경 버림)
          </Button>{' '}
          <Button variant="ghost" onClick={keepMine}>
            내 변경 유지(다음 저장 때 덮어씀)
          </Button>
        </Alert>
      )}
      {overwriteArmed && <Alert>저장하면 다른 사람이 그사이 저장한 내용을 내 변경으로 덮어씁니다.</Alert>}
      <div className="ub-editor-body">
      <div className="ub-editor-canvas">
      <BoardAuthoring
          key={`${boardId}:${editorGeneration}`}
          initialBoard={document}
          initialMode={editorMode}
          onModeChange={setEditorMode}
          adapters={adapters}
          sourceLabels={connectorLabels}
          onDirtyChange={handleDirtyChange}
          onSave={handleSave}
          labels={EDITOR_LABELS}
          clock={apiClock.now}
          boardId={boardId}
          onNavigate={handleNavigate}
          elementOrigins={elementOrigins}
          elementFrames={elementFramesAt}
        />
      </div>
      {isAssistantOpen && (
        <AssistantPanel
          workspaceId={workspaceId}
          board={{ id: boardId!, name: boardName, kind: document.layout.kind }}
          blocked={hasUnsavedChanges ? '저장하지 않은 편집이 있습니다 — 먼저 저장하면 비서가 그 위에 이어서 그립니다.' : undefined}
          lookSetting={{
            adapters,
            clock: apiClock.now,
            elementOrigins,
            elementFrames: elementFramesAt,
          }}
          onBoardChanged={reloadSaved}
          onClose={() => setIsAssistantOpen(false)}
        />
      )}
      </div>
      {isOwner && (
        <ShareDialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          workspaceId={workspaceId}
          boardId={boardId!}
          boardName={boardName}
        />
      )}
    </div>
  );
}
