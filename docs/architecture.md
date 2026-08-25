# Architecture

> This document describes structure. It does not track implementation progress.

## Layers

```
Authoring tool  →  View document (spec)  →  Renderer
```

The authoring tool and the renderer are separate components connected only by the view document
they exchange. The renderer never depends on the authoring tool; it only reads the document
format. This is the direct expression of the editor/renderer separation principle
(see [`principles.md`](principles.md)).

## View kinds

A view is authored as one specific kind. The first kind is the **canvas view**: a background, a
set of positioned nodes, optional connectors between them, optional purely-visual decorations, and
widgets bound to data. Each kind owns its own authoring surface; a kind added later does not
require changing kinds that already exist.

## Canvas view composition

Within a canvas view, three concerns are kept separate:

- **Background** — an image, or none. The system does not interpret what the image depicts.
- **Layout** — where nodes sit. A node can be anchored to a fixed position (typical when the
  background represents real space) or placed freely with no anchor (typical for a diagram with
  no real-space background). Connectors between nodes are part of layout.
- **Widget content** — what a node displays. Widget rendering is not implemented by U-Board
  itself; it is delegated to [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets), a
  declarative, data-driven widget library. U-Board's own scope is the spatial layer around those
  widgets — positioning, background, and connectors — not the widgets' internal rendering.

## Data binding and adapters

A widget's content is driven by a binding: a reference to a value in an external system. U-Board
does not own or store the values it displays — a binding is read-only from U-Board's side, and
the view document stores only the binding reference, not the value itself.

A binding resolves through an adapter — an integration package that knows how to read values from
one specific external system. The core binding surface is generic; adapters for specific systems
are separate, pluggable packages, not part of the core. This keeps U-Board usable standalone
against any data source, with no host platform assumed by the core.

## Deployment

The viewer runs in a standard web browser and can be embedded in another web application.
