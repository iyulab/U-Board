import { useEffect, useState } from 'react';
import type { Adapter, ConnectionQuality } from '../adapter.js';
import { DemoAdapter } from '../demo-adapter.js';
import type { Node, Widget, Binding } from '../view-document.js';
import { WIDGET_TYPES, seedWidget, type WidgetType } from './widget-catalog.js';

export interface PropertyPanelProps {
  node: Node | null;
  adapters: readonly Adapter[];
  /** Adapter id → human-readable label. Falls back to the raw id when absent. */
  connectorLabels?: Record<string, string>;
  onChange: (widget: Widget) => void;
}

function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value);
}

function labelFor(adapterId: string, connectorLabels?: Record<string, string>): string {
  return connectorLabels?.[adapterId] ?? adapterId;
}

interface BindingDraft {
  propPath: string;
  connectorId: string;
  path: string;
  valuePath: string;
  demoRef: string;
}

function emptyDraft(connectorId: string): BindingDraft {
  return { propPath: '', connectorId, path: '', valuePath: '', demoRef: '' };
}

function draftFromBinding(propPath: string, binding: Binding): BindingDraft {
  const ref = binding.ref as { path?: string; valuePath?: string } | string;
  if (typeof ref === 'string') {
    return { propPath, connectorId: binding.adapter, path: '', valuePath: '', demoRef: ref };
  }
  return { propPath, connectorId: binding.adapter, path: ref.path ?? '', valuePath: ref.valuePath ?? '', demoRef: '' };
}

export function PropertyPanel({ node, adapters, connectorLabels, onChange }: PropertyPanelProps) {
  const [propsText, setPropsText] = useState('{}');
  const [propsError, setPropsError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BindingDraft>(emptyDraft(adapters[0]?.id ?? ''));
  const [preview, setPreview] = useState<{ value: unknown; quality: ConnectionQuality } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setPropsText(JSON.stringify(node?.widget.props ?? {}, null, 2));
    setPropsError(null);
    setDraft(emptyDraft(adapters[0]?.id ?? ''));
    setPreview(null);
    setPreviewError(null);
  }, [node?.id, node?.widget, adapters]);

  if (!node) {
    return <p>노드를 선택하세요.</p>;
  }

  const selectedAdapter = adapters.find(a => a.id === draft.connectorId);
  const isDemo = selectedAdapter instanceof DemoAdapter;

  const draftRef = (): unknown =>
    isDemo ? draft.demoRef : { path: draft.path, valuePath: draft.valuePath || undefined };

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

  const handlePreview = async () => {
    if (!selectedAdapter) return;
    setPreviewError(null);
    try {
      setPreview(await selectedAdapter.resolve(draftRef()));
    } catch {
      setPreviewError('미리보기 호출에 실패했습니다');
    }
  };

  const handleSaveBinding = () => {
    if (!draft.propPath || !selectedAdapter) return;
    const bindings = { ...(node.widget.bindings ?? {}) };
    bindings[draft.propPath] = { adapter: selectedAdapter.id, ref: draftRef() };
    onChange({ ...node.widget, bindings });
    setDraft(emptyDraft(adapters[0]?.id ?? ''));
    setPreview(null);
  };

  const handleRemoveBinding = (propPath: string) => {
    const bindings = { ...(node.widget.bindings ?? {}) };
    delete bindings[propPath];
    onChange({ ...node.widget, bindings });
  };

  const handleEditBinding = (propPath: string, binding: Binding) => {
    setDraft(draftFromBinding(propPath, binding));
    setPreview(null);
    setPreviewError(null);
  };

  const bindingEntries = Object.entries(node.widget.bindings ?? {});

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

      <h3 style={{ fontSize: 13, margin: '12px 0 4px' }}>바인딩</h3>
      {bindingEntries.length === 0 && <p style={{ fontSize: 12 }}>바인딩 없음</p>}
      <ul>
        {bindingEntries.map(([propPath, binding]) => (
          <li key={propPath}>
            <code>{propPath}</code> {'→ '}
            <span>{labelFor(binding.adapter, connectorLabels)}</span>{' '}
            <button type="button" onClick={() => handleEditBinding(propPath, binding)}>
              수정
            </button>{' '}
            <button type="button" onClick={() => handleRemoveBinding(propPath)}>
              제거
            </button>
          </li>
        ))}
      </ul>

      {adapters.length === 0 ? (
        <p style={{ fontSize: 12 }}>연결된 데이터소스가 없습니다.</p>
      ) : (
        <div>
          <label>
            프롭 경로
            <input value={draft.propPath} onChange={e => setDraft({ ...draft, propPath: e.target.value })} placeholder="data.value" />
          </label>
          <label>
            데이터소스
            <select value={draft.connectorId} onChange={e => setDraft({ ...draft, connectorId: e.target.value })}>
              {adapters.map(a => (
                <option key={a.id} value={a.id}>
                  {labelFor(a.id, connectorLabels)} ({a.id})
                </option>
              ))}
            </select>
          </label>
          {isDemo ? (
            <label>
              참조 키
              <input value={draft.demoRef} onChange={e => setDraft({ ...draft, demoRef: e.target.value })} placeholder="pump-a.state" />
            </label>
          ) : (
            <>
              <label>
                Path
                <input value={draft.path} onChange={e => setDraft({ ...draft, path: e.target.value })} placeholder="/pumps/a" />
              </label>
              <label>
                Value path
                <input value={draft.valuePath} onChange={e => setDraft({ ...draft, valuePath: e.target.value })} placeholder="status" />
              </label>
            </>
          )}
          <button type="button" onClick={handlePreview}>
            미리보기
          </button>
          <button type="button" onClick={handleSaveBinding} disabled={!draft.propPath}>
            바인딩 저장
          </button>
          {previewError && <p style={{ color: '#dc2626', fontSize: 12 }}>{previewError}</p>}
          {preview && (
            <p style={{ fontSize: 12 }} data-quality={preview.quality}>
              값: {JSON.stringify(preview.value)} ({preview.quality})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
