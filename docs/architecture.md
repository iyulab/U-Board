# Architecture

> This document describes structure. It does not track implementation progress.

## Layers

```
Authoring tool  →  Board (spec)  →  Renderer
```

The authoring tool and the renderer are separate components connected only by the board they
exchange. The renderer never depends on the authoring tool; it only reads the board language — it
draws a board through its **picture**, the widgets with their places and bindings that one domain
function (`pictureOf`) makes of the board and the items its lists have now. This is the direct expression of the editor/renderer separation principle
(see [`principles.md`](principles.md)).

## View kinds

A board's layout is of one kind. A **canvas** places parts by coordinates over a background, with
purely-visual shapes and links between parts. A **grid** lays parts out in order, each taking a span of
a 12-column row — the layout of an ordinary dashboard — and a grid cell can hold a canvas of its own.
Both place the same parts, so data, statuses, connection quality and attribution are the same in
either; each kind owns its own layout record, renderer and authoring surface, and a kind added later
does not require changing kinds that already exist.

## What a board is made of

The board language keeps apart what is often tangled together:

- **Data** — where values come from and what they mean: a read, named once, and its fields' labels,
  units and states. Parts name a read or one item of it; they never carry a value or its meaning
  themselves.
- **Parts** — what is shown, of which data, with which fields — never where.
- **Layout** — where the parts go, per view kind. Coordinates appear only in a canvas layout.
- **Statuses and look** — declared once for the board: the tone and words of each status, the fonts,
  palette and frame. No part sets colours or fonts.
- **Background** — an image, or none. The system does not interpret what the image depicts.
- **Widget content** — what a part displays. A built-in's rendering is not implemented by U-Board
  itself; it is delegated to [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets), a
  declarative, data-driven widget library. U-Board's own scope is the spatial layer around those
  widgets — positioning, background, and links — not the widgets' internal rendering. What no
  built-in draws, a board defines as an **element** — markup and CSS, or a script — and the renderer
  hosts it under the element contract: a template in an isolated root of the page, a script in a
  sandboxed frame its server builds, with no network. U-Board hosts elements; it does not grow a
  catalog of widgets of its own ([`concepts.md`](concepts.md) — Element).

## Data binding and adapters

A part's content is driven by a data read: a reference to values in an external system. U-Board
does not own or store the values it displays — a read is read-only from U-Board's side, and
the board stores only the reference, not the value itself.

A read resolves through an adapter — an integration package that knows how to read values from
one specific external system. The core binding surface is generic; adapters for specific systems
are separate, pluggable packages, not part of the core. This keeps U-Board usable standalone
against any data source, with no host platform assumed by the core.

A read only reads. Nothing a board does writes to the system it reads through that read.

## Definition, data and state

What a viewer draws comes from three things kept apart. The **definition** — the board — is what its authors
wrote: data reads and what their fields mean, parts, layout, statuses and triggers. The **data** stays in the systems it
belongs to; U-Board reads it through bindings and keeps none of it. The **board state** is what the board makes of the
data now — each part’s state and connection quality — computed from the other two by one function (`boardStateOf`, on the board's picture),
the same in a viewer and on a server, and published beside the definition, never written into it. A view is drawn from
all three; what one person does in their own view (selecting, zooming) belongs to that view alone.

## Connection-quality visualization

A part can carry several bindings at once. The shipped renderer frames the part by the worst
connection quality among them (ISA-18.2 alarm-precedence convention — the least-current binding
governs the indicator), using a distinct border *style* per abnormal state (not just color), so
the two are still distinguishable without relying on color perception or a hover tooltip. `live`
is left unstyled — color is reserved for the abnormal states, not spent on normal operation.

The frame's title (and, for assistive technology, an accompanying live-region announcement) names
the cause. When only one binding is at fault, that binding's own state is enough. When more than
one is, the summary is broken out per bound prop path — so a binding that plays no part in what
the widget actually displays cannot mark an otherwise-live widget's cause of trouble unclear.
When an adapter reports *why* a binding is not live (source unreachable, credentials refused, bound
value not found at the source, rate limited), the title and announcement carry that too. The cause
is text only: it changes who needs to act, not how urgent the state is, so it adds no frame style.

## Deployment

The viewer runs in a standard web browser and can be embedded in another web application.

The hosted applications — the server, the console and the share viewer — ship as one container
image that serves them from one origin: the API under `/api`, the share viewer under `/share/`,
and the console at every other path. A hosted installation and a self-hosted one run the same
image; [`self-hosting.md`](self-hosting.md) covers running it. A host application that only needs
the library uses `@iyulab/u-board` instead and runs none of them.
