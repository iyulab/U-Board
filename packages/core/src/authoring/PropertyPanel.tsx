import { useEffect, useState } from 'react';
import type { Node, Widget } from '../view-document.js';
import { WIDGET_TYPES, seedWidget, type WidgetType } from './widget-catalog.js';

export interface PropertyPanelProps {
  node: Node | null;
  onChange: (widget: Widget) => void;
}

function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value);
}

export function PropertyPanel({ node, onChange }: PropertyPanelProps) {
  const [propsText, setPropsText] = useState('{}');
  const [propsError, setPropsError] = useState<string | null>(null);

  useEffect(() => {
    setPropsText(JSON.stringify(node?.widget.props ?? {}, null, 2));
    setPropsError(null);
  }, [node?.id, node?.widget]);

  if (!node) {
    return <p>노드를 선택하세요.</p>;
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (isWidgetType(type)) onChange(seedWidget(type));
  };

  const handlePropsBlur = () => {
    try {
      const parsed = JSON.parse(propsText);
      setPropsError(null);
      onChange({ ...node.widget, props: parsed });
    } catch {
      setPropsError('올바른 JSON이 아닙니다');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Properties</h2>
      <label>
        위젯 타입
        <select value={node.widget.type} onChange={handleTypeChange}>
          {WIDGET_TYPES.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div>
        <label htmlFor="property-panel-props">정적 props (JSON)</label>
        <textarea
          id="property-panel-props"
          value={propsText}
          onChange={e => setPropsText(e.target.value)}
          onBlur={handlePropsBlur}
          rows={8}
          style={{ display: 'block', width: '100%', fontFamily: 'monospace', fontSize: 11 }}
        />
        {propsError && <p style={{ color: '#dc2626', fontSize: 12 }}>{propsError}</p>}
      </div>
    </div>
  );
}
