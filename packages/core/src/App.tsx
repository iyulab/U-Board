import { useMemo, useState } from 'react';
import { BoardView } from './viewer/BoardView.js';
import { ViewerPage } from './viewer/ViewerPage.js';
import type { BoardInput } from './board-input.js';
import type { CanvasView } from './view-document.js';
import { FixtureAdapter } from './fixture-adapter.js';
import { demoBoard, demoCrowd, demoGrid, demoMixed, demoQuakes, elementsDemo } from './examples/demo-boards.js';

// The package's development harness: the demo boards drawn the way a host that only views them draws them — no
// editor, no designer, no server. The browser tests in e2e/ run against it.
type Mode = 'view' | 'grid' | 'mixed' | 'elements' | 'quakes' | 'crowd' | 'input';
const MODES: ReadonlyArray<readonly [Mode, string]> = [
  ['view', 'View'],
  ['grid', 'Grid'],
  ['mixed', 'Mixed'],
  ['elements', 'Elements'],
  ['quakes', 'Quakes'],
  ['crowd', 'Crowd'],
  ['input', 'Input'],
];

// An input part: a form the viewer draws as given (a board's own kinds take no form spec), whose values reach the host and nowhere else.
const ORDER_FORM: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: [{ id: 'order', x: 0, y: 0, width: 360, height: 220, anchored: false, widget: { type: 'form', props: { formdown: '@name(Name): []\n@qty(Quantity): #[]' }, bindings: {} } }],
  connectors: [],
};

export function App() {
  const adapters = useMemo(() => [new FixtureAdapter()], []);
  const [mode, setMode] = useState<Mode>('view');
  const [boardEvent, setBoardEvent] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>U-Board — {mode === 'view' ? 'viewer' : mode === 'grid' ? 'grid view' : mode === 'elements' ? 'elements' : mode === 'mixed' ? 'mixed board' : mode === 'crowd' ? 'a crowd of parts' : mode === 'input' ? 'input' : 'placed by fields'}</h1>
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
      ) : mode === 'input' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            An input widget in a picture the host draws itself. What is typed into it reaches the host through onInput — the viewer writes it nowhere.
          </p>
          <div style={{ height: 300, maxWidth: 420 }}>
            <ViewerPage adapters={adapters} document={ORDER_FORM} ariaLabel="Order" onInput={(input: BoardInput) => setHeard(input.type === 'change' ? `${input.part}: ${input.name} = ${String(input.value)}` : `${input.part}: submitted`)} />
          </div>
          <p role="status" style={{ color: '#64748b' }}>
            Input: {heard ?? 'none yet'}
          </p>
        </>
      ) : mode === 'crowd' ? (
        <>
          <p style={{ color: '#64748b', maxWidth: 640 }}>
            Eight hundred parts — more than one view holds. Zoomed out, all of them are in the page; zoomed in, the viewer
            leaves out those well beyond the view and builds them again as it nears them.
          </p>
          <div style={{ height: 520, maxWidth: 900 }}>
            <BoardView board={demoCrowd} adapters={adapters} boardId="crowd" />
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
