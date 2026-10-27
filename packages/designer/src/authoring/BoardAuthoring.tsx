import { type DesignerLabels } from '../labels.js';
import { useDesignerLabels } from '../use-labels.js';
import { useEffect, useMemo, useState } from 'react';
import type { Adapter } from '@iyulab/u-board/toolkit';
import { TONES } from '@iyulab/u-board/toolkit';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { placedIn, type ViewDocument } from '@iyulab/u-board/picture';
import { ElementHost } from '@iyulab/u-board/toolkit';
import { ViewerPage, type ViewerPageProps } from '@iyulab/u-board/toolkit';
import { PictureError, dataReadOf, keyReadsOf, keysIn, toViewDocument, type PictureOptions } from '@iyulab/u-board/toolkit';
import { readLists, readerOf } from '@iyulab/u-board/toolkit';
import { checkBoard } from '../board/check.js';
import type { Board } from '@iyulab/u-board/toolkit';
import { CanvasAuthoring } from './CanvasAuthoring.js';
import { PartPanel } from './PartPanel.js';
import { StatusesPanel } from './StatusesPanel.js';
import { DataPanel } from './DataPanel.js';
import { LinkPanel } from './LinkPanel.js';
import { ShapePanel } from './ShapePanel.js';
import { BackgroundField } from './BackgroundField.js';
import { BoardElementsPanel } from './BoardElementsPanel.js';
import { BoardPanel } from './BoardPanel.js';
import { TriggersEditor } from './TriggersEditor.js';
import { boardTriggerEditing } from './board-triggers.js';
import { GridAuthoring } from './GridAuthoring.js';
import type { AuthoringMode } from './editor-parts.js';
import { LINK, cellBoard, cellIndex, gridCellOf, layoutEditable, linkOf, placesItself, shapeOf, withCell, withNewLink, withNewShape, withPictureLayout } from './board-layout.js';
import { recordEdit, redo, startHistory, undo, type DocumentHistory } from './document-history.js';
import { useEditKeys } from './use-edit-keys.js';

