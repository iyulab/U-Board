import { useEffect, useState } from 'react';
import type { Adapter } from '../adapter.js';
import type { Background, ElementDefinition, Node, Placed, Widget } from '../view-document.js';
import { ELEMENT_TYPE_PREFIX, elementNameOf } from '../elements/element-type.js';
import { NodeAnchorFields } from './AnchorFields.js';
import { getWidgetLabel } from '@iyulab/u-widgets/tools';
import { WIDGET_TYPES, seedElementWidget, seedWidget, headlinePropPath, type WidgetType } from './widget-catalog.js';
import { WidgetPropsForm } from './WidgetPropsForm.js';
import { widgetFields } from './widget-fields.js';
import { BindingEditor, FIELD_STYLE } from './BindingEditor.js';
import { DEFAULT_LABELS, type UBoardLabels } from '../labels.js';
import { ERROR_STYLE } from '../ui-style.js';

export interface PropertyPanelProps {
  /** The selected widget — a canvas node or a grid item (`Placed`); a node's place is edited only with
   *  `background` and `onNodeChange` below. */
  node: Placed | null;
  adapters: readonly Adapter[];
  /** Adapter id → human-readable label. Falls back to the raw id when absent. */
  connectorLabels?: Record<string, string>;
  onChange: (widget: Widget) => void;
  /** The board's background, which an anchored node's coordinate is read by, and where a change to the
   *  node itself — its anchor, its place — goes. Without them the panel edits the widget only. */
  background?: Background;
  onNodeChange?: (change: Partial<Pick<Node, 'x' | 'y' | 'anchored'>>) => void;
  /** The board's elements: offered as types the widget can be, and read for a placed element's props. */
  elements?: Readonly<Record<string, ElementDefinition>>;
  labels?: UBoardLabels;
  /** The current time in epoch milliseconds, which a stale preview value's age is measured to —
   * `Date.now` by default. */
  clock?: () => number;
}

function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value);
}

export function PropertyPanel({
  node,
  adapters,
  connectorLabels,
  onChange,
  background,
  onNodeChange,
  elements,
  labels = DEFAULT_LABELS,
  clock = Date.now,
}: PropertyPanelProps) {
  const [propsText, setPropsText] = useState('{}');
  const [propsError, setPropsError] = useState<string | null>(null);

  // Resets the static-props editor. Keyed on the node and the specific `props` reference — not on
  // the whole widget — so a binding-only change (which spreads `{...node.widget, bindings}` and
  // leaves `props` untouched) doesn't re-derive/discard in-progress props-editor text.
  useEffect(() => {
    setPropsText(JSON.stringify(node?.widget.props ?? {}, null, 2));
    setPropsError(null);
  }, [node?.id, node?.widget.props]);

  if (!node) {
    return (
      <div className="ub-panel ub-panel--properties">
        <p className="ub-panel__hint">{labels.selectNode}</p>
      </div>
    );
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (isWidgetType(type)) onChange(seedWidget(type, { label: labels.newNodeLabel, value: labels.newNodeValue }));
    const element = elementNameOf(type);
    if (element !== undefined && elements && Object.hasOwn(elements, element)) onChange(seedElementWidget(element, elements[element]));
  };

  const handlePropsBlur = () => {
    try {
      const parsed = JSON.parse(propsText);
      setPropsError(null);
      onChange({ ...node.widget, props: parsed });
    } catch {
      setPropsError(labels.invalidJson);
    }
  };

  // The values a binding can replace, as the widget library names them; any other path is typed.
  const dataFields = widgetFields(node.widget, labels.locale, elements).fields.filter(f => f.section !== 'options');
  // The board's elements, and the one this widget places when the board no longer defines it — so the choice shows
  // what the widget is.
  const placedElement = elementNameOf(node.widget.type);
  const elementTypes = [...new Set([...Object.keys(elements ?? {}), ...(placedElement === undefined ? [] : [placedElement])])].sort();

  return (
    <div className="ub-panel ub-panel--properties">
      <h2 className="ub-panel__heading">{labels.propertiesHeading}</h2>
      <label className="ub-panel__field" style={FIELD_STYLE}>
        {labels.widgetType}
        <select value={node.widget.type} onChange={handleTypeChange}>
          {WIDGET_TYPES.map(t => (
            <option key={t} value={t}>
              {getWidgetLabel(t, labels.locale)}
            </option>
          ))}
          {elementTypes.length > 0 && (
            <optgroup label={labels.boardElements}>
              {elementTypes.map(name => (
                <option key={name} value={`${ELEMENT_TYPE_PREFIX}${name}`} disabled={!elements || !Object.hasOwn(elements, name)}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      {background && onNodeChange && 'anchored' in node && (
        <NodeAnchorFields node={node as Node} background={background} onChange={onNodeChange} labels={labels} />
      )}
      <WidgetPropsForm widget={node.widget} onChange={onChange} labels={labels} elements={elements} />
      {/* Open while it holds an edit that is not valid JSON, so the error is never folded away. */}
      <details className="ub-panel__advanced" open={propsError !== null || undefined}>
        <summary>{labels.advancedProps}</summary>
        <label className="ub-panel__field" style={FIELD_STYLE}>
          {labels.staticProps}
          <textarea
            className="ub-panel__json"
            value={propsText}
            onChange={e => setPropsText(e.target.value)}
            onBlur={handlePropsBlur}
            rows={8}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </label>
        {propsError && (
          <p role="alert" className="ub-panel__error" style={ERROR_STYLE}>
            {propsError}
          </p>
        )}
      </details>

      <BindingEditor
        bindings={node.widget.bindings}
        onChange={bindings => onChange({ ...node.widget, bindings })}
        fields={dataFields.map(f => ({ path: f.path.join('.'), label: f.label }))}
        allowOtherPath
        headlinePath={headlinePropPath(node.widget.type)}
        resetKey={`${node.id}\u0000${node.widget.type}`}
        adapters={adapters}
        connectorLabels={connectorLabels}
        labels={labels}
        clock={clock}
      />
    </div>
  );
}
