import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { FIELD_STYLE } from '../ui-style.js';
import { TONES, type Board, type Link, type Tone } from '../board/types.js';
import type { BoardFinding } from '../board/check.js';

export interface LinkPanelProps {
  id: string;
  board: Board;
  /** The link as the panel made it. */
  onChange: (link: Link) => void;
  findings?: readonly BoardFinding[];
  labels?: UBoardLabels;
}

const ROUTES = ['straight', 'orthogonal', 'curved'] as const;

/**
 * The panel of a link of a canvas board: the parts it joins (set by joining them on
 * the canvas), its label, the item it reads and the field whose status it takes — its colour the status's tone, its line
 * the status's emphasis — and, fixed, its tone without a status, its route, arrowhead and dash. A setting left empty
 * goes from the link.
 */
export function LinkPanel({ id, board, onChange, findings = [], labels = DEFAULT_LABELS }: LinkPanelProps) {
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
      <label className="ub-panel__field ub-panel__field--check">
        <input type="checkbox" checked={link.arrow === true} onChange={e => set({ arrow: e.target.checked })} />
        {labels.linkArrow}
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
