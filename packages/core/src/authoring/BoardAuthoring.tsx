import { useEffect, useMemo, useState } from 'react';
import type { Adapter } from '../adapter.js';
import type { UBoardLabels } from '../labels.js';
import { useLabels } from '../use-labels.js';
import { GROUP_STYLE } from '../ui-style.js';
import { placedIn, type CanvasView, type GridView, type ViewDocument } from '../view-document.js';
import { ElementHost } from '../renderer/element-view.js';
import { ViewerPage, type ViewerPageProps } from '../viewer/ViewerPage.js';
import { PictureError, toViewDocument } from '../board-v2/picture.js';
import { checkBoardV2 } from '../board-v2/check.js';
import type { BoardV2 } from '../board-v2/types.js';
import { CanvasAuthoring } from './CanvasAuthoring.js';
import { PartPanel } from './PartPanel.js';
import { StatusesPanel } from './StatusesPanel.js';
import { TriggersEditor } from './TriggersEditor.js';
import { boardTriggerEditing } from './board-triggers.js';
import { GridAuthoring } from './GridAuthoring.js';
import type { AuthoringMode } from './editor-parts.js';
import { layoutEditable, placesItself, withPictureLayout } from './board-layout.js';
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
 * are moved, sized, ordered and deleted — each edit said again in the board's layout (`withPictureLayout`) — and a
 * selected part's title, kind, data and fields set in its panel, with what the board's check finds there. A setting the
 * board cannot be drawn with keeps the last picture it could, and says why. Undo, Redo, Save and Export are the
 * board's. A grid holding grids or canvases of its own (`layoutEditable`) is shown as its viewers see it.
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
  // What is drawn: the board, or — while a setting leaves it one that cannot be drawn — the newest board before it that
  // could be, with why the board is not.
  const pictureOf = (h: DocumentHistory<BoardV2>) => drawnOf(h, keysOf);
  const drawing = useMemo(() => drawnOf(history, keysOf), [history, keysOf]);
  const picture = drawing.picture;
  const movable = useMemo(() => (id: string) => placesItself(board, id), [board]);
  const findings = useMemo(() => {
    const check = checkBoardV2(board);
    return [...check.issues, ...check.advice];
  }, [board]);
  // What a trigger may name: a part — one made per item, by item — as the board is drawn now.
  const targets = useMemo(
    () => placedIn(picture).map(placed => placed.id.slice(placed.id.lastIndexOf(':') + 1)).filter(id => {
      const [part, key, ...rest] = id.split('/');
      const each = board.parts[part!]?.each !== undefined;
      return rest.length === 0 && (key === undefined ? !each && part! in board.parts : each);
    }),
    [picture, board]
  );
  const triggerEditing = boardTriggerEditing(board, targets, update => setHistory(h => recordEdit(h, update(h.present), null)));
  /** The panel of the part a selected node or item draws — a part made per item, or one inside a group, is its part;
   *  with nothing selected, the board's own triggers (those that run when it opens). */
  const panel = (selected: string | null) => {
    if (selected === null) {
      return (
        <>
          <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>
          <StatusesPanel
            statuses={board.statuses}
            onChange={statuses =>
              setHistory(h => {
                const { statuses: _gone, ...rest } = h.present;
                return recordEdit(h, statuses ? { ...rest, statuses } : rest, null);
              })
            }
            labels={labels}
          />
          <TriggersEditor {...triggerEditing} labels={labels} />
        </>
      );
    }
    const id = selected.split('/')[0];
    if (id === undefined || !(id in board.parts)) return null;
    return (
      <PartPanel
        key={id}
        id={id}
        board={board}
        onChange={part => setHistory(h => recordEdit(h, { ...h.present, parts: { ...h.present.parts, [id]: part } }, null))}
        findings={findings.filter(f => f.path === `/parts/${id}` || f.path.startsWith(`/parts/${id}/`))}
        triggers={targets.includes(selected) ? <TriggersEditor key={`triggers:${selected}`} node={selected} {...triggerEditing} labels={labels} /> : undefined}
        labels={labels}
      />
    );
  };

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
        {drawing.error && (
          <p role="alert" className="ub-authoring__error">
            {labels.boardNotDrawn.replace('{reason}', drawing.error)}
          </p>
        )}
        {picture.kind === 'canvas' && layoutEditable(board) ? (
          <CanvasAuthoring
            doc={picture}
            updateDoc={update =>
              setHistory(h => {
                const before = pictureOf(h).picture as CanvasView;
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
            layoutOnly={{ movable, panel }}
          />
        ) : picture.kind === 'grid' && layoutEditable(board) ? (
          <GridAuthoring
            doc={picture}
            updateDoc={update =>
              setHistory(h => {
                const before = pictureOf(h).picture as GridView;
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
            layoutOnly={{ movable, panel }}
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

/** A board drawn — when its language takes it and it draws — or why not. */
function draw(board: BoardV2, keysOf: (data: string) => string[]): { picture: ViewDocument; error: null } | { picture: null; error: string } {
  const issue = checkBoardV2(board).issues[0];
  if (issue) return { picture: null, error: `${issue.path}: ${issue.message}` };
  try {
    return { picture: toViewDocument(board, { keysOf }), error: null };
  } catch (error) {
    if (error instanceof PictureError) return { picture: null, error: error.message };
    throw error;
  }
}

/** What the editor draws for a history: its board, or the newest one before it that draws, and why the board does not. */
function drawnOf(history: DocumentHistory<BoardV2>, keysOf: (data: string) => string[]): { picture: ViewDocument; error: string | null } {
  const now = draw(history.present, keysOf);
  if (now.picture) return now;
  for (const before of [...history.past].reverse()) {
    const drawn = draw(before, keysOf).picture;
    if (drawn) return { picture: drawn, error: now.error };
  }
  return { picture: toViewDocument(history.present, { keysOf }), error: now.error };
}
