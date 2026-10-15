import type { Adapter } from '../adapter.js';
import { CONNECTOR_ARROWS, CONNECTOR_BINDABLE, CONNECTOR_DASHES, type Connector, type ConnectorArrow, type ConnectorDash, type ConnectorStyle, type Node } from '../view-document.js';
import { BindingEditor, FIELD_STYLE, type BindingField } from './BindingEditor.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { GROUP_STYLE } from '../ui-style.js';
import { widgetTypeName } from './widget-catalog.js';

export interface ConnectorPanelProps {
  connector: Connector;
  /** The board's nodes — what the connector's ends are named by. */
  nodes: readonly Node[];
  onChange: (connector: Connector) => void;
  onDelete: () => void;
  adapters: readonly Adapter[];
  /** Adapter id → human-readable label. Falls back to the raw id when absent. */
  connectorLabels?: Record<string, string>;
  labels?: UBoardLabels;
  clock?: () => number;
}

/**
 * The property panel for a selected connector — the line between two nodes: which way it runs, its label and where
 * the label sits, how it is drawn (colour, width, dash, arrowheads), and the bindings that fill any of those from live
 * values. Where it runs is its two nodes' business: it follows them as they move.
 */
export function ConnectorPanel({ connector, nodes, onChange, onDelete, adapters, connectorLabels, labels = DEFAULT_LABELS, clock }: ConnectorPanelProps) {
  // A node is named by its caption, else as the editor tags it — its widget's type — with its place among the nodes.
  const name = (id: string) => {
    const at = nodes.findIndex(n => n.id === id);
    if (at === -1) return id;
    return nodes[at].caption || `${widgetTypeName(nodes[at].widget.type, labels.locale)} ${at + 1}`;
  };
  const ends = (text: string) => text.replace('{from}', name(connector.fromNodeId)).replace('{to}', name(connector.toNodeId));

  // A part left empty goes: the line takes the board's look for it, and the document keeps only what was set.
  const set = <K extends 'label' | 'labelAt'>(key: K, value: Connector[K] | undefined) => {
    const { [key]: _gone, ...rest } = connector;
    onChange((value === undefined ? rest : { ...rest, [key]: value }) as Connector);
  };
  const setStyle = <K extends keyof ConnectorStyle>(key: K, value: ConnectorStyle[K] | undefined) => {
    const { [key]: _gone, ...style } = connector.style ?? {};
    const next: ConnectorStyle = value === undefined ? style : { ...style, [key]: value };
    const { style: _style, ...rest } = connector;
    onChange(Object.keys(next).length > 0 ? { ...rest, style: next } : rest);
  };
  // Fields are written when left, as a widget's are (`WidgetPropsForm`); cleared, the part goes.
  const number = (typed: string) => (typed.trim() === '' || !Number.isFinite(Number(typed)) ? undefined : Number(typed));
  const text = (typed: string, current: string | undefined, write: (value: string | undefined) => void) => {
    if (typed !== (current ?? '')) write(typed === '' ? undefined : typed);
  };

  const fieldLabel: Record<(typeof CONNECTOR_BINDABLE)[number], string> = {
    label: labels.connectorLabel,
    'style.stroke': labels.connectorStroke,
    'style.strokeWidth': labels.connectorStrokeWidth,
    'style.dash': labels.connectorDash,
    'style.arrow': labels.connectorArrow,
  };
  const fields: BindingField[] = CONNECTOR_BINDABLE.map(path => ({ path, label: fieldLabel[path] }));
  const dashLabel: Record<ConnectorDash, string> = { solid: labels.dashSolid, dashed: labels.dashDashed, dotted: labels.dashDotted };
  const arrowLabel: Record<ConnectorArrow, string> = { none: labels.arrowNone, end: ends(labels.arrowEnd), start: ends(labels.arrowStart), both: labels.arrowBoth };

  return (
    <div className="ub-panel ub-panel--connector">
      <h2 className="ub-panel__heading">{labels.connectorHeading}</h2>
      <p className="ub-panel__hint" style={GROUP_STYLE}>
        <span>{ends(labels.connectorEnds)}</span>
        <button type="button" className="ub-action" onClick={() => onChange({ ...connector, fromNodeId: connector.toNodeId, toNodeId: connector.fromNodeId })}>
          {labels.reverseConnector}
        </button>
      </p>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.connectorLabel}
        <input key={`${connector.id}=${connector.label ?? ''}`} defaultValue={connector.label ?? ''} onBlur={e => text(e.currentTarget.value, connector.label, value => set('label', value))} />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {ends(labels.connectorLabelAt)}
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          placeholder="0.5"
          key={`${connector.id}=${connector.labelAt ?? ''}`}
          defaultValue={connector.labelAt ?? ''}
          onBlur={e => {
            const at = number(e.currentTarget.value);
            set('labelAt', at === undefined ? undefined : Math.min(1, Math.max(0, at)));
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.connectorStroke}
        <input
          key={`${connector.id}=${connector.style?.stroke ?? ''}`}
          defaultValue={connector.style?.stroke ?? ''}
          placeholder="#94a3b8"
          onBlur={e => text(e.currentTarget.value.trim(), connector.style?.stroke, value => setStyle('stroke', value))}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.connectorStrokeWidth}
        <input
          type="number"
          min="0.5"
          step="0.5"
          placeholder="2"
          key={`${connector.id}=${connector.style?.strokeWidth ?? ''}`}
          defaultValue={connector.style?.strokeWidth ?? ''}
          onBlur={e => {
            const width = number(e.currentTarget.value);
            setStyle('strokeWidth', width !== undefined && width > 0 ? width : undefined);
          }}
        />
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.connectorDash}
        <select value={connector.style?.dash ?? 'solid'} onChange={e => setStyle('dash', e.target.value === 'solid' ? undefined : (e.target.value as ConnectorDash))}>
          {CONNECTOR_DASHES.map(dash => (
            <option key={dash} value={dash}>
              {dashLabel[dash]}
            </option>
          ))}
        </select>
      </label>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.connectorArrow}
        <select value={connector.style?.arrow ?? 'none'} onChange={e => setStyle('arrow', e.target.value === 'none' ? undefined : (e.target.value as ConnectorArrow))}>
          {CONNECTOR_ARROWS.map(arrow => (
            <option key={arrow} value={arrow}>
              {arrowLabel[arrow]}
            </option>
          ))}
        </select>
      </label>

      <BindingEditor
        bindings={connector.bindings}
        onChange={bindings => {
          const { bindings: _bindings, ...rest } = connector;
          onChange(Object.keys(bindings).length > 0 ? { ...rest, bindings } : rest);
        }}
        fields={fields}
        allowOtherPath={false}
        headlinePath="label"
        resetKey={connector.id}
        adapters={adapters}
        connectorLabels={connectorLabels}
        labels={labels}
        clock={clock}
      />

      <div className="ub-panel__actions" style={GROUP_STYLE}>
        <button type="button" className="ub-action" onClick={onDelete}>
          {labels.deleteSelected}
        </button>
      </div>
    </div>
  );
}
