# Embedding U-Board in your app

U-Board is a library, not a service: a board is a document your app keeps, a viewer draws it, and your adapters say where the values
come from. This page puts the pieces together from the host's side — what you write, what the library does, and where your own rules
go. [Concepts](concepts.md) explains the terms; the [API reference](api-reference.md) has the shapes.

| You bring | The library gives |
|---|---|
| Where a board is stored, and who may read or change it | The board language, its check, and a viewer that draws a board from a document |
| An adapter for each system whose values the board shows | The contract an adapter meets, and what the viewer does with a value's quality, age and note |
| The values a person chooses (a line, a day) | `variables`: the board is drawn at them, and again when they change |
| What happens when a person acts on a part | Calls to your code (`onTrigger`, `onInput`) — nothing is written anywhere |
| A chat panel and a model, if an assistant should draw boards | The same tools as an MCP server, as functions you give your own model (`@iyulab/u-board-mcp/tools`) |

## A host's side, end to end

```tsx
import { useState } from 'react';
import type { Adapter, Board, ResolvedBinding } from '@iyulab/u-board/domain';
import { isHttpRef, readHttpRef, resolvedReading } from '@iyulab/u-board/picture';
import { BoardView, type BoardInput } from '@iyulab/u-board/viewer';

// 1. Your data. An adapter turns a reference in your system into a value and how current it is — and, if you like, a note
//    on where the value came from (`meta`), which the viewer shows in the part's tooltip.
const ANSWERS: Record<string, unknown> = {
  '/lines/L1/pumps': { value: [{ id: 'P1', state: 'run' }, { id: 'P2', state: 'trip' }] },
  '/lines/L2/pumps': { value: [{ id: 'P3', state: 'run' }] },
};

export const plant: Adapter = {
  id: 'plant',
  async resolve(ref): Promise<ResolvedBinding> {
    const answer = isHttpRef(ref) ? ANSWERS[ref.path] : undefined;
    const reading = isHttpRef(ref) && answer !== undefined ? readHttpRef(answer, ref, Date.now()) : undefined;
    if (!reading?.ok) return { value: undefined, quality: 'disconnected', reason: 'address' };
    return { ...resolvedReading(reading), meta: { source: 'plant historian', calibrated: true } };
  },
};

// 2. A board that reads from it. The `line` variable is a value your app gives the board: the board never asks for it itself.
export const board: Board = {
  variables: { line: { options: ['L1', 'L2'], default: 'L1' } },
  statuses: { running: { tone: 'ok', label: 'Running' }, tripped: { tone: 'alarm', label: 'Tripped' } },
  data: {
    pumps: {
      from: 'plant', path: '/lines/{{$line}}/pumps', list: '/value', key: 'id',
      fields: { state: { state: { run: 'running', trip: 'tripped' } } },
    },
  },
  parts: { pump: { as: 'status-card', each: 'pumps', title: 'Pump {{key}}', show: ['state'] } },
  layout: { kind: 'grid', items: ['pump'] },
};

// 3. Draw it in your app, at the values your app chooses. The board is drawn again when a value changes; what a person does on it
//    comes back to you as calls, and nothing is written anywhere by the viewer.
const adapters = [plant];

export function LineView() {
  const [line, setLine] = useState('L1');
  const [heard, setHeard] = useState<string[]>([]);
  return (
    <>
      <button onClick={() => setLine(line === 'L1' ? 'L2' : 'L1')}>Line {line}</button>
      <div style={{ height: 480 }}>
        <BoardView
          board={board}
          adapters={adapters}
          variables={{ line }}
          onTrigger={event => setHeard(list => [...list, `event ${event.name}`])}
          onInput={(input: BoardInput) => setHeard(list => [...list, `input ${input.type} in ${input.part}`])}
        />
      </div>
      <p role="status">{heard.length > 0 ? heard[heard.length - 1] : 'nothing has happened on the board yet'}</p>
    </>
  );
}
```

- **The adapter** is the only place your system is named. It answers with the value and how current it is (`live`, `stale`,
  `disconnected`); `meta` is an optional note — where the value came from, whether it was read or worked out — that the viewer
  shows in the part's tooltip. The board does not read it, and a server you put in front of a public page should not pass it on.
- **The board** names no system: `from: 'plant'` selects your adapter, and what a part shows is a field of what it reads.
  Changing the board never changes your code, and the other way round.
- **`variables`** are values your app gives the board — a line, a shift, a day (`kind: 'date'` for one no list names). The board is
  drawn again when they change; a value the board does not accept is read as the variable's default.
- **`onTrigger` and `onInput`** are how the board talks back. A trigger tells you an event happened on a part (a click, a status
  change); `onInput` tells you what a person typed into an input widget of a picture you draw yourself, and the value a script element of a board raised (`ub.emit(name, value)`). Whether to ask for a
  confirmation, where the values go and who may send them are yours: the viewer writes to no system the board reads.
- **Pass the same `board` object until the board changes**, and the same `adapters`: each new one is drawn again.

## Letting an assistant draw boards

An assistant reads and changes boards through tools — `get_board`, `patch_board`, `validate`, `describe` and the rest — that check every
change as a server would. `@iyulab/u-board-mcp/tools` hands your app those tools to give your own model, and `DocumentBoardStore` keeps
the board in your app: it calls your `save` before it says "saved", and undoes the change if `save` rejects. Your chat panel, your model
and your key stay yours; see [In your own app](../packages/mcp/README.md#in-your-own-app).

The loop closes where you hold the board: when `save` resolves, give `BoardView` the saved document, and people who only read it see
what the assistant drew.

## Who may do what

The library has no accounts. A board's reader sees what your adapters give, so serve a public page from adapters that answer for the
public: leave out the words an adapter keeps for whoever fixes the data source (`message`), and the notes beside a value (`meta`).
Whoever may call `save` may change the board; put your own permission check in front of it, and in front of anything you do in
`onInput`.

## Large boards

A canvas with thousands of parts is met as far as the view has reached: past 500 parts the viewer leaves out those well outside the
view and builds them again as the view nears (`cullParts` changes that). A smaller board is whole in the page, for a screen reader and
the Tab key.

## What it does not do

It has no chat panel, no accounts, no storage and no model. It does not write to the systems a board reads — a command toward one
goes only through an action its data source declares, behind your permission, confirmation and audit ([scope](scope.md)).
