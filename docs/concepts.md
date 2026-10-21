# Concepts

> For exact types, method signatures, and a runnable example, see
> [`api-reference.md`](api-reference.md).

**View** — the unit an author creates and a viewer opens. A view has a kind, which determines
what it can contain and how it's authored.

**Kind** — the authoring/rendering mode a view is created as: a **canvas view** places widgets by
position over a background, a **grid view** lays them out in order. Different kinds have different
capabilities; a view is of one kind — a grid's cell may hold a canvas (see **Composition**), but the
view is still a grid. Both carry widgets the same way — an id and a widget — so
bindings, data quality and the property panel are shared; only how a widget is placed differs. The
viewer shows both kinds and the editor edits both: a canvas by dragging nodes over the background, a
grid as its items in order — added after the one selected, moved earlier or later, each given its
widths and height — with the layout seen at a wide, medium or narrow width.

**Grid view** — widgets in order, left to right and then top to bottom, in rows of 12 columns. Each
**grid item** takes a span of columns (4 when left out), optionally a different span where the
board is narrower, optionally a number of rows it spans (`rowSpan` — a map or large panel beside a column of
smaller cards, which the items after it fill in order; from medium width up), and optionally a fixed height —
otherwise the widget's own. There is no position:
the same document reads at any width, and where an item goes follows from the ones before it.
The width that counts is the board's own — the container it is shown in, not the window: one item
per row below 600 pixels, 6 columns (each item's medium span) below 1024, 12 above. A row is as
tall as its tallest item, and each item sits on a cell of its own with its data quality marked as
a canvas node's is. A grid has no pan or zoom; it scrolls when it is taller than its container.

**Composition** — a grid item may hold a **canvas** instead of a widget: a background, nodes on it,
connectors between them and decorations — the spatial panel of a mixed board, with the cards around it
laid out by the grid. The canvas lives in the same document (one share link, one revision), and only
its spatial layer does: the board's elements, symbols and triggers stay on the board, and every id —
of an item, or of a node, connector or decoration in any cell — is unique in the document, so a
trigger names a cell's node as it names an item. A connector joins two nodes of the same cell. The
canvas is drawn fitted to its cell; without a `height` the cell keeps the canvas's proportions. It pans
and zooms within its cell — drag, the keys and its zoom buttons — while the wheel scrolls the grid past
it, zooming only with Ctrl (⌘) held. In the editor, **Add canvas** adds one and **Edit canvas** opens
it in the canvas editor — what the board defines once is edited there for the whole board.

**Background** — the media (an image, or none) a canvas view is drawn over. The system does not
attach domain meaning to a background — what it depicts is left to the author's and viewer's
interpretation.

**Appearance** — the board's tone: `light` (the default) or `dark`. It is set by the author to
match the background — a dark drawing, or a dark board with none — and the board's paper and the
widgets on it follow it, so their text reads against the background. Like the background it says
nothing about what the board depicts, and it does not follow the viewer's theme: the board looks
the same to everyone who opens it.

**Node** — a positioned point in a canvas view that carries a widget. A node can be anchored to a
fixed coordinate or placed without an anchor. It has a box (`width` × `height`; left out, the `size` of the element it places, else 160 × 100 — `nodeSize` and `DEFAULT_NODE_WIDTH` × `DEFAULT_NODE_HEIGHT` in `@iyulab/u-board/domain`) and may have a `caption` — a name drawn under the box, outside it, so the box can stay the size of an icon while its name is as long as it needs; its widget is
drawn inside that box, fitted to it: a chart fills it — compactly when the box is small — a gauge or
an image scales down, and a table or a list scrolls within it. The box the author drew is what the
board shows; a widget never spills over a neighbouring node.

**Connector** — a line drawn between two nodes, used when the relationship between them needs to
be shown (for example, a network link). It runs from the edge of one node's box to the edge of the other's;
it may carry a `label` (shown at its middle, or where `labelAt` says from 0 at the `fromNodeId` end to 1 at the
`toNodeId` end — a link's throughput; `labelSize` sets its font size in scene units, 11 when left out, for a board
drawn large such as a kiosk) and a `style` (`stroke`, `strokeWidth`, `dash`: `solid`, `dashed` or `dotted`,
`arrow`: `none`, `end` — pointing at `toNodeId` —, `start` or `both`; `route`: `straight`, `orthogonal` — out of the
side facing the other node, one right-angle turn at the middle of the gap, into the other's facing side, as pipes and
wiring are drawn — or `curved`, bowing to the left of the way it runs from `fromNodeId` toward `toNodeId`, as flows on a
map are drawn, so two connectors running opposite ways between the same nodes bow apart). Connectors joining the same two nodes are drawn side by side. Its label and style can be **bound** like a widget's props (`bindings` on `label`, `style.stroke`,
`style.strokeWidth`, `style.dash`, `style.arrow`) — a link's throughput as its label, its load as its width, which way
power flows by its sign (a value map from ranges to arrows); a label not showing a current value is rimmed amber
(stale) or grey (disconnected).

**Decoration** — a purely visual shape (a rectangle or a text label) placed on a canvas view to
express structure — grouping related nodes inside a labeled frame, for example. A frame can carry
its own name (`label`, placed inside it by `labelAt`), rounded corners (`radius`) and a line style
(`dash`); a text is placed by the point of it its position names (`anchor`) and can sit on a
`background`. A decoration carries no widget and no binding; like a background, the system does
not interpret what it depicts.

