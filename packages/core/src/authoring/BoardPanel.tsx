import type { BoardAppearance } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { GROUP_STYLE } from '../ui-style.js';

// The button row is spaced like the property panel's, and apart from the tone picker below it.
const ACTIONS_STYLE = { ...GROUP_STYLE, marginBottom: 'var(--ub-space-3, 12px)' };

export interface BoardPanelProps {
  /** Whether the board has a background image (offers to remove it). */
  hasBackground: boolean;
  appearance: BoardAppearance;
  onChooseBackground: () => void;
  onRemoveBackground: () => void;
  onAppearanceChange: (appearance: BoardAppearance) => void;
  labels?: UBoardLabels;
}

/**
 * The panel shown while nothing is selected: the board's own settings — its background and its tone.
 * They describe the whole document rather than an action on it, so they sit where a selection's
 * properties do, as editors conventionally show the document's properties when nothing is selected,
 * and leave the toolbar to adding, saving, the mode and the view.
 */
export function BoardPanel({
  hasBackground,
  appearance,
  onChooseBackground,
  onRemoveBackground,
  onAppearanceChange,
  labels = DEFAULT_LABELS,
}: BoardPanelProps) {
  return (
    <div className="ub-panel ub-panel--board">
      <h2 className="ub-panel__heading">{labels.boardHeading}</h2>
      <div className="ub-panel__actions" style={ACTIONS_STYLE}>
        <button type="button" className="ub-action" onClick={onChooseBackground}>
          {labels.setBackground}
        </button>
        {hasBackground && (
          <button type="button" className="ub-action" onClick={onRemoveBackground}>
            {labels.removeBackground}
          </button>
        )}
      </div>
      <label className="ub-panel__field ub-authoring__appearance">
        {labels.appearance}
        <select value={appearance} onChange={e => onAppearanceChange(e.target.value as BoardAppearance)}>
          <option value="light">{labels.appearanceLight}</option>
          <option value="dark">{labels.appearanceDark}</option>
        </select>
      </label>
      <p className="ub-panel__hint">{labels.selectNode}</p>
    </div>
  );
}
