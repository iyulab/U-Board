import { useMemo, useState } from 'react';
import { AuthoringView } from './authoring/AuthoringView.js';
import { ViewerPage } from './viewer/ViewerPage.js';
import type { CanvasView, GridView } from './view-document.js';
import { FixtureAdapter } from './fixture-adapter.js';
import { seedWidget } from './authoring/widget-catalog.js';
import { elementsDemo } from './examples/elements.js';

const FLOOR_PLAN = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560">
    <rect width="900" height="560" fill="#f1f5f9"/>
    <rect x="20" y="20" width="860" height="520" fill="none" stroke="#94a3b8" stroke-width="2"/>
    <text x="450" y="290" font-family="sans-serif" font-size="20" fill="#94a3b8"
          text-anchor="middle">floor plan (placeholder)</text>
  </svg>
`)}`;

const demoDocument: CanvasView = {
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
        bindings: { 'data.value': { adapter: 'fixture', ref: 'pump-a.state' } },
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
        bindings: { 'data.value': { adapter: 'fixture', ref: 'pump-a.load' } },
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
        bindings: { 'data.value': { adapter: 'fixture', ref: 'pump-b.state' } },
      },
    },
    {
      // Bound to a ref FixtureAdapter has no entry for, so it resolves `disconnected` — exercises
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
        bindings: { 'data.value': { adapter: 'fixture', ref: 'pump-c.state' } },
      },
    },
    {
      // Trend chart, unverified in the actual render path until now (u-widgets unit-tests
      // chart.* on its own, but this pipeline — resolveDocument → canvas-kit overlay → the
      // uw-chart custom element — had not been exercised end-to-end). No binding: a real trend
      // needs a time-series adapter method the current FixtureAdapter (single-value resolve)
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
    {
      // Uses widget-catalog.ts's seedWidget() verbatim — the exact static-props shape the
      // authoring UI hands a new node the moment its type is switched, before an author has
      // touched anything. Distinct from pump-a-load/pump-a-load-trend above, whose props are
      // hand-authored sample data rather than the seed default — this node exists to prove the
      // seed shape itself survives resolveDocument → canvas-kit overlay → the real u-widgets
      // custom element without falling back to "Unknown widget" (bindings-editor final review,
      // 2026-08-25).
      id: 'seed-gauge-check',
      x: 540,
      y: 400,
      width: 160,
      height: 140,
      anchored: true,
      widget: seedWidget('gauge'),
    },
    {
      // Same rationale as seed-gauge-check, for chart.line's seed shape.
      id: 'seed-chart-line-check',
      x: 720,
      y: 400,
      width: 160,
      height: 140,
      anchored: true,
      widget: seedWidget('chart.line'),
    },
  ],
  connectors: [{ id: 'a-to-b', fromNodeId: 'pump-a', toNodeId: 'pump-b' }],
  // Clicking Pump A hands the page an event — what a host does with it is its own (here: a line under the board).
  triggers: [{ on: { event: 'click', node: 'pump-a' }, do: [{ action: 'emit', name: 'pump-a-details' }] }],
};

/** The same widgets laid out as a grid view: in order, by span — what an ordinary dashboard looks like. */
const demoGrid: GridView = {
  kind: 'grid',
  items: demoDocument.nodes.map((node, i) => ({ id: node.id, span: i < 2 ? 6 : 4, widget: node.widget })),
};

/** A mixed board: the floor plan as a canvas in one cell, the trends beside it as cards the grid lays out. */
const demoMixed: GridView = {
  kind: 'grid',
  items: [
    { id: 'plan', span: 8, spanMedium: 6, canvas: { background: demoDocument.background, nodes: demoDocument.nodes.filter(node => node.id.startsWith('pump-')), connectors: demoDocument.connectors } },
    ...demoDocument.nodes.filter(node => !node.id.startsWith('pump-')).map(node => ({ id: node.id, span: 4, widget: node.widget })),
  ],
  triggers: demoDocument.triggers,
};

