import type { Shape } from '../view-document.js';

export interface DecorationPanelProps {
  decoration: Shape;
  onChange: (decoration: Shape) => void;
}

/**
 * The property panel for a selected decoration — deliberately separate from `PropertyPanel`
 * (which is built around a `Node`'s widget/bindings, neither of which a decoration has). A
 * decoration's position/size is already editable via the designer's own drag/resize handles
 * (`scene-mapping.ts`), so this panel only exposes what dragging can't: a text decoration's
 * label. A rect decoration has nothing else to edit yet (docs/concepts.md — "Decoration").
 */
export function DecorationPanel({ decoration, onChange }: DecorationPanelProps) {
  return (
    <div>
      <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Decoration</h2>
      {decoration.type === 'text' ? (
        <label>
          라벨
          <input value={decoration.text} onChange={e => onChange({ ...decoration, text: e.target.value })} />
        </label>
      ) : (
        <p style={{ fontSize: 12 }}>캔버스에서 드래그/리사이즈로 위치와 크기를 조정하세요.</p>
      )}
    </div>
  );
}
