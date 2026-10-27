import { useMemo, useState } from 'react';
import { BoardAuthoring } from './authoring/BoardAuthoring.js';
import { BoardView } from '@iyulab/u-board/viewer';
import { FixtureAdapter, demoBoard, demoGrid, demoMixed, demoQuakes, elementsDemo } from '@iyulab/u-board/examples';

export function App() {
  const adapters = useMemo(() => [new FixtureAdapter()], []);
  const [mode, setMode] = useState<'author' | 'view' | 'grid' | 'grid-author' | 'mixed' | 'mixed-author' | 'elements' | 'elements-author' | 'quakes'>('author');
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
        </button>{' '}
        <button onClick={() => setMode('quakes')} disabled={mode === 'quakes'}>
          Quakes
        </button>
      </div>
      {mode === 'author' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Add and drag nodes; each node's widget is drawn in place through the real render path
            (the board's picture + u-widgets overlays) against a fixture adapter (one live value, one
            deliberately stale, one that never resolves), and View shows the board as a shared
            link does. Widgets whose binding isn't live get a frame — amber dashed for stale,
            gray dotted for disconnected (distinct border style, not just color, so the two
            don't rely on color perception alone). This is the library's development harness,
            with no server behind it: Export saves the board as a local file. The console saves boards on the server.
          </p>
          <div style={{ height: 620 }}>
            <BoardAuthoring initialBoard={demoBoard} adapters={adapters} />
          </div>
        </>
      ) : mode === 'grid-author' ? (
        <div style={{ height: 720 }}>
          <BoardAuthoring initialBoard={demoGrid} adapters={adapters} />
        </div>
      ) : mode === 'mixed-author' ? (
        <div style={{ height: 720 }}>
          <BoardAuthoring initialBoard={demoMixed} adapters={adapters} />
        </div>
      ) : mode === 'mixed' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            A grid whose first cell holds a canvas — the floor plan with its nodes and line, fitted to the cell — and the
            other widgets as cards around it. The page scrolls over the canvas; Ctrl (⌘) + wheel zooms it.
          </p>
          <div style={{ height: 720, maxWidth: 1200, resize: 'horizontal', overflow: 'auto' }}>
            <BoardView board={demoMixed} adapters={adapters} />
          </div>
        </>
      ) : mode === 'elements-author' ? (
        <div style={{ height: 720 }}>
          <BoardAuthoring initialBoard={elementsDemo} adapters={adapters} />
        </div>
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
