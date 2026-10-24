import { useEffect, useMemo, useState } from 'react';
import type { Adapter } from '../adapter.js';
import type { UBoardLabels } from '../labels.js';
import { useLabels } from '../use-labels.js';
import { GROUP_STYLE } from '../ui-style.js';
import { placedIn, type CanvasView, type GridView, type ViewDocument } from '../view-document.js';
import { ElementHost } from '../renderer/element-view.js';
import { ViewerPage, type ViewerPageProps } from '../viewer/ViewerPage.js';
import { PictureError, dataReadOf, keyReadsOf, toViewDocument } from '../board-v2/picture.js';
import { readKeys, readerOf } from '../board-v2/draw.js';
import { checkBoardV2 } from '../board-v2/check.js';
import type { BoardV2 } from '../board-v2/types.js';
import { CanvasAuthoring } from './CanvasAuthoring.js';
import { PartPanel } from './PartPanel.js';
import { StatusesPanel } from './StatusesPanel.js';
import { DataPanel } from './DataPanel.js';
import { TriggersEditor } from './TriggersEditor.js';
import { boardTriggerEditing } from './board-triggers.js';
import { GridAuthoring } from './GridAuthoring.js';
import type { AuthoringMode } from './editor-parts.js';
import { layoutEditable, placesItself, withPictureLayout } from './board-layout.js';
import { recordEdit, redo, startHistory, undo, type DocumentHistory } from './document-history.js';

export interface BoardAuthoringProps {
  /** The board to edit, in the language's second version. */
  initialBoard: BoardV2;
  /** Where the board's values are read — also which items a grid laying out a part per item of a list lays out, read
   *  when the board opens and whenever what the board reads them by changes. */
  adapters: readonly Adapter[];
  /** What each adapter's source is called, by adapter id — the names the data panel offers sources by. Omitted, an id. */
  sourceLabels?: Readonly<Record<string, string>>;
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
export function BoardAuthoring({ initialBoard, adapters, sourceLabels, width, height, onSave, onDirtyChange, labels: labelsProp, clock = Date.now, elementOrigins, elementFrames, boardId, onTrigger, onNavigate, linkOrigins, initialMode = 'edit', onModeChange }: BoardAuthoringProps) {
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

  const keys = useItemKeys(board, adapters);
  const keysOf = useMemo(() => (data: string) => [...(keys[data] ?? [])], [keys]);
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
  const sources = useMemo(() => adapters.map(a => ({ id: a.id, ...(sourceLabels?.[a.id] !== undefined ? { label: sourceLabels[a.id] } : {}) })), [adapters, sourceLabels]);
  const read = useMemo(() => readerOf(adapters), [adapters]);
  /** One of the board's data read now, whole, as the board reads it. */
  const look = async (name: string) => {
    const { adapter, ref } = dataReadOf(board, name);
    return (await read(adapter, ref)).value;
  };
  const triggerEditing = boardTriggerEditing(board, targets, update => setHistory(h => recordEdit(h, update(h.present), null)));
  /** The panel of the part a selected node or item draws — a part made per item, or one inside a group, is its part;
   *  with nothing selected, the board's own triggers (those that run when it opens). */
  const panel = (selected: string | null) => {
    if (selected === null) {
      return (
        <>
          <p className="ub-panel__hint">{labels.layoutOnlyHint}</p>
          <DataPanel
            data={board.data}
            sources={sources}
            look={look}
            onChange={data =>
              setHistory(h => {
                const { data: _gone, ...rest } = h.present;
                return recordEdit(h, data ? { ...rest, data } : rest, null);
              })
            }
            labels={labels}
          />
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

  /** A new part, titled and of a kind that reads no data until its panel sets one — placed where a canvas has room at its
   *  top left, or last in a grid. */
  const addPart = () =>
    setHistory(h => {
      const present = h.present;
      let n = Object.keys(present.parts).length + 1;
      while (`part-${n}` in present.parts) n++;
      const id = `part-${n}`;
      const layout = present.layout;
      if (layout.kind === 'canvas') {
        const step = 24 * (n - 1);
        const x = Math.min(40 + step, Math.max(0, layout.size[0] - 160));
        const y = Math.min(40 + step, Math.max(0, layout.size[1] - 60));
        return recordEdit(h, { ...present, parts: { ...present.parts, [id]: { as: 'label', title: labels.newPartTitle } }, layout: { ...layout, place: { ...layout.place, [id]: [x, y, 160, 60] } } }, null);
      }
      return recordEdit(h, { ...present, parts: { ...present.parts, [id]: { as: 'header', title: labels.newPartTitle } }, layout: { ...layout, items: [...layout.items, id] } }, null);
    });

  const canUndo = mode === 'edit' && history.past.length > 0;
  const canRedo = mode === 'edit' && history.future.length > 0;
  const documentActions = (
    <>
      {mode === 'edit' && layoutEditable(board) && (
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={addPart}>
            {labels.partAdd}
          </button>
        </div>
      )}
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

/** The keys of the items each data list a part is made per item of has now, read through `adapters` — again only when
 *  what they are read by changes (an edit elsewhere in the board reads nothing). While a setting leaves the board one
 *  that cannot be drawn, the keys read last stay. */
function useItemKeys(board: BoardV2, adapters: readonly Adapter[]): Record<string, string[]> {
  const [keys, setKeys] = useState<Record<string, string[]>>({});
  const read = useMemo(() => readerOf(adapters), [adapters]);
  const by = useMemo(
    () => (draw(board, () => []).picture === null ? null : JSON.stringify(keyReadsOf(board).map(r => [r, board.data?.[r.data]?.key]))),
    [board]
  );
  // The board the keys are read from: the newest one that draws whose reads differ from the last.
  const [source, setSource] = useState<{ by: string; board: BoardV2 }>({ by: '[]', board });
  if (by !== null && by !== source.by) setSource({ by, board });
  useEffect(() => {
    if (source.by === '[]') return;
    let current = true;
    void readKeys(source.board, read).then(next => current && setKeys(next));
    return () => {
      current = false;
    };
  }, [source, read]);
  return keys;
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
