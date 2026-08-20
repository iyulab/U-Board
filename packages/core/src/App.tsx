import { useMemo, useState } from 'react';
import { AuthoringView } from './authoring/AuthoringView.js';
import { ViewerPage } from './viewer/ViewerPage.js';
import type { ViewDocument } from './view-document.js';
import { DemoAdapter } from './demo-adapter.js';

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
    {
      // Bound to a ref DemoAdapter has no entry for, so it resolves `disconnected` — exercises
      // the third connection-quality state (the other two nodes above cover live and stale).
      id: 'pump-c',
      x: 340,
      y: 300,
      width: 180,
      height: 90,
      anchored: true,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump C' } },
        bindings: { 'data.value': { adapter: 'demo-cmms', ref: 'pump-c.state' } },
      },
    },
    {
      // Trend chart, unverified in the actual render path until now (u-widgets unit-tests
      // chart.* on its own, but this pipeline — resolveDocument → canvas-kit overlay → the
      // uw-chart custom element — had not been exercised end-to-end). No binding: a real trend
      // needs a time-series adapter method the current DemoAdapter (single-value resolve)
      // doesn't have, so this uses static sample data to verify rendering alone.
      id: 'pump-a-load-trend',
      x: 540,
      y: 120,
      width: 320,
      height: 260,
      anchored: true,
      widget: {
        type: 'chart.line',
        props: {
          data: [
            { t: '09:00', load: 61 },
            { t: '10:00', load: 68 },
            { t: '11:00', load: 73 },
            { t: '12:00', load: 70 },
          ],
          mapping: { x: 't', y: 'load' },
          options: { smooth: true },
        },
      },
    },
  ],
  connectors: [{ id: 'a-to-b', fromNodeId: 'pump-a', toNodeId: 'pump-b' }],
};

export function App() {
  const adapters = useMemo(() => [new DemoAdapter()], []);
  const [mode, setMode] = useState<'author' | 'view'>('author');

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>U-Board — {mode === 'author' ? 'authoring' : 'viewer'}</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode('author')} disabled={mode === 'author'}>
          Author
        </button>{' '}
        <button onClick={() => setMode('view')} disabled={mode === 'view'}>
          View
        </button>
      </div>
      {mode === 'author' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Add and drag nodes on the left; the right pane renders the same ViewDocument through
            the real render path (resolveDocument + canvas-kit Viewer + u-widgets overlays)
            against a demo adapter (one live value, one deliberately stale, one that never
            resolves). Widgets whose binding isn't live get a frame — amber dashed for stale,
            gray dotted for disconnected (distinct border style, not just color, so the two
            don't rely on color perception alone). Export/Import save and restore the document
            as a local
            file — there's no backend yet, so a file is the save mechanism for now.
          </p>
          <AuthoringView initialDocument={demoDocument} adapters={adapters} width={900} height={560} />
        </>
      ) : (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Read-only — import a ViewDocument (e.g. one exported from Author mode) and it renders
            through the same path a standalone viewer app would use, with no editing controls and
            no dependency on the designer.
          </p>
          <ViewerPage adapters={adapters} width={900} height={560} />
        </>
      )}
    </div>
  );
}
