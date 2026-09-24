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

The Status section of the [README](README.md) is the single description of what is implemented;
keep it current rather than restating it here. The repository layout (one published library, three
private applications) is described there too.

## Releasing

Only `packages/core` is published, as `@iyulab/u-board` on npm. The `server`, `console` and `share`
workspaces are applications and stay `private`.

To release, change `version` in `packages/core/package.json` (semver; while the version is 0.x, a
minor bump may break the public API) and push the change to `main`. The `publish` job in
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs after `verify` passes and publishes
with provenance if that version is not on the registry yet; on any other push it publishes
nothing. Do not run
`npm publish` by hand — a hand-published tarball has no provenance and skips the checks.

`packages/core/scripts/prepack.mjs` rebuilds `dist/lib` from clean and copies the repository
`LICENSE` into the package on every pack. Before a release that changes the entry points or
dependencies, check the tarball with `npm pack --dry-run --workspace=packages/core`.

## Open, not yet decided

- View kinds beyond the canvas view (an automatic-layout grid kind, and any future kind) are not
  designed. Do not add one speculatively.
- How the authoring tool is packaged/distributed is not decided. Do not assume a specific
  runtime (browser-only vs. a desktop shell) without checking current guidance.

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
