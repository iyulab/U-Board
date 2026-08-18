import { useEffect, useState } from 'react';
import { Viewer } from '@canvas-kit/viewer';
import { resolveDocument } from './resolve-document';
import type { Adapter, ResolvedBinding } from './adapter';
import { toCanvasKit } from './renderer/to-canvas-kit';
import type { CanvasKitRenderOutput } from './renderer/to-canvas-kit';
import type { ViewDocument } from './view-document';

/** A stand-in for a real CMMS adapter (docs — "실제 CMMS adapter 구현은 그 시스템 접근이 필요해
 * 별도"). Exercises the resolution/connectivity pipeline end-to-end without a real system. */
class DemoAdapter implements Adapter {
  readonly id = 'demo-cmms';
  private data: Record<string, ResolvedBinding> = {
    'pump-a.state': { value: 'running', connected: true },
    'pump-a.load': { value: 73, connected: true },
    'pump-b.state': { value: 'stopped (last known)', connected: false },
  };

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    return this.data[key] ?? { value: undefined, connected: false };
  }
}

const FLOOR_PLAN = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560">
    <rect width="900" height="560" fill="#f1f5f9"/>
    <rect x="20" y="20" width="860" height="520" fill="none" stroke="#94a3b8" stroke-width="2"/>
    <text x="450" y="290" font-family="sans-serif" font-size="20" fill="#94a3b8"
          text-anchor="middle">floor plan (placeholder)</text>
  </svg>
`)}`;

const demoDocument: ViewDocument = {
  kind: 'canvas',
  background: { image: { src: FLOOR_PLAN, width: 900, height: 560 } },
  nodes: [
    {
      id: 'pump-a',
      x: 120,
      y: 120,
      width: 180,
      height: 90,
      anchored: true,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump A', level: 'success' } },
        bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.state' } },
      },
    },
    {
      id: 'pump-a-load',
      x: 340,
      y: 120,
      width: 160,
      height: 130,
      anchored: true,
      widget: {
        type: 'gauge',
        props: { data: { label: 'Load %', min: 0, max: 100 } },
        bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-a.load' } },
      },
    },
    {
      id: 'pump-b',
      x: 120,
      y: 300,
      width: 180,
      height: 90,
      anchored: true,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump B', level: 'warning' } },
        bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-b.state' } },
      },
    },
  ],
  connectors: [{ id: 'a-to-b', fromNodeId: 'pump-a', toNodeId: 'pump-b' }],
};

export function App() {
  const [output, setOutput] = useState<CanvasKitRenderOutput | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveDocument(demoDocument, [new DemoAdapter()]).then(resolved => {
      if (!cancelled) setOutput(toCanvasKit(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>U-Board — rendering pipeline smoke test</h1>
      <p style={{ color: '#64748b', maxWidth: 640 }}>
        A hand-built View Document, resolved against a demo adapter (one connected value, one
        deliberately disconnected), rendered through canvas-kit's Viewer with u-widgets overlays.
        Not the authoring tool — this only proves the render path.
      </p>
      {output ? (
        <Viewer width={900} height={560} scene={output.scene} overlays={output.overlays} />
      ) : (
        <p>Resolving…</p>
      )}
    </div>
  );
}