export interface BoardAuthoringProps {
  /** The board to edit. */
  initialBoard: Board;
  /** Where the board's values are read — also which items a grid laying out a part per item of a list lays out, read
   *  when the board opens and whenever what the board reads them by changes. */
  adapters: readonly Adapter[];
  /** What each adapter's source is called, by adapter id — the names the data panel offers sources by. Omitted, an id. */
  sourceLabels?: Readonly<Record<string, string>>;
  width?: number;
  height?: number;
  /** What Save does. Omitted, there is no Save — Export downloads the board. */
  onSave?: (board: Board) => void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  labels?: Partial<DesignerLabels>;
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
 * The authoring surface of a board: the board drawn from its picture, where its parts
 * are moved, sized, ordered and deleted — each edit said again in the board's layout (`withPictureLayout`) — and a
 * selected part's title, kind, data and fields set in its panel, with what the board's check finds there. A setting the
 * board cannot be drawn with keeps the last picture it could, and says why. Undo, Redo, Save and Export are the
 * board's. A grid's cell — a canvas, or a grid of its own — opens in its own editor, what changes there written back.
 */
export function BoardAuthoring({ initialBoard, adapters, sourceLabels, width, height, onSave, onDirtyChange, labels: labelsProp, clock = Date.now, elementOrigins, elementFrames, boardId, onTrigger, onNavigate, linkOrigins, initialMode = 'edit', onModeChange }: BoardAuthoringProps) {
  const labels = useDesignerLabels(labelsProp);
  const [history, setHistory] = useState<DocumentHistory<Board>>(() => startHistory(initialBoard));
  const board = history.present;
  // A grid's cell open in its own editor — its entry — and the board as that editor sees it: the cell (a canvas, or a
  // grid) as the layout, what it changes written back into the cell.
  const [cell, setCell] = useState<number | undefined>(undefined);
  const inCell = cell !== undefined && cellBoard(board, cell) !== undefined ? cell : undefined;
  const scope = (b: Board) => (inCell !== undefined ? (cellBoard(b, inCell) ?? b) : b);
  const unscope = (b: Board, scoped: Board) => (inCell !== undefined ? withCell(b, inCell, scoped) : scoped);
  const scoped = scope(board);
  /** Where the layout the canvas editor edits sits in the board — for the findings about it. */
  const layoutAt = inCell !== undefined ? `/layout/items/${inCell}/${scoped.layout.kind}` : '/layout';
  const [lastSaved, setLastSaved] = useState(initialBoard);
  const isDirty = board !== lastSaved;
  const [mode, setModeState] = useState<AuthoringMode>(initialMode);
  const setMode = (next: AuthoringMode) => {
    setModeState(next);
    onModeChange?.(next);
  };
  // A view shows the board as it is: the edits are walked back and forth only while editing — by the buttons, or the
  // keys heard anywhere in the editor.
  const canUndo = mode === 'edit' && history.past.length > 0;
  const canRedo = mode === 'edit' && history.future.length > 0;
  const { rootRef, typing } = useEditKeys(setHistory, canUndo, canRedo);
  /** An edit — one with what was typed in the same field before it while it answers typing there (document-history.ts),
   *  until focus moves on. Which field is read when the edit is made, before its update runs. */
  const setEdit = (update: (h: DocumentHistory<Board>, typingIn: HTMLElement | null) => DocumentHistory<Board>) => {
    const typingIn = typing.current;
    setHistory(h => update(h, typingIn));
  };

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

  const items = useItemLists(board, adapters);
  const drawOptions = useMemo<PictureOptions>(
    () => ({ keysOf: data => keysIn(items.board, data, items.lists[data] ?? []), rowsOf: data => items.lists[data] ?? [] }),
    [items]
  );
  // What is drawn: the board, or — while a setting leaves it one that cannot be drawn — the newest board before it that
  // could be, with why the board is not.
  const pictureOf = (h: DocumentHistory<Board>) => drawnOf(h, drawOptions);
  const drawing = useMemo(() => drawnOf(history, drawOptions), [history, drawOptions]);
  const picture = drawing.picture;
  /** What the editor shows: the board, or the cell open — drawn as a board of its own. */
  const shown: ViewDocument | null = inCell !== undefined ? drawCell(scoped, drawOptions) : picture;
  /** What was drawn before an edit, as the editor shows it. */
  const shownOf = (h: DocumentHistory<Board>) => (inCell !== undefined ? drawCell(scope(h.present), drawOptions) : pictureOf(h).picture);
  const movable = (id: string) => placesItself(scoped, id);
  const ownPiece = (id: string) => linkOf(scoped, id) !== undefined || shapeOf(scoped, id) !== undefined;
  const findings = useMemo(() => {
    const check = checkBoard(board);
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
  /** The board's own settings (`board` — its title, theme, accent and look) changed — one left empty goes, and so does
   *  `board` when nothing is left in it. */
  const setBoardHead = (change: Partial<NonNullable<Board['board']>>) =>
    setEdit((h, typingIn) => {
      const { board: head, ...rest } = h.present;
      const next: Record<string, unknown> = { ...head, ...change };
      for (const [key, value] of Object.entries(change)) if (value === undefined) delete next[key];
      return recordEdit(h, Object.keys(next).length > 0 ? { ...rest, board: next as NonNullable<Board['board']> } : rest, typingIn);
    });
  /** One of the board's data read now, whole, as the board reads it. */
  const look = async (name: string) => {
    const { adapter, ref } = dataReadOf(board, name);
    return (await read(adapter, ref)).value;
  };
  const triggerEditing = boardTriggerEditing(board, targets, update => setEdit((h, typingIn) => recordEdit(h, update(h.present), typingIn)));
  /** The panel of the part a selected node or item draws — a part made per item, or one inside a group, is its part;
   *  with nothing selected, the board's own triggers (those that run when it opens). */
  const panel = (selected: string | null) => {
    if (selected === null) {
      return (
        <>
          <BoardPanel
            appearance={board.board?.theme ?? 'light'}
            onAppearanceChange={theme => setBoardHead({ theme })}
            accent={board.board?.accent}
            onAccentChange={accent => setBoardHead({ accent })}
            hint={labels.layoutOnlyHint}
            labels={labels}
          />
          {scoped.layout.kind === 'canvas' && (
            <BackgroundField
              layout={scoped.layout}
              onChange={layout => setEdit((h, typingIn) => recordEdit(h, unscope(h.present, { ...scope(h.present), layout }), typingIn))}
              labels={labels}
            />
          )}
          <DataPanel
            data={board.data}
            sources={sources}
            look={look}
            statuses={[...new Set([...Object.keys(board.statuses ?? {}), ...TONES])]}
            onChange={data =>
              setEdit((h, typingIn) => {
                const { data: _gone, ...rest } = h.present;
                return recordEdit(h, data ? { ...rest, data } : rest, typingIn);
              })
            }
            labels={labels}
          />
          <StatusesPanel
            statuses={board.statuses}
            onChange={statuses =>
              setEdit((h, typingIn) => {
                const { statuses: _gone, ...rest } = h.present;
                return recordEdit(h, statuses ? { ...rest, statuses } : rest, typingIn);
              })
            }
            labels={labels}
          />
          <TriggersEditor {...triggerEditing} labels={labels} />
          <BoardElementsPanel
            board={board}
            onChange={elements =>
              setEdit((h, typingIn) => {
                const { elements: _gone, ...rest } = h.present;
                return recordEdit(h, elements ? { ...rest, elements } : rest, typingIn);
              })
            }
            labels={labels}
          />
        </>
      );
    }
    const shape = shapeOf(scoped, selected);
    if (shape !== undefined) {
      return (
        <ShapePanel
          key={shape}
          id={shape}
          board={scoped}
          onChange={next =>
            setEdit((h, typingIn) => {
              const own = scope(h.present);
              if (own.layout.kind !== 'canvas') return h;
              return recordEdit(h, unscope(h.present, { ...own, layout: { ...own.layout, shapes: { ...own.layout.shapes, [shape]: next } } }), typingIn);
            })
          }
          findings={findings.filter(f => f.path === `${layoutAt}/shapes/${shape}` || f.path.startsWith(`${layoutAt}/shapes/${shape}/`))}
          labels={labels}
        />
      );
    }
    const link = linkOf(scoped, selected);
    if (link !== undefined) {
      return (
        <LinkPanel
          key={link}
          id={link}
          board={scoped}
          onChange={next =>
            setEdit((h, typingIn) => {
              const own = scope(h.present);
              if (own.layout.kind !== 'canvas') return h;
              return recordEdit(h, unscope(h.present, { ...own, layout: { ...own.layout, links: { ...own.layout.links, [link]: next } } }), typingIn);
            })
          }
          findings={findings.filter(f => f.path === `${layoutAt}/links/${link}` || f.path.startsWith(`${layoutAt}/links/${link}/`))}
          labels={labels}
        />
      );
    }
    // An item drawn from a grid in a cell is laid out in that grid: it opens from here.
    const gridCell = inCell === undefined ? gridCellOf(board, selected) : undefined;
    const openGrid = gridCell === undefined ? null : (
      <button type="button" className="ub-action ub-action--primary" onClick={() => setCell(gridCell)}>
        {labels.editGridCell}
      </button>
    );
    const id = selected.split('/')[0];
    if (id === undefined || !(id in board.parts)) return openGrid;
    return (
      <>
      {openGrid}
      <PartPanel
        key={id}
        id={id}
        board={board}
        onChange={part => setEdit((h, typingIn) => recordEdit(h, { ...h.present, parts: { ...h.present.parts, [id]: part } }, typingIn))}
        findings={findings.filter(f => f.path === `/parts/${id}` || f.path.startsWith(`/parts/${id}/`))}
        triggers={targets.includes(selected) ? <TriggersEditor key={`triggers:${selected}`} node={selected} {...triggerEditing} labels={labels} /> : undefined}
        labels={labels}
      />
      </>
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

  /** A new part, titled and of a kind that reads no data until its panel sets one — placed where a canvas (or the canvas
   *  cell open) has room at its top left, or last in a grid. */
  const addPart = () =>
    setEdit((h, typingIn) => {
      const present = h.present;
      let n = Object.keys(present.parts).length + 1;
      while (`part-${n}` in present.parts) n++;
      const id = `part-${n}`;
      const own = scope(present);
      if (own.layout.kind === 'canvas') {
        const layout = own.layout;
        const step = 24 * (n - 1);
        const x = Math.min(40 + step, Math.max(0, layout.size[0] - 160));
        const y = Math.min(40 + step, Math.max(0, layout.size[1] - 60));
        return recordEdit(h, unscope(present, { ...own, parts: { ...own.parts, [id]: { as: 'label', title: labels.newPartTitle } }, layout: { ...layout, place: { ...layout.place, [id]: [x, y, 160, 60] } } }), typingIn);
      }
      const layout = present.layout;
      if (layout.kind !== 'grid') return h;
      return recordEdit(h, { ...present, parts: { ...present.parts, [id]: { as: 'header', title: labels.newPartTitle } }, layout: { ...layout, items: [...layout.items, id] } }, typingIn);
    });

  /** A frame or a text on a canvas board, at its top left. */
  const addShape = (kind: 'box' | 'text' | 'line') => setEdit((h, typingIn) => recordEdit(h, unscope(h.present, withNewShape(scope(h.present), kind, labels.shapeNewText).board), typingIn));

  const documentActions = (
    <>
      {inCell !== undefined && (
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={() => setCell(undefined)}>
            {labels.backToGrid}
          </button>
        </div>
      )}
      {mode === 'edit' && layoutEditable(board) && (
        <div className="ub-authoring__group" style={GROUP_STYLE}>
          <button type="button" className="ub-action" onClick={addPart}>
            {labels.partAdd}
          </button>
          {scoped.layout.kind === 'canvas' && (
            <>
              <button type="button" className="ub-action" onClick={() => addShape('box')}>
                {labels.shapeAddBox}
              </button>
              <button type="button" className="ub-action" onClick={() => addShape('text')}>
                {labels.shapeAddText}
              </button>
              <button type="button" className="ub-action" onClick={() => addShape('line')}>
                {labels.shapeAddLine}
              </button>
            </>
          )}
        </div>
      )}
      <div className="ub-authoring__group" style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={() => setHistory(undo)} disabled={!canUndo} aria-keyshortcuts="Control+Z Meta+Z">
          {labels.undo}
        </button>
        <button type="button" className="ub-action" onClick={() => setHistory(redo)} disabled={!canRedo} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y">
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
      <div className="ub-authoring" style={{ display: 'flex', flexDirection: 'column', height: '100%' }} ref={rootRef}>
        {drawing.error && (
          <p role="alert" className="ub-authoring__error">
            {labels.boardNotDrawn.replace('{reason}', drawing.error)}
          </p>
        )}
        {shown?.kind === 'canvas' && layoutEditable(board) ? (
          <CanvasAuthoring
            key={inCell === undefined ? 'board' : `cell-${inCell}`}
            doc={shown}
            updateDoc={update =>
              setEdit((h, typingIn) => {
                const before = shownOf(h);
                if (before?.kind !== 'canvas') return h;
                return recordEdit(h, unscope(h.present, withPictureLayout(scope(h.present), before, update(before))), typingIn);
              })
            }
            mode={mode}
            onModeChange={setMode}
            documentActions={documentActions}
            adapters={adapters}
            width={width}
            height={height}
            labels={labels}
            clock={clock}
            triggerHosting={{ boardId, onTrigger, onNavigate, linkOrigins }}
            parts={{
              movable,
              panel,
              connect: (from, to) => {
                const made = withNewLink(scoped, from, to);
                setEdit((h, typingIn) => recordEdit(h, unscope(h.present, withNewLink(scope(h.present), from, to).board), typingIn));
                return `${LINK}${made.id}`;
              },
              deletable: ownPiece,
            }}
          />
        ) : shown?.kind === 'grid' && layoutEditable(board) ? (
          <GridAuthoring
            key={inCell === undefined ? 'board' : `cell-${inCell}`}
            doc={shown}
            updateDoc={update =>
              setEdit((h, typingIn) => {
                const before = shownOf(h);
                if (before?.kind !== 'grid') return h;
                return recordEdit(h, unscope(h.present, withPictureLayout(scope(h.present), before, update(before))), typingIn);
              })
            }
            mode={mode}
            onModeChange={setMode}
            documentActions={documentActions}
            adapters={adapters}
            width={width}
            height={height}
            labels={labels}
            clock={clock}
            triggerHosting={{ boardId, onTrigger, onNavigate, linkOrigins }}
            parts={{ movable, panel }}
            onEditCanvas={inCell === undefined ? id => setCell(cellIndex(board, id)) : undefined}
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
function draw(board: Board, options: PictureOptions): { picture: ViewDocument; error: null } | { picture: null; error: string } {
  const issue = checkBoard(board).issues[0];
  if (issue) return { picture: null, error: `${issue.path}: ${issue.message}` };
  try {
    return { picture: toViewDocument(board, options), error: null };
  } catch (error) {
    if (error instanceof PictureError) return { picture: null, error: error.message };
    throw error;
  }
}

/** A grid's cell as `cellBoard` gives it, drawn for its editor: without the board's triggers — they name parts all over
 *  the board, most of them not in the cell — and without the board's check, which would find those parts placed nowhere
 *  in it. Null when it cannot be drawn. */
function drawCell(cell: Board, options: PictureOptions): ViewDocument | null {
  const { triggers: _triggers, ...drawn } = cell;
  try {
    return toViewDocument(drawn, options);
  } catch (error) {
    if (error instanceof PictureError) return null;
    throw error;
  }
}

/** The keys of the items each data list a part is made per item of has now, read through `adapters` — again only when
 *  what they are read by changes (an edit elsewhere in the board reads nothing). While a setting leaves the board one
 *  that cannot be drawn, the keys read last stay. */
function useItemLists(board: Board, adapters: readonly Adapter[]): { board: Board; lists: Record<string, unknown[]> } {
  const [items, setItems] = useState<{ board: Board; lists: Record<string, unknown[]> }>({ board, lists: {} });
  const read = useMemo(() => readerOf(adapters), [adapters]);
  const by = useMemo(
    () => (draw(board, { keysOf: () => [], rowsOf: () => [] }).picture === null ? null : JSON.stringify(keyReadsOf(board).map(r => [r, board.data?.[r.data]?.key]))),
    [board]
  );
  // The board the items are read from: the newest one that draws whose reads differ from the last.
  const [source, setSource] = useState<{ by: string; board: Board }>({ by: '[]', board });
  if (by !== null && by !== source.by) setSource({ by, board });
  useEffect(() => {
    if (source.by === '[]') return;
    let current = true;
    void readLists(source.board, read).then(lists => current && setItems({ board: source.board, lists }));
    return () => {
      current = false;
    };
  }, [source, read]);
  return items;
}

/** What the editor draws for a history: its board, or the newest one before it that draws, and why the board does not. */
function drawnOf(history: DocumentHistory<Board>, options: PictureOptions): { picture: ViewDocument; error: string | null } {
  const now = draw(history.present, options);
  if (now.picture) return now;
  for (const before of [...history.past].reverse()) {
    const drawn = draw(before, options).picture;
    if (drawn) return { picture: drawn, error: now.error };
  }
  return { picture: toViewDocument(history.present, options), error: now.error };
}
