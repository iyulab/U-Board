import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { resolveDocument } from '../resolve-document';
import { toCanvasKit } from '../renderer/to-canvas-kit';
import type { CanvasKitRenderOutput } from '../renderer/to-canvas-kit';
import { parseViewDocument, InvalidViewDocumentError } from '../persistence/view-document-file';
import type { Adapter } from '../adapter';
import type { ViewDocument } from '../view-document';

export interface ViewerPageProps {
  adapters: readonly Adapter[];
  width: number;
  height: number;
}

/**
 * A read-only view of an imported ViewDocument — no `KonvaDesigner`, no editing controls. This
 * module never imports `@canvas-kit/designer` at all, so it stays what a real standalone viewer
 * deployment would ship with (docs/principles.md — editor/renderer separation): the authoring
 * tool's weight can never leak in here, because it isn't a dependency of this file.
 */
export function ViewerPage({ adapters, width, height }: ViewerPageProps) {
  const [doc, setDoc] = useState<ViewDocument | null>(null);
  const [preview, setPreview] = useState<CanvasKitRenderOutput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!doc) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    resolveDocument(doc, adapters).then(resolved => {
      if (!cancelled) setPreview(toCanvasKit(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, [doc, adapters]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      setDoc(parseViewDocument(await file.text()));
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof InvalidViewDocumentError ? err.message : 'Import failed.');
    }
  };

  return (
    <div>
      <button onClick={handleImportClick} style={{ marginBottom: 8 }}>
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      {importError && <p style={{ color: '#dc2626', fontSize: 13 }}>{importError}</p>}
      {!doc ? (
        <p style={{ color: '#64748b' }}>No document loaded — Import one to view it.</p>
      ) : preview ? (
        <Viewer width={width} height={height} scene={preview.scene} overlays={preview.overlays} />
      ) : (
        <p>Resolving…</p>
      )}
    </div>
  );
}
