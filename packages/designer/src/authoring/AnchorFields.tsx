import { type DesignerLabels } from '../labels.js';
import { useEffect, useRef, useState } from 'react';
import type { ReferencePoint } from '@iyulab/u-board/picture';
import { ERROR_STYLE } from '@iyulab/u-board/toolkit';

const FIELD_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const ROW_STYLE: React.CSSProperties = { display: 'flex', gap: 'var(--ub-space-2, 8px)', alignItems: 'end', flexWrap: 'wrap' };
const NUMBER_STYLE: React.CSSProperties = { width: '6.5em', minWidth: 0 };

/** A number as typed, or `null` when it is not one. */
function parsed(text: string): number | null {
  const value = Number(text);
  return text.trim() !== '' && Number.isFinite(value) ? value : null;
}

/** A coordinate as the field shows it — enough digits for a longitude to a metre, without a float's tail. */
const shown = (value: number) => String(Number(value.toPrecision(10)));

type PointDraft = [string, string, string, string];

const draftOf = (points: readonly ReferencePoint[] | undefined): [PointDraft, PointDraft] =>
  [0, 1].map(i => {
    const point = points?.[i];
    return point ? [shown(point.x), shown(point.y), shown(point.coordinate.x), shown(point.coordinate.y)] : ['', '', '', ''];
  }) as [PointDraft, PointDraft];

/** The two points typed in, when every field is a number and the points are apart on both axes in the image
 *  and in their coordinates — or `null` with why not: `incomplete` or `degenerate`. */
function pointsOf(draft: [PointDraft, PointDraft]): [ReferencePoint, ReferencePoint] | 'incomplete' | 'degenerate' {
  const values = draft.map(row => row.map(parsed));
  if (values.some(row => row.some(v => v === null))) return 'incomplete';
  const [a, b] = values.map(([x, y, cx, cy]) => ({ x: x!, y: y!, coordinate: { x: cx!, y: cy! } }));
  if (a.x === b.x || a.y === b.y || a.coordinate.x === b.coordinate.x || a.coordinate.y === b.coordinate.y) return 'degenerate';
  return [a, b];
}

/**
 * The background image's reference points (`BackgroundImage.referencePoints`): two points of the image, in
 * the board's units, and the coordinate each stands for. Saved once all eight numbers are in and the points
 * are apart on both axes; cleared together.
 */
export function ReferencePointsFields({
  points,
  onChange,
  labels,
}: {
  points: readonly ReferencePoint[] | undefined;
  onChange: (points: [ReferencePoint, ReferencePoint] | undefined) => void;
  labels: DesignerLabels;
}) {
  const [draft, setDraft] = useState(() => draftOf(points));
  // The points this form last saved. When they come back as `points`, the fields already say them, as the
  // author typed them — rewriting them in normal form would turn "35.0" into "35" mid-keystroke. Points
  // from elsewhere (another background, an undo) replace the fields.
  const saved = useRef(points);
  useEffect(() => {
    if (points === saved.current) return;
    saved.current = points;
    setDraft(draftOf(points));
  }, [points]);
  const result = pointsOf(draft);
  const blank = draft.every(row => row.every(field => field.trim() === ''));

  const set = (i: number, j: number, text: string) => {
    const next = draft.map((row, r) => (r === i ? row.map((field, f) => (f === j ? text : field)) : row)) as [PointDraft, PointDraft];
    setDraft(next);
    const changed = pointsOf(next);
    if (typeof changed !== 'string') {
      saved.current = changed;
      onChange(changed);
    }
  };
  const clear = () => {
    saved.current = undefined;
    setDraft(draftOf(undefined));
    onChange(undefined);
  };
  const names = [labels.imageX, labels.imageY, labels.coordinateX, labels.coordinateY];

  return (
    <fieldset className="ub-panel__value-map" style={{ minWidth: 0 }}>
      <legend>{labels.referencePoints}</legend>
      <p className="ub-panel__hint">{labels.referencePointsHint}</p>
      {draft.map((row, i) => (
        <div key={i} className="ub-panel__map-row" style={ROW_STYLE} role="group" aria-label={labels.referencePoint.replace('{n}', String(i + 1))}>
          {row.map((field, j) => (
            <label key={j} className="ub-panel__field" style={FIELD_STYLE}>
              {names[j]}
              <input type="number" step="any" style={NUMBER_STYLE} value={field} onChange={e => set(i, j, e.target.value)} />
            </label>
          ))}
        </div>
      ))}
      {result === 'degenerate' && (
        <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
          {labels.referencePointsApart}
        </p>
      )}
      {!blank && result === 'incomplete' && <p className="ub-panel__hint">{labels.referencePointsIncomplete}</p>}
      {points && (
        <button type="button" className="ub-action" onClick={clear}>
          {labels.clearReferencePoints}
        </button>
      )}
    </fieldset>
  );
}
