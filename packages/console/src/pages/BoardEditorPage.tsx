import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthoringView, DemoAdapter, type ViewDocument } from '@iyulab/u-board';
import { getBoard, updateBoard } from '../api-client.js';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export function BoardEditorPage({ workspaceId }: { workspaceId: string }) {
  const { boardId } = useParams<{ boardId: string }>();
  const [document, setDocument] = useState<ViewDocument | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const adapters = useMemo(() => [new DemoAdapter()], []);

  useEffect(() => {
    getBoard(workspaceId, boardId!).then(board => setDocument(board.document));
  }, [workspaceId, boardId]);

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
      {saveError && <p role="alert">{saveError}</p>}
      {savedAt && <p role="status">저장됨</p>}
      <AuthoringView key={boardId} initialDocument={document} adapters={adapters} width={width} height={height} onSave={handleSave} />
    </>
  );
}
