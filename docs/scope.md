# Scope

## In

- Authoring a spatial canvas view: a background (an image, or none), nodes positioned either
  anchored to real coordinates or freely arranged, connectors between nodes, purely-visual
  decorations (labeled frames expressing structure), and widgets bound to live data
- A web-based viewer that renders an authored view standalone or embedded in another application
- An author-first editing experience
- Architectural separation between the authoring tool and the rendering runtime
- An extensible view-kind structure, so new kinds of view can be added without redesigning
  existing ones
- Binding to external data sources without owning or storing the underlying data

## Out

- A full 3D spatial exploration view (rotate, zoom, change viewpoint) — this is the domain of a
  dedicated component, not the core canvas
- Reimplementing the functionality of a business system (ERP, MES, CMMS, QMS, or similar) — a
  view built with U-Board displays and interacts with such systems, it does not replace them
- Owning or storing domain data — a view's layout is U-Board's, the values shown in it belong to
  whatever system they came from
- An automatic-layout, grid-based view kind (the kind of view a general BI tool builds) — not
  part of the initial view-kind set
- Chrome that stays fixed to the viewport rather than the canvas (an alert banner, a KPI list, a
  trend chart that should stay in place while the user pans or zooms) — a node's position is
  always relative to the canvas, not the viewport. Placing such chrome is the host application's
  layout responsibility, composed around the U-Board viewer rather than expressed inside it
