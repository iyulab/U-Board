# Scope

## In

- Authoring a spatial canvas view: a background (an image, or none), parts placed by coordinates on it, links
  between parts, purely-visual shapes (labelled boxes, texts and lines expressing structure), and parts that show
  live data
- A web-based viewer that renders an authored view standalone or embedded in another application
- An author-first editing experience
- Architectural separation between the authoring tool and the rendering runtime
- An extensible view-kind structure, so new kinds of view can be added without redesigning
  existing ones — the canvas kind, and a grid kind for ordinary dashboards (widgets laid out by
  order, span and screen width), sharing parts, data and statuses
- Elements a board defines itself, beyond the prepared widgets: templates of HTML or SVG and CSS
  drawn in isolation, and scripts run in a sandboxed frame with no network — hosted by the renderer
  under one contract, so a board can draw what no widget does without U-Board growing a widget
  catalog of its own
- An engine programs can drive: workspace API tokens, partial changes to a board (JSON Patch on a
  revision), a published board schema, and an MCP server through which an AI assistant reads and
  draws boards
- Binding to external data sources without owning or storing the underlying data
- A board that responds to what it shows: parts whose state follows conditions on their values,
  interactions that open a link, move to another board or notify the host application, alerts raised
  when a condition holds, and commands sent to an external system — only through actions its data
  source declares, behind permission, confirmation and an audit record, never through a binding
- A board's current state published beside its definition, in a public format, so a program can watch
  the state rather than the picture
- Components: parts of a board defined once, with declared parameters, and placed many times

## Out

- A full 3D spatial exploration view (rotate, zoom, change viewpoint) — this is the domain of a
  dedicated component, not the core canvas
- Reimplementing the functionality of a business system (ERP, MES, CMMS, QMS, or similar) — a
  view built with U-Board displays and interacts with such systems, it does not replace them
- AI inside the engine — it runs no model and holds no assistant; an assistant draws with it from the
  outside, through its MCP server, as the person whose token it uses. A demo chat builder ships as one
  such outside consumer: it uses the same tools, against a model endpoint its user supplies
- Owning or storing domain data — a view's layout is U-Board's, the values shown in it belong to
  whatever system they came from. A board's state holds values only while they are current; what it
  keeps is derived from them (state names, connection quality, when a state began)
- Chrome that stays fixed to the viewport rather than the canvas (an alert banner, a KPI list, a
  trend chart that should stay in place while the user pans or zooms) — a part's position on a canvas is
  always relative to the canvas, not the viewport. Placing such chrome is the host application's
  layout responsibility, composed around the U-Board viewer rather than expressed inside it
