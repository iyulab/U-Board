# U-Board

Spatial dashboard authoring middleware. Build data-bound views on a canvas — a floor plan, a
network diagram, a map, or a freeform layout — and embed the result anywhere on the web.

## Who this is for

Teams building operational software (asset management, industrial monitoring, facility
operations, and similar domains) who need to embed a live status view — equipment on a floor
plan, a system topology, a site map — without building a spatial canvas renderer from scratch.

U-Board runs standalone against any external data source through its adapter surface — it does
not assume or require a specific host platform.

## What this is not

- Not a general business-intelligence tool. U-Board sits closer to industrial HMI/SCADA
  authoring than to chart-and-pivot-table dashboards.
- Not a full 3D digital-twin engine. Views are 2D/2.5D; a rotating 3D model of a single object
  is out of scope and left to a dedicated component if one is ever needed.
- Not a business application. U-Board does not own or store domain data — it binds to values
  that live in the systems that already own them.

## Status

This project is in early development. The rendering pipeline (canvas-kit + u-widgets), the
authoring UI (add/drag/resize nodes), local save (export/import), and a read-only viewer mode are
implemented and browser-verified. Binding to a real external data source is not yet
implemented — the adapter contract is complete and validated end-to-end against a mock adapter
only.

## Domain layer

The renderer-agnostic core — the view document schema, the adapter contract, and binding
resolution — is available as a package entry point independent of the (not yet built) authoring
UI and canvas rendering pipeline. This package isn't published to a registry yet, so consume it
as a `file:` or workspace dependency:

```json
{ "dependencies": { "@iyulab/u-board": "file:../path/to/U-Board" } }
```

```ts
import { resolveDocument, type ViewDocument, type Adapter } from '@iyulab/u-board';

const doc: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
const adapters: Adapter[] = [/* your Adapter implementations */];

const resolved = await resolveDocument(doc, adapters);
```

`resolveDocument` is the single entry point a renderer calls to turn a saved `ViewDocument` into
something paintable — it has no opinion on canvas-kit, u-widgets, or any other rendering concern.
See [`docs/concepts.md`](docs/concepts.md) for the vocabulary (`ViewDocument`, `Binding`,
`Adapter`) and [`docs/architecture.md`](docs/architecture.md) for how this layer fits the rest of
the system. Run `npm run build:lib` to produce the `dist/lib` output these exports point at.

## Documentation

| Topic | Doc |
|---|---|
| Problem, audience, role | [`docs/overview.md`](docs/overview.md) |
| Design principles and their costs | [`docs/principles.md`](docs/principles.md) |
| What's in scope, what's out | [`docs/scope.md`](docs/scope.md) |
| System structure | [`docs/architecture.md`](docs/architecture.md) |
| Core concepts and terms | [`docs/concepts.md`](docs/concepts.md) |

## License

AGPL-3.0. A commercial license is available for organizations that cannot adopt AGPL-3.0 terms.
See [`LICENSE`](LICENSE).
