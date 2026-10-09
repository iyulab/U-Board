# Concepts

> For exact types, method signatures, and a runnable example, see
> [`api-reference.md`](api-reference.md).

**View** — the unit an author creates and a viewer opens. A view has a kind, which determines
what it can contain and how it's authored.

**Kind** — the authoring/rendering mode a view is created as. The canvas view is the first kind.
Different kinds have different capabilities; a view does not mix kinds.

**Background** — the media (an image, or none) a canvas view is drawn over. The system does not
attach domain meaning to a background — what it depicts is left to the author's and viewer's
interpretation.

**Appearance** — the board's tone: `light` (the default) or `dark`. It is set by the author to
match the background — a dark drawing, or a dark board with none — and the board's paper and the
widgets on it follow it, so their text reads against the background. Like the background it says
nothing about what the board depicts, and it does not follow the viewer's theme: the board looks
the same to everyone who opens it.

**Node** — a positioned point in a canvas view that carries a widget. A node can be anchored to a
fixed coordinate or placed without an anchor. It has a box (`width` × `height`, a default size when left out), and its widget is
drawn inside that box, fitted to it: a chart fills it — compactly when the box is small — a gauge or
an image scales down, and a table or a list scrolls within it. The box the author drew is what the
board shows; a widget never spills over a neighbouring node.

**Connector** — a line drawn between two nodes, used when the relationship between them needs to
be shown (for example, a network link).

**Decoration** — a purely visual shape (a rectangle or a text label) placed on a canvas view to
express structure — grouping related nodes inside a labeled frame, for example. A decoration
carries no widget and no binding; like a background, the system does not interpret what it
depicts.

**Widget** — the visual content a node displays (a chart, a status indicator, a numeric value,
and so on). Widget rendering is provided by an external library the view consumes, not by the
canvas layer itself.

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