**Accent** — a board's own primary colour (`accent`), which its widgets and elements fill and
highlight with in place of the theme's: a brand colour set once for the board rather than in each
widget.

**Widget** — the visual content a node displays (a chart, a status indicator, a numeric value,
and so on). A prepared widget is rendered by an external library the view consumes, not by the
canvas layer itself; an element is one the board defines itself.

**Element** — what a board draws when no prepared widget does: a plant symbol, a custom gauge, a
tank's level. The board defines it once, by name, and places it on any number of nodes or grid
items as a widget of type `element:<name>`, each with its own props — bound like any widget's. A
**template element** is HTML or SVG markup with `{{prop}}` values and its own CSS, drawn in an
isolated part of the page: its CSS reaches only its own markup, the page's does not reach in, and
only the board's theme passes through (`--u-widget-*` CSS variables — the colours the prepared widgets use). Its
root fills the element's box, and every size in it includes its padding and border (`box-sizing: border-box`), so
`height: 100%` with padding still fits.
A board's **symbols** — SVG drawings it defines once, by name — reach every template element that places
one with `<use href="#name">`, so a plant's symbol set is drawn the same everywhere — its parts' own look written in
the symbol (`fill="none"`, `stroke="currentColor"`): a `<use>` draws its symbol in a tree of its own, which the
element's CSS selectors do not reach, so only what the parts inherit (colour, stroke, CSS variables) comes from
around the `<use>`. It runs no script. A **script element** runs code in a sandboxed frame that cannot reach the page,
the viewer's session or the network. An element loads nothing from another origin unless it
declares the origin and the host allows it. Its definition describes its props as a JSON Schema,
so a tool — or an AI — writing a board knows what it takes.

**Component** — a group of parts a canvas board draws more than once: a machine card of a frame, three widgets and
the line between two of them, drawn for each of twenty machines. The board defines it once, by name (`components`) —
its nodes, connectors between them and decorations, placed from its own origin — and an **instance** (`instances`)
draws it at a point with a value for each **parameter** it declares. In any text of its parts, `{{name}}` stands for
a parameter’s value — inside a binding’s `ref` as much as in a label — so the twenty cards read twenty machines. The
board keeps the component, not copies: a change to the definition reaches every instance. Each part an instance draws
has the id `<instance id>/<part id>`, by which a connector of the board, a trigger or the board state names it. The
values come only from the instances the board lists, so a share link reads what the definition names and nothing a
viewer chooses. An element is drawn inside its node; a component’s parts take part in the layout and the lines like
the board’s own.

**Binding** — a reference from a widget to a value in an external system. U-Board reads through a
binding; it does not store the value it resolves to. A resolved binding carries a connection
quality alongside its value — `live` (the adapter reached the source just now), `stale` (the
value shown is not current: the adapter couldn't reach the source and shows the last-known value, or
the source's latest value is older than the binding expects of it), or `disconnected` (no value has
been reached) — and, when the adapter can tell, the reason it is not live (the source unreachable,
credentials refused, the bound value not found at the source, an answer it cannot read, rate
limiting, or the source behind on its own updates). A binding can also translate the value it reads into the one its widget takes —
the source's own words (`Fault`) or numbers (a temperature) into a status level — by exact values
and numeric ranges the author sets; U-Board attaches no meaning to either side of that table.
This is deliberately narrower than a full alarm
model (priority, acknowledgement, shelving) — that belongs to the system a binding points at, not
to the binding surface itself.

**State** — a name a part (a node or a grid item) is in, read from one of its widget’s bindings: the source’s value
looked up in the part’s `states` map (`"Fault"` → `fault`, 80 or more → `hot`). Each state may have a look — a ring of
colour around the part, blinking, or the part hidden — drawn around it, so the frame’s connection-quality border stays
readable. A state comes from the current reading alone: it remembers nothing, so a delay (“over the limit for five
minutes”) or a latch is not a state.

**Board state** — what a board shows now, part by part: each part’s state, the worst connection quality of its bindings
and why, and how old its data is — no values. It is published beside the board’s definition and never written into it:
a viewer hands it to its host (`onBoardState`), a U-Board server answers it on request, and an assistant reads it with
`board_state`. It says when it was computed; a state nobody has computed lately says nothing about now.

**Trigger** — what a board does when something happens on it, in a viewer: `on` an event (a part clicked, an event an
element raises, a part entering or leaving a state, the board opened), only `when` a part is in a given state if the
trigger says so, `do` its actions in order — open a link, bring a part into view, hand the page the board is on an event,
or ask that page to show another board. Triggers only show, move and tell: nothing a trigger does writes to the systems a
board reads. Each trigger fires at most once a second, so a value hovering at a range’s edge cannot drive it without end.
An editor runs none while editing — a click there selects.

**Adapter** — a pluggable package that resolves bindings against one specific external system. The
core binding surface is generic; system-specific knowledge lives in an adapter, not in the core.

**Editor / Renderer** — the two halves of the system. The editor authors a view document; the
renderer displays one. They do not share a runtime.

**Anchor** — a fixed coordinate a node is placed at, used when the background represents real
space that the position should correspond to. A background that declares two of its points and the
coordinates they stand for makes each anchored node's place a coordinate — the center of its box, read
through those points.

**View document** — the saved output of authoring a view: layout, bindings, and widget
references, in a format the renderer can read without the editor present.
