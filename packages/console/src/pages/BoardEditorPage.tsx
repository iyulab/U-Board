import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthoringView, DemoAdapter, type ViewDocument, type Adapter } from '@iyulab/u-board';
import { getBoard, updateBoard, listConnectors, type ConnectorSummary } from '../api-client.js';
import { HttpConnectorAdapter } from '../http-connector-adapter.js';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export function BoardEditorPage({ workspaceId }: { workspaceId: string }) {
  const { boardId } = useParams<{ boardId: string }>();
  const [document, setDocument] = useState<ViewDocument | null>(null);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    getBoard(workspaceId, boardId!).then(board => setDocument(board.document));
  }, [workspaceId, boardId]);

  useEffect(() => {
    listConnectors(workspaceId)
      .then(res => setConnectors(res.connectors))
      .catch(() => setConnectorsError('데이터소스 목록을 불러오지 못했습니다'));
  }, [workspaceId]);

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
    </>
  );
}
