import { type DesignerLabels } from '../labels.js';
import type { ReactNode } from 'react';
import type { Adapter } from '@iyulab/u-board/toolkit';
import type { ViewDocument } from '@iyulab/u-board/picture';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import type { TriggerHandlers } from '@iyulab/u-board/toolkit';

export type AuthoringMode = 'edit' | 'view';

/** What `BoardAuthoring` hands the editor of the picture's kind: the picture and the one way to change it, the mode,
 *  the toolbar's shared actions, and what the host gave the view. The editor owns its surface, its selection and its
 *  own toolbar actions. */
export interface KindEditorProps<D extends ViewDocument> {
  doc: D;
  /** Replaces the document with what `update` makes of the current one. */
  updateDoc: (update: (current: D) => D) => void;
  mode: AuthoringMode;
  onModeChange: (mode: AuthoringMode) => void;
  /** Undo and Redo, Save and Export — the same for every kind. */
  documentActions: ReactNode;

  adapters: readonly Adapter[];
  width?: number;
  height?: number;
  labels: DesignerLabels;
  clock: () => number;
  /** What the board's triggers hand the host in View — Edit runs none (a click there selects). */
  triggerHosting: TriggerHosting;
  /**
   * The board the picture is drawn from, which keeps everything but where its parts are: parts are moved, sized and
   * deleted here, and `panel` draws the panel for what is selected (`null`: nothing, or more than one) — or nothing, for
   * a hint. `movable` says which parts the board places itself; `connect`, when given, joins two of them, first to
   * second, and answers the id the connector is drawn with — what may be deleted besides is `deletable`.
   */
  parts: { movable: (id: string) => boolean; panel: (selected: string | null) => ReactNode; connect?: (from: string, to: string) => string; deletable?: (id: string) => boolean };
}

/** The host's side of a board's triggers — `ViewerPage`'s props of the same names. */
export type TriggerHosting = Pick<TriggerHandlers, 'boardId' | 'onTrigger' | 'onNavigate' | 'linkOrigins'>;

/** The Edit / View switch. */
export function ModeSwitch({ mode, onEdit, onView, labels }: { mode: AuthoringMode; onEdit: () => void; onView: () => void; labels: DesignerLabels }) {
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
