import { useEffect, useMemo, useState } from 'react';
import { KonvaDesigner } from '@canvas-kit/designer';
import { Viewer } from '@canvas-kit/viewer';
import type { Scene } from '@canvas-kit/core';
import { documentToScene, applySceneToDocument, addNode } from './scene-mapping';
import { resolveDocument } from '../resolve-document';
import { toCanvasKit } from '../renderer/to-canvas-kit';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit';
import type { Adapter } from '../adapter';
import type { ViewDocument } from '../view-document';

export interface AuthoringViewProps {
  initialDocument: ViewDocument;
  adapters: readonly Adapter[];
  width: number;
  height: number;
}

/**
 * The authoring surface: a canvas-kit `KonvaDesigner` for adding/dragging nodes, plus a live
 * preview rendered through the same path a real viewer would use (`resolveDocument` +
 * `toCanvasKit`) — so what the author sees is what a viewer sees, not a designer-only
 * approximation (docs/principles.md — editor/renderer separation; the designer never renders a
 * widget itself, it only owns the node's footprint).
 */
export function AuthoringView({ initialDocument, adapters, width, height }: AuthoringViewProps) {
  const [doc, setDoc] = useState(initialDocument);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
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
    setDoc(prev => addNode(prev, { x: 40, y: 40 }));
  };

  return (
    <div>
      <button onClick={handleAddNode} style={{ marginBottom: 8 }}>
        Add node
      </button>
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