export function App() {
  const adapters = useMemo(() => [new FixtureAdapter()], []);
  const [mode, setMode] = useState<'author' | 'view' | 'grid' | 'grid-author' | 'mixed' | 'mixed-author' | 'elements' | 'elements-author'>('author');
  const [boardEvent, setBoardEvent] = useState<string | null>(null);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>U-Board — {mode === 'author' ? 'authoring' : mode === 'view' ? 'viewer' : mode === 'grid' ? 'grid view' : mode === 'elements' ? 'elements' : mode === 'elements-author' ? 'elements authoring' : mode === 'mixed' ? 'mixed board' : mode === 'mixed-author' ? 'mixed board authoring' : 'grid authoring'}</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode('author')} disabled={mode === 'author'}>
          Author
        </button>{' '}
        <button onClick={() => setMode('view')} disabled={mode === 'view'}>
          View
        </button>{' '}
        <button onClick={() => setMode('grid')} disabled={mode === 'grid'}>
          Grid
        </button>{' '}
        <button onClick={() => setMode('grid-author')} disabled={mode === 'grid-author'}>
          Author grid
        </button>{' '}
        <button onClick={() => setMode('mixed')} disabled={mode === 'mixed'}>
          Mixed
        </button>{' '}
        <button onClick={() => setMode('mixed-author')} disabled={mode === 'mixed-author'}>
          Author mixed
        </button>{' '}
        <button onClick={() => setMode('elements')} disabled={mode === 'elements'}>
          Elements
        </button>{' '}
        <button onClick={() => setMode('elements-author')} disabled={mode === 'elements-author'}>
          Author elements
        </button>
      </div>
      {mode === 'author' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Add and drag nodes; each node's widget is drawn in place through the real render path
            (resolveDocument + u-widgets overlays) against a fixture adapter (one live value, one
            deliberately stale, one that never resolves), and View shows the board as a shared
            link does. Widgets whose binding isn't live get a frame — amber dashed for stale,
            gray dotted for disconnected (distinct border style, not just color, so the two
            don't rely on color perception alone). This is the library's development harness,
            with no server behind it: Export/Import save and restore the document as a local
            file. The console saves boards on the server.
          </p>
          <div style={{ height: 620 }}>
            <AuthoringView initialDocument={demoDocument} adapters={adapters} showDocumentSource />
          </div>
        </>
      ) : mode === 'grid-author' ? (
        <div style={{ height: 720 }}>
          <AuthoringView initialDocument={demoGrid} adapters={adapters} showDocumentSource />
        </div>
      ) : mode === 'mixed-author' ? (
        <div style={{ height: 720 }}>
          <AuthoringView initialDocument={demoMixed} adapters={adapters} showDocumentSource />
        </div>
      ) : mode === 'mixed' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            A grid whose first cell holds a canvas — the floor plan with its nodes and line, fitted to the cell — and the
            other widgets as cards around it. The page scrolls over the canvas; Ctrl (⌘) + wheel zooms it.
          </p>
          <div style={{ height: 720, maxWidth: 1200, resize: 'horizontal', overflow: 'auto' }}>
            <ViewerPage document={demoMixed} adapters={adapters} />
          </div>
        </>
      ) : mode === 'elements-author' ? (
        <div style={{ height: 720 }}>
          <AuthoringView initialDocument={elementsDemo} adapters={adapters} showDocumentSource />
        </div>
      ) : mode === 'elements' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Elements the board defines itself — a pump symbol, a tank level, a ring — drawn by templates of SVG and CSS
            with no script, each in an isolated root that takes the board's theme. Defined once, placed by name.
          </p>
          <div style={{ height: 520, maxWidth: 1000, resize: 'horizontal', overflow: 'auto' }}>
            <ViewerPage document={elementsDemo} adapters={adapters} />
          </div>
        </>
      ) : mode === 'grid' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            The same widgets as a grid view — in order, each spanning columns of a 12-column row, laid out to
            the width of the view (one column when narrow, six at medium width).
          </p>
          <div style={{ height: 720, maxWidth: 1200, resize: 'horizontal', overflow: 'auto' }}>
            <ViewerPage document={demoGrid} adapters={adapters} />
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Read-only — the demo document through the same path a standalone viewer app would use,
            with no editing controls and no dependency on the designer.
          </p>
          <div style={{ height: 560, maxWidth: 900 }}>
            <ViewerPage document={demoDocument} adapters={adapters} boardId="demo" onTrigger={event => setBoardEvent(`${event.name} (${event.node})`)} />
          </div>
          <p role="status" style={{ color: '#64748b' }}>
            Board event: {boardEvent ?? 'none yet — click Pump A'}
          </p>
        </>
      )}
    </div>
  );
}
