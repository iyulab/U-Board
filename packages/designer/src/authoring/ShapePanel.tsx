import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useState } from 'react';
import { ERROR_STYLE } from '@iyulab/u-board/toolkit';
import { TONES, type Board, type Shape, type Tone } from '@iyulab/u-board/toolkit';
import type { BoardFinding } from '../board/check.js';

export interface ShapePanelProps {
  id: string;
  board: Board;
  /** The shape as the panel made it. */
  onChange: (shape: Shape) => void;
  findings?: readonly BoardFinding[];
  labels?: DesignerLabels;
}

/** A line's points as written — `20,20 220,20`: two or more `x,y` by spaces — or `undefined` when they are not. */
export function parsePoints(text: string): [number, number][] | undefined {
  const pairs = text.trim().split(/\s+/).filter(pair => pair !== '');
  if (pairs.length < 2) return undefined;
  const points: [number, number][] = [];
  for (const pair of pairs) {
    const [x, y, ...rest] = pair.split(',').map(Number);
    if (rest.length > 0 || !Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    points.push([x!, y!]);
  }
  return points;
}

/** A line's points, or a path's drawing, as its panel edits them — a line's written only once they read. */
function LineFields({ shape, onChange, labels }: { shape: Shape; onChange: (shape: Shape) => void; labels: DesignerLabels }) {
  const [points, setPoints] = useState(() => (shape.line ?? []).map(([x, y]) => `${x},${y}`).join(' '));
  if (shape.path !== undefined) {
    return (
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.shapePath}
        <textarea rows={3} spellCheck={false} value={shape.path} onChange={e => onChange({ ...shape, path: e.target.value })} />
      </label>
    );
  }
  const read = parsePoints(points);
  return (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {labels.shapePoints}
      <input
        type="text"
        value={points}
        aria-invalid={!read}
        onChange={e => {
          setPoints(e.target.value);
          const next = parsePoints(e.target.value);
          if (next) onChange({ ...shape, line: next });
        }}
      />
      {!read && (
        <span role="alert" style={ERROR_STYLE}>
          {labels.shapePointsInvalid}
        </span>
      )}
    </label>
  );
}

/**
 * The panel of a shape of a canvas board — a frame (a box, with a label at its top),
 * a text, or a line or a path: its words (a line's points, a path's drawing), its tone, and a frame's or a line's line or
 * a text's size. Where it is and how large is set on the canvas. A
 * setting left empty goes from the shape.
 */
export function ShapePanel({ id, board, onChange, findings = [], labels = DEFAULT_DESIGNER_LABELS }: ShapePanelProps) {
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
  const drawn = shape.line !== undefined || shape.path !== undefined;
  return (
    <div className="ub-panel ub-panel--shape">
      <h2 className="ub-panel__heading">{labels.shapeHeading.replace('{id}', id)}</h2>
      {drawn ? (
        <LineFields shape={shape} onChange={onChange} labels={labels} />
      ) : (
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {box ? labels.shapeLabel : labels.shapeText}
        <input
          type="text"
          value={(box ? shape.label : shape.text) ?? ''}
          onChange={e => (box ? set({ label: e.target.value }) : onChange({ ...shape, text: e.target.value }))}
        />
      </label>
      )}
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
      {box || drawn ? (
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
