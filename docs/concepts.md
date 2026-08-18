# Concepts

**View** — the unit an author creates and a viewer opens. A view has a kind, which determines
what it can contain and how it's authored.

**Kind** — the authoring/rendering mode a view is created as. The canvas view is the first kind.
Different kinds have different capabilities; a view does not mix kinds.

**Background** — the media (an image, or none) a canvas view is drawn over. The system does not
attach domain meaning to a background — what it depicts is left to the author's and viewer's
interpretation.

**Node** — a positioned point in a canvas view that carries a widget. A node can be anchored to a
fixed coordinate or placed without an anchor.

**Connector** — a line drawn between two nodes, used when the relationship between them needs to
be shown (for example, a network link).

**Widget** — the visual content a node displays (a chart, a status indicator, a numeric value,
and so on). Widget rendering is provided by an external library the view consumes, not by the
canvas layer itself.

**Binding** — a reference from a widget to a value in an external system. U-Board reads through a
binding; it does not store the value it resolves to.

**Adapter** — a pluggable package that resolves bindings against one specific external system. The
core binding surface is generic; system-specific knowledge lives in an adapter, not in the core.

**Editor / Renderer** — the two halves of the system. The editor authors a view document; the
renderer displays one. They do not share a runtime.

**Anchor** — a fixed coordinate a node is placed at, used when the background represents real
space that the position should correspond to.

**View document** — the saved output of authoring a view: layout, bindings, and widget
references, in a format the renderer can read without the editor present.
