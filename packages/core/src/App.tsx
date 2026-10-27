import { useMemo, useState } from 'react';
import { BoardView } from './viewer/BoardView.js';
import { FixtureAdapter } from './fixture-adapter.js';
import { demoBoard, demoGrid, demoMixed, demoQuakes, elementsDemo } from './examples/demo-boards.js';

// The package's development harness: the demo boards drawn the way a host that only views them draws them — no
// editor, no designer, no server. The browser tests in e2e/ run against it.
type Mode = 'view' | 'grid' | 'mixed' | 'elements' | 'quakes';
const MODES: ReadonlyArray<readonly [Mode, string]> = [
  ['view', 'View'],
  ['grid', 'Grid'],
  ['mixed', 'Mixed'],
  ['elements', 'Elements'],
  ['quakes', 'Quakes'],
];

export function App() {
  const adapters = useMemo(() => [new FixtureAdapter()], []);
  const [mode, setMode] = useState<Mode>('view');
  const [boardEvent, setBoardEvent] = useState<string | null>(null);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>U-Board — {mode === 'view' ? 'viewer' : mode === 'grid' ? 'grid view' : mode === 'elements' ? 'elements' : mode === 'mixed' ? 'mixed board' : 'placed by fields'}</h1>
      <div style={{ marginBottom: 12 }}>
        {MODES.map(([value, label]) => (
          <span key={value}>
            <button onClick={() => setMode(value)} disabled={mode === value}>
              {label}
            </button>{' '}
          </span>
        ))}
      </div>
      {mode === 'mixed' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            A grid whose first cell holds a canvas — the floor plan with its nodes and line, fitted to the cell — and the
            other widgets as cards around it. The page scrolls over the canvas; Ctrl (⌘) + wheel zooms it.
          </p>
          <div style={{ height: 720, maxWidth: 1200, resize: 'horizontal', overflow: 'auto' }}>
            <BoardView board={demoMixed} adapters={adapters} />
          </div>
        </>
      ) : mode === 'elements' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Elements the board defines itself — a pump symbol, a tank level, a ring — drawn by templates of SVG and CSS
            with no script, each in an isolated root that takes the board's theme. Defined once, placed by name.
          </p>
          <div style={{ height: 520, maxWidth: 1000, resize: 'horizontal', overflow: 'auto' }}>
            <BoardView board={elementsDemo} adapters={adapters} />
          </div>
        </>
      ) : mode === 'grid' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            The same widgets as a grid view — in order, each spanning columns of a 12-column row, laid out to
            the width of the view (one column when narrow, six at medium width).
          </p>
          <div style={{ height: 720, maxWidth: 1200, resize: 'horizontal', overflow: 'auto' }}>
            <BoardView board={demoGrid} adapters={adapters} />
          </div>
        </>
      ) : mode === 'quakes' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Items placed by their own fields: each event sits where its longitude and latitude say, on a map of the whole
            world, and a click opens the event's own page.
          </p>
          <div style={{ height: 420, maxWidth: 760 }}>
            <BoardView board={demoQuakes} adapters={adapters} boardId="quakes" />
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Read-only — the demo board through the same path a standalone viewer app would use,
            with no editing controls and no dependency on the designer.
          </p>
          <div style={{ height: 560, maxWidth: 900 }}>
            <BoardView board={demoBoard} adapters={adapters} boardId="demo" onTrigger={event => setBoardEvent(`${event.name} (${event.node})`)} />
          </div>
          <p role="status" style={{ color: '#64748b' }}>
            Board event: {boardEvent ?? 'none yet — click Pump A'}
          </p>
        </>
      )}
    </div>
  );
}
