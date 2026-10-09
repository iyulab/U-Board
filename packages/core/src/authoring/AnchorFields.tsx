import { useEffect, useState } from 'react';
import { coordinateOf, placeAt } from '../anchor.js';
import type { Background, Node, ReferencePoint } from '../view-document.js';
import type { UBoardLabels } from '../labels.js';
import { ERROR_STYLE } from '../ui-style.js';

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

/**
 * Whether a node is anchored — placed at a place on the background rather than freely (`Node.anchored`) —
 * and, when the background has reference points, the coordinate it is anchored at: typed in, the node moves
 * there (its box's center), and moving the node changes it.
 */
export function NodeAnchorFields({
  node,
  background,
  onChange,
  labels,
}: {
  node: Node;
  background: Background;
  onChange: (change: Partial<Pick<Node, 'x' | 'y' | 'anchored'>>) => void;
  labels: UBoardLabels;
}) {
  const coordinate = node.anchored ? coordinateOf(background, node) : null;
  const atX = coordinate ? shown(coordinate.x) : '';
  const atY = coordinate ? shown(coordinate.y) : '';
  const [x, setX] = useState(atX);
  const [y, setY] = useState(atY);
  // The fields follow the node — dragged, resized, or another node selected — and are typed into between.
  useEffect(() => {
    setX(atX);
    setY(atY);
  }, [atX, atY]);

  const place = () => {
    const cx = parsed(x);
    const cy = parsed(y);
    if (cx === null || cy === null) return;
    const at = placeAt(background, node, { x: cx, y: cy });
    if (at) onChange(at);
  };

  return (
    <>
      <label className="ub-panel__field ub-panel__field--check">
        <input type="checkbox" checked={node.anchored} onChange={e => onChange({ anchored: e.target.checked })} />
        {labels.anchored}
      </label>
      {node.anchored &&
        (coordinate ? (
          <div className="ub-panel__map-row" style={ROW_STYLE}>
            {[
              { label: labels.coordinateX, value: x, set: setX },
              { label: labels.coordinateY, value: y, set: setY },
            ].map(field => (
              <label key={field.label} className="ub-panel__field" style={FIELD_STYLE}>
                {field.label}
                <input
                  type="number"
                  step="any"
                  style={NUMBER_STYLE}
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  onBlur={place}
                  onKeyDown={e => e.key === 'Enter' && place()}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="ub-panel__hint">{labels.anchorNeedsReferencePoints}</p>
        ))}
    </>
  );
}

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
  labels: UBoardLabels;
}) {
  const [draft, setDraft] = useState(() => draftOf(points));
  useEffect(() => setDraft(draftOf(points)), [points]);
  const result = pointsOf(draft);
  const blank = draft.every(row => row.every(field => field.trim() === ''));

  const set = (i: number, j: number, text: string) => {
    const next = draft.map((row, r) => (r === i ? row.map((field, f) => (f === j ? text : field)) : row)) as [PointDraft, PointDraft];
    setDraft(next);
    const changed = pointsOf(next);
    if (typeof changed !== 'string') onChange(changed);
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
      {points && (
        <button type="button" className="ub-action" onClick={() => onChange(undefined)}>
          {labels.clearReferencePoints}
        </button>
      )}
      {!points && !blank && result === 'incomplete' && <p className="ub-panel__hint">{labels.referencePointsIncomplete}</p>}
    </fieldset>
  );
}
