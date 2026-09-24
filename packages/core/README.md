# @iyulab/u-board

Spatial dashboard authoring middleware — the view document schema, the adapter contract for
binding widgets to external data, and the React authoring and viewing components built on them.

This is the library package of [U-Board](https://github.com/iyulab/U-Board). See the repository
README for what U-Board is for and what it deliberately is not.

## Install

```sh
npm install @iyulab/u-board react react-dom
```

`react` and `react-dom` (19.x) are peer dependencies. The domain entry point below does not use
them at runtime, but npm installs peer dependencies by default.

## Entry points

| Import | Contents | Depends on React / canvas |
|---|---|---|
| `@iyulab/u-board/domain` | View document types, the `Adapter` contract, `resolveDocument`, `parseViewDocument` | No |
| `@iyulab/u-board/viewer` | Read-only `ViewerPage` and the `useResolvedDocument` hook | Yes |
| `@iyulab/u-board` | Everything in `domain`, plus `AuthoringView` and `ViewerPage` | Yes |
| `@iyulab/u-board/demo` | `DemoAdapter`, an adapter that serves fixed sample values | No |

Code that only reads or writes view documents, or implements an adapter for an external system,
should import from `@iyulab/u-board/domain` so it never pulls in the rendering stack.

## Implementing an adapter

An adapter resolves the binding references stored in a view document against a data source U-Board
does not own. The view document stores only the reference; the adapter decides what it means.

```ts
import { resolveDocument, type Adapter, type ViewDocument } from '@iyulab/u-board/domain';

const doc: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
const adapters: Adapter[] = [/* your Adapter implementations */];

const resolved = await resolveDocument(doc, adapters);
```

The full type reference, with examples that are compiled and run as tests, is in
[`docs/api-reference.md`](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md).
Concepts and architecture: [`docs/concepts.md`](https://github.com/iyulab/U-Board/blob/main/docs/concepts.md),
[`docs/architecture.md`](https://github.com/iyulab/U-Board/blob/main/docs/architecture.md).

## Versioning

Pre-1.0: a minor version may change the public API, including the view document format.

## License

Copyright (c) 2026 iyulab.

AGPL-3.0-or-later. A commercial license is available for organizations that cannot adopt AGPL-3.0
terms.
