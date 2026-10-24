import type { ReactNode } from 'react';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import { GROUP_STYLE, ERROR_STYLE } from '../ui-style.js';
import type { TriggerHandlers } from '../viewer/use-triggers.js';

export type AuthoringMode = 'edit' | 'view';

/** What `AuthoringView` hands the editor of the document's kind: the document and the one way to change it, the
 *  mode, the toolbar's shared actions, and what the host gave the view. The editor owns everything of its kind —
 *  its board, its selection, its panel and its own toolbar actions. */
export interface KindEditorProps<D extends ViewDocument> {
  doc: D;
  /** Replaces the document with what `update` makes of the current one. */
  updateDoc: (update: (current: D) => D) => void;
  mode: AuthoringMode;
  onModeChange: (mode: AuthoringMode) => void;
  /** Undo and Redo, Save, Export and Import — the same for every kind. */
  documentActions: ReactNode;
  /** A file that could not be used, said under the toolbar; an editor reports its own (a background image) too. */
  fileError: string | null;
  onFileError: (message: string | null) => void;
  adapters: readonly Adapter[];
  width?: number;
  height?: number;
  connectorLabels?: Record<string, string>;
  labels: UBoardLabels;
  clock: () => number;
  /** What the board's triggers hand the host in View — Edit runs none (a click there selects). */
  triggerHosting: TriggerHosting;
  /**
   * Only where the parts are is edited — the document is drawn from another one (a board in the language's second
   * version), which keeps everything else: parts are moved, sized and deleted, nothing is added, and no part's settings
   * are shown — `panel`, when given, draws the panel for what is selected (`null`: nothing, or more than one). `movable`
   * says which parts the other document places itself; `connect`, when given, joins two of them, first to second, and
   * answers the id the connector is drawn with — what may be deleted besides is what the other document draws itself.
   */
  layoutOnly?: { movable: (id: string) => boolean; panel?: (selected: string | null) => ReactNode; connect?: (from: string, to: string) => string; deletable?: (id: string) => boolean };
}

/** The host's side of a board's triggers — `ViewerPage`'s props of the same names. */
export type TriggerHosting = Pick<TriggerHandlers, 'boardId' | 'onTrigger' | 'onNavigate' | 'linkOrigins'>;

/** The Edit / View switch. */
export function ModeSwitch({ mode, onEdit, onView, labels }: { mode: AuthoringMode; onEdit: () => void; onView: () => void; labels: UBoardLabels }) {
  return (
    <div className="ub-authoring__group ub-authoring__mode" style={GROUP_STYLE} role="group" aria-label={labels.mode}>
      <button type="button" className="ub-action" aria-pressed={mode === 'edit'} onClick={onEdit}>
        {labels.editMode}
      </button>
      <button type="button" className="ub-action" aria-pressed={mode === 'view'} onClick={onView}>
        {labels.viewMode}
      </button>
    </div>
  );
}

/** A file the editor could not use — under the toolbar. */
export function FileError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="ub-authoring__error" style={ERROR_STYLE}>
      {message}
    </p>
  ) : null;
}
