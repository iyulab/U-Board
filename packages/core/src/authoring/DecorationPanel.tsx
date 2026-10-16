import type { ReactNode } from 'react';
import { PLACEMENTS, STROKE_DASHES, type Placement, type RectShape, type Shape, type StrokeDash, type TextShape } from '../view-document.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { FIELD_STYLE } from './BindingEditor.js';

export interface DecorationPanelProps {
  decoration: Shape;
  onChange: (decoration: Shape) => void;
  labels?: UBoardLabels;
}

/**
 * The property panel for a selected decoration — deliberately separate from `PropertyPanel`
 * (which is built around a `Node`'s widget/bindings, neither of which a decoration has). A
 * decoration's position/size is already editable via the designer's own drag/resize handles
 * (`scene-mapping.ts`), so this panel exposes what dragging can't: a frame's name and where it sits,
 * its corners and line style; a text's words, which point of it its position is, and its background.
 */
export function DecorationPanel({ decoration, onChange, labels = DEFAULT_LABELS }: DecorationPanelProps) {
  // A part left empty goes: the decoration takes the default, and the document keeps only what was set.
  const set = <S extends Shape, K extends keyof S>(shape: S, key: K, value: S[K] | undefined) => {
    const { [key]: _gone, ...rest } = shape;
    onChange((value === undefined ? rest : { ...rest, [key]: value }) as unknown as Shape);
  };
  const placeLabel: Record<Placement, string> = {
    'top-start': labels.placeTopStart, top: labels.placeTop, 'top-end': labels.placeTopEnd,
    start: labels.placeStart, center: labels.placeCenter, end: labels.placeEnd,
    'bottom-start': labels.placeBottomStart, bottom: labels.placeBottom, 'bottom-end': labels.placeBottomEnd,
  };
  const dashLabel: Record<StrokeDash, string> = { solid: labels.dashSolid, dashed: labels.dashDashed, dotted: labels.dashDotted };
  const placements = (value: Placement | undefined, write: (value: Placement | undefined) => void) => (
    <select value={value ?? 'top-start'} onChange={e => write(e.target.value === 'top-start' ? undefined : (e.target.value as Placement))}>
      {PLACEMENTS.map(place => (
        <option key={place} value={place}>
          {placeLabel[place]}
        </option>
      ))}
    </select>
  );

  return (
    <div className="ub-panel ub-panel--decoration">
      <h2 className="ub-panel__heading">{labels.decorationHeading}</h2>
      {decoration.type === 'text' ? <TextFields text={decoration} set={set} placements={placements} labels={labels} /> : <RectFields rect={decoration} set={set} placements={placements} dashLabel={dashLabel} labels={labels} />}
    </div>
  );
}

type Setter = <S extends Shape, K extends keyof S>(shape: S, key: K, value: S[K] | undefined) => void;
type Placements = (value: Placement | undefined, write: (value: Placement | undefined) => void) => ReactNode;

function TextFields({ text, set, placements, labels }: { text: TextShape; set: Setter; placements: Placements; labels: UBoardLabels }) {
  return (
    <>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationText}
        <input value={text.text} onChange={e => set(text, 'text', e.target.value)} />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationAnchor}
        {placements(text.anchor, value => set(text, 'anchor', value))}
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationBackground}
        <input
          key={`${text.id}=${text.background ?? ''}`}
          defaultValue={text.background ?? ''}
          placeholder="#ffffff"
          onBlur={e => {
            const typed = e.currentTarget.value.trim();
            if (typed !== (text.background ?? '')) set(text, 'background', typed === '' ? undefined : typed);
          }}
        />
      </label>
    </>
  );
}

function RectFields({ rect, set, placements, dashLabel, labels }: { rect: RectShape; set: Setter; placements: Placements; dashLabel: Record<StrokeDash, string>; labels: UBoardLabels }) {
  return (
    <>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationLabel}
        <input
          key={`${rect.id}=${rect.label ?? ''}`}
          defaultValue={rect.label ?? ''}
          onBlur={e => {
            const typed = e.currentTarget.value;
            if (typed !== (rect.label ?? '')) set(rect, 'label', typed.trim() === '' ? undefined : typed);
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationLabelAt}
        {placements(rect.labelAt, value => set(rect, 'labelAt', value))}
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationLabelFill}
        <input
          key={`${rect.id}=${rect.labelFill ?? ''}`}
          defaultValue={rect.labelFill ?? ''}
          placeholder={rect.stroke ?? ''}
          onBlur={e => {
            const typed = e.currentTarget.value.trim();
            if (typed !== (rect.labelFill ?? '')) set(rect, 'labelFill', typed === '' ? undefined : typed);
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationRadius}
        <input
          type="number"
          min="0"
          step="1"
          placeholder="0"
          key={`${rect.id}=${rect.radius ?? ''}`}
          defaultValue={rect.radius ?? ''}
          onBlur={e => {
            const typed = e.currentTarget.value.trim();
            const radius = typed === '' || !Number.isFinite(Number(typed)) ? undefined : Math.max(0, Number(typed));
            set(rect, 'radius', radius === 0 ? undefined : radius);
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.decorationDash}
        <select value={rect.dash ?? 'solid'} onChange={e => set(rect, 'dash', e.target.value === 'solid' ? undefined : (e.target.value as StrokeDash))}>
          {STROKE_DASHES.map(dash => (
            <option key={dash} value={dash}>
              {dashLabel[dash]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
