# Concepts

> For exact types, signatures, and a runnable example, see [`api-reference.md`](api-reference.md).

**Board** — the unit an author creates and a viewer opens: one JSON document in the board language. It says where its
values come from and what they mean (**data**), what it shows (**parts**) and where (**layout**), and declares its
statuses and its look once. Everything a person picks is addressed by id within its own map, and there is one way to
write each thing. A board is what is written, stored, versioned and shared; the editor, the viewer, the server and an
AI assistant all read and write the same document.

**Data** — a read from a system U-Board does not own, named once and read once for every part that shows it: a request
to an HTTP connector (`path`), or a reference an adapter of the host's defines (`ref`). It may hold a list of items, one
of which a part names by its key (`pumps[P1]`). Data stays as the source sends it; what a value means — its label, unit,
digits, the words it is shown as, and its **state** — is said in the read's **fields**. U-Board reads through a data read;
it never stores the value. A value carries its connection quality — `live` (the source was reached just now), `stale`
(the value shown is not current: the source could not be reached and the last-known value is shown, or the source's
latest value is older than the read expects of it), or `disconnected` (no value has been reached) — and, when the
adapter can tell, the reason it is not live: the source unreachable, credentials refused, the value not found at the
source, an answer it cannot read, rate limiting, or the source behind on its own updates. This is deliberately narrower
than a full alarm model (priority, acknowledgement, shelving) — that belongs to the system a board reads, not to the
board.

**State and status** — how a value is doing, as a name: a field's `state` maps its raw values (`"trip"`) or bands of
numbers (from 80 up) to one of the board's **statuses** (`down`). A status is declared once for the board — the tone it
is drawn in (one of eleven: `ok`, `info`, `watch`, `warn`, `alarm`, `off`, `idle`, `accent`, and `past`, `now`, `next`
for places in a sequence), its words, a mark, and an emphasis that adds a second channel besides colour — and everything
that shows the field takes it: a status card, a stat list, a link's colour, a marker. A state comes from the current
reading alone: it remembers nothing, so a delay ("over the limit for five minutes") or a latch is not a state.

**Part** — what is shown, of which data, with which fields — never where. Its kind (`as`) is a built-in drawn by the
widget library ([`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets) — a status card, a stat, a list, a table, a
gauge, a chart …), one of the board's own (a marker, a label, a legend, a group), or an element the board defines. A
**preset** holds settings parts share; `each` makes one part per item of a list, with the ids `<part>/<key>`. A **group**
draws several parts together on a small canvas of its own — a pump's card, level and valve — its parts addressed
`<group>/<part>`.

**Layout** — where the parts go, per view kind. A **canvas** places parts by coordinates over a drawing of a fixed size:
an optional **background** image, **shapes** (a labelled box, a text, a line, a path) that are purely visual, and
**links** between two parts — a line that can carry a field's status as its colour and form, a label from a field, and a
width from an amount. A **grid** lays parts out in order on rows of twelve columns, each taking a span, reflowing to the
width of the board's own container (one item per row below 600 pixels, six columns below 1024, twelve above); a grid
cell can hold a canvas of its own — the spatial panel of a mixed board, the cards around it — or a grid that stacks
what it holds. Both kinds place the same parts the same way, so data, statuses and the panels that set a part are
shared; only where a part goes differs.

**Background** — the image a canvas is drawn over, or none. The system does not attach domain meaning to a background —
whether it depicts a floor plan, a map or a diagram is left to the author's and viewer's interpretation.

**Look** — the board's `theme` (light, the default, or dark — set to match the background, not the viewer's theme: the
board looks the same to everyone who opens it), its `accent` colour, and its **skin**: fonts, a palette and the frame a
part is drawn in, said once for the board. No part sets fonts or colours of its own.

**Element** — what a board draws when no built-in does: a plant symbol, a custom gauge, a tank's level. The board
defines it once, by name, and places it with parts `as: "element"`, each binding its props to fields of what it reads.
A **template element** is HTML or SVG markup with `{{prop}}` holes and its own CSS, drawn in an isolated part of the
page: its CSS reaches only its own markup, the page's does not reach in, and only the board's theme passes through
(`--u-widget-*` CSS variables). Nothing is computed inside the holes — numbers become a drawing through CSS `calc()` —
and it runs no script. A **script element** runs code in a sandboxed frame that cannot reach the page, the viewer's
session or the network; its props arrive as messages. An element loads nothing from another origin unless it declares
the origin and the host allows it. A board's **symbols** — SVG drawings defined once — are drawn by markers and by any
template element that places one.

**Trigger** — what a board does when something happens on it, in a viewer: `on` an event (a part clicked, an event an
element raises, a part entering or leaving a status, the board opened), only `when` a part is in a given status if the
trigger says so, `do` its actions in order — open a link, bring a part into view, hand the page the board is on an event,
or ask that page to show another board. Triggers only show, move and tell: nothing a trigger does writes to the systems a
board reads. Each trigger fires at most once a second. An editor runs none while editing — a click there selects.

**Adapter** — what reads a board's data from one external system. The core reading surface is generic; system-specific
knowledge lives in an adapter, not in the core. The hosted server's HTTP connector is one; a host application gives the
viewer its own.

**Picture** — the board drawn: its parts turned into widgets with their places and bindings, the model the renderer
draws from. Nobody writes one — it is made from the board and the items its lists have now. A server computes a board's
state on it, and an assistant looks at it.

**Board state** — what a board shows now, part by part: each part's status, the worst connection quality of its data
and why, and how old its data is — no values. It is published beside the board and never written into it: a viewer hands
it to its host, a U-Board server answers it on request, and an assistant reads it with `board_state`. It says when it
was computed; a state nobody has computed lately says nothing about now.

**Editor / Renderer** — the two halves of the system. The editor authors a board; the renderer displays one. They do not
share a runtime.
