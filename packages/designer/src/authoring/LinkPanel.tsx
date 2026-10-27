import { FIELD_STYLE } from './field-style.js';
import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { TONES, type ArrowEnds, type Board, type Link, type Tone } from '@iyulab/u-board/toolkit';
import type { BoardFinding } from '../board/check.js';

export interface LinkPanelProps {
  id: string;
  board: Board;
  /** The link as the panel made it. */
  onChange: (link: Link) => void;
  findings?: readonly BoardFinding[];
  labels?: DesignerLabels;
}

const ROUTES = ['straight', 'orthogonal', 'curved'] as const;

/**
 * The panel of a link of a canvas board: the parts it joins (set by joining them on
 * the canvas), its label, the item it reads and the field whose status it takes — its colour the status's tone, its line
 * the status's emphasis — and, fixed, its tone without a status, its route, arrowheads and dash. A setting left empty
 * goes from the link. Arrowheads read from a field (a direction that reverses) are written in the board's source; the
 * panel names the field and replaces them only when a fixed choice is made.
 */
export function LinkPanel({ id, board, onChange, findings = [], labels = DEFAULT_DESIGNER_LABELS }: LinkPanelProps) {
  const link = (board.layout.kind === 'canvas' ? board.layout.links?.[id] : undefined) ?? { from: '', to: '' };
  const set = (change: Partial<Link>) => {
    const next = { ...link, ...change } as Record<string, unknown>;
    for (const [key, value] of Object.entries(change)) if (value === undefined || value === '' || value === false) delete next[key];
    onChange(next as unknown as Link);
  };
  const text = (label: string, value: string | undefined, change: (value: string) => void) => (
    <label className="ub-panel__field" style={FIELD_STYLE}>
      {label}
      <input type="text" value={value ?? ''} onChange={e => change(e.target.value)} />
    </label>
  );
  return (
    <div className="ub-panel ub-panel--link">
      <h2 className="ub-panel__heading">{labels.linkHeading.replace('{from}', link.from).replace('{to}', link.to)}</h2>
      {text(labels.linkLabel, link.label, label => set({ label }))}
      {text(labels.linkReads, link.of, of => set({ of }))}
      {text(labels.linkShows, link.show, show => set({ show }))}
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.linkTone}
        <select value={link.tone ?? ''} onChange={e => set({ tone: (e.target.value || undefined) as Tone | undefined })}>
          <option value="">{labels.linkToneNone}</option>
          {TONES.map(tone => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.linkRoute}
        <select value={link.route ?? 'straight'} onChange={e => set({ route: e.target.value === 'straight' ? undefined : (e.target.value as Link['route']) })}>
          {ROUTES.map(route => (
            <option key={route} value={route}>
              {route}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.linkArrow}
        <select
          value={typeof link.arrow === 'object' ? 'field' : (link.arrow ?? '')}
          onChange={e => e.target.value !== 'field' && set({ arrow: (e.target.value || undefined) as ArrowEnds | undefined })}
        >
          <option value="">{labels.arrowNone}</option>
          <option value="end">{labels.arrowEnd.replace('{to}', link.to)}</option>
          <option value="start">{labels.arrowStart.replace('{from}', link.from)}</option>
          <option value="both">{labels.arrowBoth}</option>
          {typeof link.arrow === 'object' && <option value="field">{labels.arrowFromField.replace('{field}', link.arrow.field)}</option>}
        </select>
      </label>
      <label className="ub-panel__field ub-panel__field--check">
        <input type="checkbox" checked={link.dash === true} onChange={e => set({ dash: e.target.checked })} />
        {labels.linkDash}
      </label>
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
