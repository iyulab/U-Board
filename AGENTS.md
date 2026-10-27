# Agent instructions

## Principles

See [`docs/principles.md`](docs/principles.md). The editor/renderer separation principle is
non-negotiable — do not propose or accept a change that makes the renderer depend on the
authoring tool's runtime.

## Non-goals

See [`docs/scope.md`](docs/scope.md). Do not implement a full 3D exploration view, business-logic
features that belong to the systems U-Board displays data from, or data storage/ownership inside
U-Board itself, without first raising it as a scope change.

## Current state

The [README](README.md) is the single description of what is here; keep it current rather than restating it here.

## Releasing

The library, `packages/core`, is published as `@iyulab/u-board` on npm. To release it, change `version` in
`packages/core/package.json` (semver; while the version is 0.x, a minor bump may break the public API), rename
`## [Unreleased]` in `packages/core/CHANGELOG.md` to that version and date, and push the change to `main`. The
`publish` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs after `verify` (`npm run check`) passes and
publishes with provenance if that version is not on the registry yet — a prerelease version under the `next` dist-tag;
on any other push it publishes nothing. Do not run `npm publish` by hand — a hand-published tarball has no provenance
and skips the checks.

`packages/core/scripts/prepack.mjs` rebuilds the build output from clean and copies the repository `LICENSE` into the
package on every pack. Before a release that changes the entry points or dependencies, check the tarball with
`npm pack --dry-run --workspace=packages/core`.

## Open, not yet decided

- A board is written in one language (`packages/core/src/board/` — types, validator, schema, and `picture.ts`, which
  draws a board as the picture the renderer reads). There is one format: a board does not name a version of the
  language, and no other document format is read or stored. The picture (`view-document.ts`, the `./picture` entry)
  is the renderer's model, made from a board — never written, stored or accepted as input. Code that reads a picture
  narrows on `kind`, a grid item on `isCanvasItem`, and code that walks every widget uses `placedIn` (`placedAt` for
  its path). Both view kinds — canvas and grid, with a canvas or a grid in a grid cell — are built; no other kind is
  planned.

## Documentation split

This repository carries only `docs/` — refined documentation that must always match the current
state of the project. Present tense, no dates, no unresolved questions, no draft/tentative
language.

Development tracking — decisions in progress, a roadmap with dates, open questions, planning
notes — does **not** live in this repository. If you find this repository checked out as a
submodule inside a larger workspace, that tracking lives in that workspace's own tracking
directory, not here. If you're working on this repository standalone and need to record
in-progress reasoning, do not put it in `docs/` — ask where it belongs before inventing a new
location.

**Judgment question for any sentence you're about to add**: if this turns out wrong in six
months, is that a bug (fix it — it belongs in `docs/`) or just an old record of a decision (it
does not belong in this repository at all)?
