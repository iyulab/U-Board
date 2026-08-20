import { useEffect, useMemo, useRef, useState } from 'react';
import { KonvaDesigner } from '@canvas-kit/designer';
import { Viewer } from '@canvas-kit/viewer';
import type { Scene } from '@canvas-kit/core';
import { documentToScene, applySceneToDocument, addNode, nextNodePosition } from './scene-mapping.js';
import { resolveDocument } from '../resolve-document.js';
import { toCanvasKit } from '../renderer/to-canvas-kit.js';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit.js';
import { serializeViewDocument, parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';

export interface AuthoringViewProps {
  initialDocument: ViewDocument;
  adapters: readonly Adapter[];
  width: number;
  height: number;
  /** Save 버튼 동작을 오버라이드한다. 생략 시 오늘과 같은 로컬 파일 다운로드(Export). */
  onSave?: (doc: ViewDocument) => void | Promise<void>;
}

/**
 * The authoring surface: a canvas-kit `KonvaDesigner` for adding/dragging nodes, plus a live
 * preview rendered through the same path a real viewer would use (`resolveDocument` +
 * `toCanvasKit`) — so what the author sees is what a viewer sees, not a designer-only
 * approximation (docs/principles.md — editor/renderer separation; the designer never renders a
 * widget itself, it only owns the node's footprint).
 */
export function AuthoringView({ initialDocument, adapters, width, height, onSave }: AuthoringViewProps) {
  const [doc, setDoc] = useState(initialDocument);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scene = useMemo(() => documentToScene(doc), [doc]);

  useEffect(() => {
    let cancelled = false;
    resolveDocument(doc, adapters).then(resolved => {
      if (!cancelled) setPreview(toCanvasKit(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters]);

  const handleSceneChange = (newScene: Scene) => {
    setDoc(prev => applySceneToDocument(prev, newScene));
  };

  const handleAddNode = () => {
    setDoc(prev => addNode(prev, nextNodePosition(prev)));
    setImportError(null);
  };

  const handleSave = () => {
    setImportError(null);
    if (onSave) {
      onSave(doc);
      return;
    }
    const blob = new Blob([serializeViewDocument(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'view-document.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      const imported = parseViewDocument(await file.text());
      setDoc(imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof InvalidViewDocumentError ? err.message : 'Import failed.');
    }
  };

  return (
    <div>
      <button onClick={handleAddNode} style={{ marginBottom: 8 }}>
        Add node
      </button>{' '}
      <button onClick={handleSave} style={{ marginBottom: 8 }}>
        {onSave ? 'Save' : 'Export'}
      </button>{' '}
      <button onClick={handleImportClick} style={{ marginBottom: 8 }}>
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
        data-testid="import-file-input"
      />
      {importError && <p style={{ color: '#dc2626', fontSize: 13 }}>{importError}</p>}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Editor</h2>
          <KonvaDesigner width={width} height={height} scene={scene} onSceneChange={handleSceneChange} />
        </div>
        <div>
          <h2 style={{ fontSize: 14, margin: '0 0 4px' }}>Live preview</h2>
          {preview ? (
            <Viewer width={width} height={height} scene={preview.scene} overlays={preview.overlays} />
          ) : (
            <p>Resolving…</p>
          )}
        </div>
      </div>
      <details style={{ marginTop: 16 }}>
        <summary>ViewDocument (debug)</summary>
        <pre style={{ fontSize: 11, maxWidth: 900, overflowX: 'auto' }}>{JSON.stringify(doc, null, 2)}</pre>
      </details>
    </div>
  );
}
