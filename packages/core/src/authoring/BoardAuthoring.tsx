import { useEffect, useMemo, useState } from 'react';
import type { Adapter } from '../adapter.js';
import type { UBoardLabels } from '../labels.js';
import { useLabels } from '../use-labels.js';
import { GROUP_STYLE } from '../ui-style.js';
import type { CanvasView, ViewDocument } from '../view-document.js';
import { ElementHost } from '../renderer/element-view.js';
import { ViewerPage, type ViewerPageProps } from '../viewer/ViewerPage.js';
import { toViewDocument } from '../board-v2/picture.js';
import type { BoardV2 } from '../board-v2/types.js';
import { CanvasAuthoring } from './CanvasAuthoring.js';
import type { AuthoringMode } from './editor-parts.js';
import { placesItself, withPictureLayout } from './board-layout.js';
import { recordEdit, redo, startHistory, undo, type DocumentHistory } from './document-history.js';

export interface BoardAuthoringProps {
  /** The board to edit, in the language's second version. */
  initialBoard: BoardV2;
  /** The keys of each data read's items as they are now — what a grid lays out a part per item by. */
  keys?: Readonly<Record<string, readonly string[]>>;
  adapters: readonly Adapter[];
  width?: number;
  height?: number;
  /** What Save does. Omitted, there is no Save — Export downloads the board. */
  onSave?: (board: BoardV2) => void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  labels?: Partial<UBoardLabels>;
  clock?: () => number;
  elementOrigins?: readonly string[];
  elementFrames?: string;
  boardId?: string;
  onTrigger?: ViewerPageProps['onTrigger'];
  onNavigate?: ViewerPageProps['onNavigate'];
  linkOrigins?: readonly string[];
  initialMode?: AuthoringMode;
  onModeChange?: (mode: AuthoringMode) => void;
}

/**
 * The authoring surface of a board in the language's second version: the board drawn from its picture, where its parts
 * are moved, sized and deleted — each edit said again in the board's layout (`withPictureLayout`), nothing else of the
 * board touched. Undo, Redo, Save and Export are the board's. A part's settings are not edited here yet; a grid's
 * layout neither — a grid board is shown as its viewers see it.
 */
export function BoardAuthoring({ initialBoard, keys, adapters, width, height, onSave, onDirtyChange, labels: labelsProp, clock = Date.now, elementOrigins, elementFrames, boardId, onTrigger, onNavigate, linkOrigins, initialMode = 'edit', onModeChange }: BoardAuthoringProps) {
  const labels = useLabels(labelsProp);
  const [history, setHistory] = useState<DocumentHistory<BoardV2>>(() => startHistory(initialBoard));
  const board = history.present;
  const [lastSaved, setLastSaved] = useState(initialBoard);
  const isDirty = board !== lastSaved;
  const [mode, setModeState] = useState<AuthoringMode>(initialMode);
  const setMode = (next: AuthoringMode) => {
    setModeState(next);
    onModeChange?.(next);
  };
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const keysOf = useMemo(() => (data: string) => [...(keys?.[data] ?? [])], [keys]);
  const pictureOf = (b: BoardV2): ViewDocument => toViewDocument(b, { keysOf });
  const picture = useMemo(() => toViewDocument(board, { keysOf }), [board, keysOf]);
  const movable = useMemo(() => (id: string) => placesItself(board, id), [board]);

  const handleSave = async () => {
    if (!onSave) return handleExport();
    try {
      await onSave(board);
      setLastSaved(board);
    } catch {
      // The host says why it failed; the board stays unsaved.
    }
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'board.json';
    link.click();
    URL.revokeObjectURL(url);
    if (!onSave) setLastSaved(board);
  };

  const canUndo = mode === 'edit' && history.past.length > 0;
  const canRedo = mode === 'edit' && history.future.length > 0;
  const documentActions = (
    <>
      <div className="ub-authoring__group" style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={() => setHistory(undo)} disabled={!canUndo}>
          {labels.undo}
        </button>
        <button type="button" className="ub-action" onClick={() => setHistory(redo)} disabled={!canRedo}>
          {labels.redo}
        </button>
      </div>
      <div className="ub-authoring__group" style={GROUP_STYLE}>
        {onSave && (
          <button type="button" className="ub-action ub-action--primary" onClick={handleSave}>
            {labels.save}
          </button>
        )}
        <button type="button" className="ub-action" onClick={handleExport}>
          {labels.export}
        </button>
      </div>
    </>
  );

  return (
    <ElementHost origins={elementOrigins} frames={elementFrames}>
      <div className="ub-authoring" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {picture.kind === 'canvas' ? (
          <CanvasAuthoring
            doc={picture}
            updateDoc={update =>
              setHistory(h => {
                const before = pictureOf(h.present) as CanvasView;
                return recordEdit(h, withPictureLayout(h.present, before, update(before)), null);
              })
            }
            mode={mode}
            onModeChange={setMode}
            documentActions={documentActions}
            fileError={fileError}
            onFileError={setFileError}
            adapters={adapters}
            width={width}
            height={height}
            labels={labels}
            clock={clock}
            triggerHosting={{ boardId, onTrigger, onNavigate, linkOrigins }}
            layoutOnly={{ movable }}
          />
        ) : (
          <ViewerPage
            document={picture}
            adapters={adapters}
            width={width}
            height={height}
            labels={labels}
            clock={clock}
            boardId={boardId}
            onTrigger={onTrigger}
            onNavigate={onNavigate}
            linkOrigins={linkOrigins}
            elementOrigins={elementOrigins}
            elementFrames={elementFrames}
          />
        )}
      </div>
    </ElementHost>
  );
}
