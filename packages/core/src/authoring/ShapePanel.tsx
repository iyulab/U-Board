import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { FIELD_STYLE } from '../ui-style.js';
import { TONES, type BoardV2, type Shape, type Tone } from '../board-v2/types.js';
import type { BoardFinding } from '../board-v2/check.js';

export interface ShapePanelProps {
  id: string;
  board: BoardV2;
  /** The shape as the panel made it. */
  onChange: (shape: Shape) => void;
  findings?: readonly BoardFinding[];
  labels?: UBoardLabels;
}

/**
 * The panel of a shape of a canvas board in the language's second version — a frame (a box, with a label at its top)
 * or a text: its words, its tone, and a frame's line or a text's size. Where it is and how large is set on the canvas. A
 * setting left empty goes from the shape.
 */
export function ShapePanel({ id, board, onChange, findings = [], labels = DEFAULT_LABELS }: ShapePanelProps) {
  const shape = (board.layout.kind === 'canvas' ? board.layout.shapes?.[id] : undefined) ?? {};
  const set = (change: Partial<Shape>) => {
    const next = { ...shape, ...change } as Record<string, unknown>;
    for (const [key, value] of Object.entries(change)) if (value === undefined || value === '' || value === false) delete next[key];
    onChange(next as Shape);
  };
  const number = (label: string, value: number | undefined, change: (value: number | undefined) => void) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input type="number" min={1} value={value ?? ''} onChange={e => change(e.target.value === '' ? undefined : Number(e.target.value))} />
    </label>
  );
  const box = shape.box !== undefined;
  return (
    <div className="ub-panel ub-panel--shape">
      <h2 className="ub-panel__heading">{labels.shapeHeading.replace('{id}', id)}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {box ? labels.shapeLabel : labels.shapeText}
        <input
          type="text"
          value={(box ? shape.label : shape.text) ?? ''}
          onChange={e => (box ? set({ label: e.target.value }) : onChange({ ...shape, text: e.target.value }))}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.shapeTone}
        <select value={shape.tone ?? ''} onChange={e => set({ tone: (e.target.value || undefined) as Tone | undefined })}>
          <option value="">—</option>
          {TONES.map(tone => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </label>
      {box ? (
        <>
          {number(labels.shapeWidth, shape.width, width => set({ width }))}
          <label className="ub-panel__field ub-panel__field--check">
            <input type="checkbox" checked={shape.dash === true} onChange={e => set({ dash: e.target.checked })} />
            {labels.linkDash}
          </label>
        </>
      ) : (
        number(labels.shapeSize, shape.size, size => set({ size }))
      )}
      {findings.length > 0 && (
        <ul className="ub-panel__findings" role="alert">
          {findings.map(finding => (
            <li key={`${finding.path}:${finding.message}`}>{finding.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
