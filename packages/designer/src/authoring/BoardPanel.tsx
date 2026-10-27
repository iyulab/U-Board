import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import type { BoardAppearance, ReferencePoint } from '@iyulab/u-board/picture';
import { ReferencePointsFields } from './AnchorFields.js';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import { TriggersEditor, type TriggerEditing } from './TriggersEditor.js';

// The button row is spaced like the property panel's, and apart from the tone picker below it.
const ACTIONS_STYLE = { ...GROUP_STYLE, marginBottom: 'var(--ub-space-3, 12px)' };

export interface BoardPanelProps {
  /** Whether the board has a background image (offers to remove it). */
  hasBackground?: boolean;
  appearance: BoardAppearance;
  /** Where choosing and removing a background goes — a board that has one (a canvas view). Without them the panel
   *  offers no background. */
  onChooseBackground?: () => void;
  onRemoveBackground?: () => void;
  onAppearanceChange: (appearance: BoardAppearance) => void;
  /** The board's accent colour (absent: the theme's), and where a change to it goes. */
  accent?: string;
  onAccentChange?: (accent: string | undefined) => void;
  /** The background image's reference points, and where a change to them goes — offered while there is a
   *  background. */
  referencePoints?: [ReferencePoint, ReferencePoint];
  onReferencePointsChange?: (points: [ReferencePoint, ReferencePoint] | undefined) => void;
  /** Anchored nodes that the points' change left off their coordinates: whether the points are still to be
   *  given again, how many nodes moved, and the two answers. */
  anchors?: { awaitingPoints: boolean; moved: number; onRelocate: () => void; onKeep: () => void };
  /** What to select to edit something — `labels.selectNode` by default. */
  hint?: string;
  /** The board's triggers, to edit those that run when it opens. */
  triggers?: TriggerEditing;
  labels?: DesignerLabels;
}

/**
 * The panel shown while nothing is selected: the board's own settings — its background, its tone and its accent.
 * They describe the whole document rather than an action on it, so they sit where a selection's
 * properties do, as editors conventionally show the document's properties when nothing is selected,
 * and leave the toolbar to adding, saving, the mode and the view.
 */
export function BoardPanel({
  hasBackground = false,
  appearance,
  onChooseBackground,
  onRemoveBackground,
  onAppearanceChange,
  accent,
  onAccentChange,
  referencePoints,
  onReferencePointsChange,
  anchors,
  hint,
  triggers,
  labels = DEFAULT_DESIGNER_LABELS,
}: BoardPanelProps) {
  return (
    <div className="ub-panel ub-panel--board">
      <h2 className="ub-panel__heading">{labels.boardHeading}</h2>
      {onChooseBackground && (
        <div className="ub-panel__actions" style={ACTIONS_STYLE}>
          <button type="button" className="ub-action" onClick={onChooseBackground}>
            {labels.setBackground}
          </button>
          {hasBackground && onRemoveBackground && (
            <button type="button" className="ub-action" onClick={onRemoveBackground}>
              {labels.removeBackground}
            </button>
          )}
        </div>
      )}
      {hasBackground && onReferencePointsChange && (
        <ReferencePointsFields points={referencePoints} onChange={onReferencePointsChange} labels={labels} />
      )}
      {hasBackground && anchors?.awaitingPoints && (
        <p className="ub-panel__hint" role="status">
          {labels.referencePointsNeeded}
        </p>
      )}
      {hasBackground && anchors && !anchors.awaitingPoints && anchors.moved > 0 && (
        <div role="status" className="ub-panel__actions" style={ACTIONS_STYLE}>
          <p className="ub-panel__hint">{labels.anchorsMoved.replace('{count}', String(anchors.moved))}</p>
          <button type="button" className="ub-action" onClick={anchors.onRelocate}>
            {labels.relocateAnchors}
          </button>
          <button type="button" className="ub-action" onClick={anchors.onKeep}>
            {labels.keepAnchors}
          </button>
        </div>
      )}
      <label className="ub-panel__field ub-authoring__appearance">
        {labels.appearance}
        <select value={appearance} onChange={e => onAppearanceChange(e.target.value as BoardAppearance)}>
          <option value="light">{labels.appearanceLight}</option>
          <option value="dark">{labels.appearanceDark}</option>
        </select>
      </label>
      {onAccentChange && (
        <label className="ub-panel__field">
          {labels.accent}
          <input
            key={accent ?? ''}
            defaultValue={accent ?? ''}
            placeholder={labels.accentPlaceholder}
            // Written when left, as the other fields are; cleared, the board takes the theme's again.
            onBlur={e => {
              const typed = e.currentTarget.value.trim();
              if (typed !== (accent ?? '')) onAccentChange(typed === '' ? undefined : typed);
            }}
          />
        </label>
      )}
      {triggers && <TriggersEditor {...triggers} labels={labels} />}
      <p className="ub-panel__hint">{hint ?? labels.selectNode}</p>
    </div>
  );
}
