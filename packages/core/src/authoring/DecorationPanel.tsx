import type { Shape } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';

export interface DecorationPanelProps {
  decoration: Shape;
  onChange: (decoration: Shape) => void;
  labels?: UBoardLabels;
}

/**
 * The property panel for a selected decoration — deliberately separate from `PropertyPanel`
 * (which is built around a `Node`'s widget/bindings, neither of which a decoration has). A
 * decoration's position/size is already editable via the designer's own drag/resize handles
 * (`scene-mapping.ts`), so this panel only exposes what dragging can't: a text decoration's
 * label. A rect decoration has nothing else to edit yet (docs/concepts.md — "Decoration").
 */
export function DecorationPanel({ decoration, onChange, labels = DEFAULT_LABELS }: DecorationPanelProps) {
  return (
    <div>
      <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>{labels.decorationHeading}</h2>
      {decoration.type === 'text' ? (
        <label>
          {labels.decorationText}
          <input value={decoration.text} onChange={e => onChange({ ...decoration, text: e.target.value })} />
        </label>
      ) : (
        <p style={{ fontSize: 12 }}>{labels.decorationHint}</p>
      )}
    </div>
  );
}
