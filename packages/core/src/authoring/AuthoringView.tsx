import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { serializeViewDocument, parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import { useLabels } from '../use-labels.js';
import { GROUP_STYLE } from '../ui-style.js';
import { CanvasAuthoring } from './CanvasAuthoring.js';
import { GridAuthoring } from './GridAuthoring.js';
import type { AuthoringMode } from './editor-parts.js';
import { ElementHost } from '../renderer/element-view.js';
import { endTyping, recordEdit, redo, startHistory, textEntry, undo, type DocumentHistory } from './document-history.js';

export interface AuthoringViewProps {
  /** The document to edit, of either kind — a canvas view or a grid view. */
  initialDocument: ViewDocument;
  adapters: readonly Adapter[];
  /** Size (CSS px) of the board, in either mode. Omit either and the board takes the width beside
   * the property panel and fills the height — `AuthoringView` then fills its parent, so give the
   * parent a definite height. */
  width?: number;
  height?: number;
  /** Adapter id → human-readable label for the binding editor's connector picker. Falls back to
   * the raw adapter id when a given adapter has no entry (or this prop is omitted entirely). */
  connectorLabels?: Record<string, string>;
  /** What the Save button does. Omitted, Save downloads the document as a local file (Export). */
  onSave?: (doc: ViewDocument) => void | Promise<void>;
  /** Called whenever the editor gains or loses unsaved changes, so the host can show it in its own
   * UI (a status bar, a tab marker). The editor draws no indicator itself; it only asks the
   * browser to confirm leaving the page (`beforeunload`) while changes are unsaved. */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Text to show instead of the English defaults — any subset of `UBoardLabels`. */
  labels?: Partial<UBoardLabels>;
  /** Show the document being edited as JSON below the editor — a development aid, off by default. */
  showDocumentSource?: boolean;
  /** The current time in epoch milliseconds — what "N minutes ago" in the preview and the binding
   * form is measured by. `Date.now` by default; see `ViewerPage`'s `clock`. */
  clock?: () => number;
  /** As `ViewerPage`'s — the origins the board's elements may load from (none by default). */
  elementOrigins?: readonly string[];
  /** As `ViewerPage`'s — where the board's script elements run. A frame serves a definition as last saved, so an
   * element edited since is drawn again once the board is saved. */
  elementFrames?: string;
}

/**
 * The authoring surface: one board, edited or viewed as a shared link shows it, beside a panel for the
 * selected item's widget — its type, static props and bindings — or, with nothing selected, the board's own
 * settings. A canvas view is edited on a canvas (`KonvaDesigner`: add, drag, resize, select); a grid view as its
 * items in order (add, pick, move earlier or later, set the room each takes). Either way each widget is drawn
 * through the path a real viewer uses (`resolveDocument`, then the kind's renderer), and the authoring tool's
 * weight never reaches the viewer (docs/principles.md — editor/renderer separation).
 *
 * What does not depend on the kind lives here: the document and its edits back and forth (Undo, Redo), whether it
 * has unsaved changes, Save, Export, Import, the mode. Importing a document of the other kind opens it in that kind's
 * editor.
 */
export function AuthoringView({ initialDocument, adapters, width, height, connectorLabels, onSave, onDirtyChange, labels: labelsProp, showDocumentSource = false, clock = Date.now, elementOrigins, elementFrames }: AuthoringViewProps) {
  const labels = useLabels(labelsProp);
  // The document with the edits that led to it, since it was opened.
  const [history, setHistory] = useState<DocumentHistory<ViewDocument>>(() => startHistory(initialDocument));
  const doc = history.present;
  // One board, in one of two modes: edited, or viewed exactly as a shared board shows it.
  const [mode, setMode] = useState<AuthoringMode>('edit');
  const [fileError, setFileError] = useState<string | null>(null);
  // Each document opened (the initial one, or an import) gets an editor of its own — its selection, its view
  // and what it was holding belong to the document it was opened with.
  const [opened, setOpened] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Every change replaces the document with a new object, so a reference check against the last-saved one
  // says whether there are unsaved changes. In state, not a ref: saving must re-render for `isDirty`.
  const [lastSavedDoc, setLastSavedDoc] = useState(initialDocument);
  const isDirty = doc !== lastSavedDoc;

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

  const handleSave = async () => {
    setFileError(null);
    if (!onSave) return handleExport();
    try {
      await onSave(doc);
      setLastSavedDoc(doc);
    } catch {
      // `onSave` (the consumer's save action) is responsible for surfacing the failure in its
      // own UI — this view only needs to know not to clear the unsaved-changes guard.
    }
  };

  /** Downloads the document as a file — what Import opens. Without `onSave` it is how the document
   *  is kept; with one it is a copy to carry elsewhere (another installation, a backup), so it does
   *  not count as saving. */
  const handleExport = () => {
    setFileError(null);
    const blob = new Blob([serializeViewDocument(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'view-document.json';
    link.click();
    URL.revokeObjectURL(url);
    if (!onSave) setLastSavedDoc(doc);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    try {
      setHistory(startHistory(parseViewDocument(await file.text())));
      setOpened(n => n + 1);
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof InvalidViewDocumentError ? err.message : labels.importFailed);
    }
  };

  // An edit typed into a field counts with the rest of what is typed there (document-history.ts) — until focus moves:
  // the same field, refilled for another part, is another step. The field is the one whose input the edit answers, not
  // whichever has focus: a button that does not take focus when pressed (Safari) is not typing.
  const typing = useRef<HTMLElement | null>(null);
  const edit = (update: (current: ViewDocument) => ViewDocument) => {
    const typingIn = typing.current;
    setHistory(h => recordEdit(h, update(h.present), typingIn));
  };
  // A view shows the board as it is: the edits are walked back and forth only while editing.
  const canUndo = mode === 'edit' && history.past.length > 0;
  const canRedo = mode === 'edit' && history.future.length > 0;

  // Ctrl+Z (⌘Z) undoes, Ctrl+Shift+Z or Ctrl+Y redoes — but in a field being typed into, the field's own undo. Heard
  // anywhere in the editor (its board, its panels), as is focus moving on.
  const rootRef = useRef<HTMLDivElement>(null);
  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || textEntry(e.target as Element)) return;
    const key = e.key.toLowerCase();
    const back = key === 'z' && !e.shiftKey;
    const forward = (key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey);
    if (!back && !forward) return;
    e.preventDefault();
    if (back && canUndo) setHistory(undo);
    if (forward && canRedo) setHistory(redo);
  });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const keyDown = (e: KeyboardEvent) => handleKey(e);
    const focusMoved = () => setHistory(endTyping);
    // A field's input is caught on its way down, before the editor's handlers answer it, and let go once it has risen
    // past them all (to the window).
    const typed = (e: Event) => {
      typing.current = textEntry(e.target as Element);
    };
    const answered = () => {
      typing.current = null;
    };
    root.addEventListener('keydown', keyDown);
    root.addEventListener('focusin', focusMoved);
    for (const type of ['input', 'change']) {
      root.addEventListener(type, typed, true);
      window.addEventListener(type, answered);
    }
    return () => {
      root.removeEventListener('keydown', keyDown);
      root.removeEventListener('focusin', focusMoved);
      for (const type of ['input', 'change']) {
        root.removeEventListener(type, typed, true);
        window.removeEventListener(type, answered);
      }
    };
  }, []);

  const documentActions = (
    <>
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
        <button type="button" className="ub-action" onClick={() => fileInputRef.current?.click()}>
          {labels.import}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          data-testid="import-file-input"
        />
      </div>
    </>
  );

  const shared = {
    mode,
    onModeChange: setMode,
    documentActions,
    fileError,
    onFileError: setFileError,
    adapters,
    width,
    height,
    connectorLabels,
    labels,
    clock,
  };

  return (
    <ElementHost origins={elementOrigins} frames={elementFrames}>
      <div className="ub-authoring" style={{ display: 'flex', flexDirection: 'column', height: '100%' }} ref={rootRef}>
        {doc.kind === 'canvas' ? (
          <CanvasAuthoring
            key={opened}
            doc={doc}
            updateDoc={update => edit(current => (current.kind === 'canvas' ? update(current) : current))}
            {...shared}
          />
        ) : (
          <GridAuthoring
            key={opened}
            doc={doc}
            updateDoc={update => edit(current => (current.kind === 'grid' ? update(current) : current))}
            {...shared}
          />
        )}
        {showDocumentSource && (
          <details className="ub-authoring__source">
            <summary>{labels.debugDocument}</summary>
            <pre>{JSON.stringify(doc, null, 2)}</pre>
          </details>
        )}
      </div>
    </ElementHost>
  );
}
