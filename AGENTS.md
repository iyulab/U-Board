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
private applications, and the introduction site) is described there too.

## Releasing

Two things are released, each under its own version. The library, `packages/core`, is published as
`@iyulab/u-board` on npm. The product — the `server`, `console` and `share` applications in one
container image — is released at the version in `packages/server/package.json`. The four other
workspaces (`site` is the introduction site) stay `private` on npm.

To release the product, change `version` in `packages/server/package.json`, give that version its
section in the root `CHANGELOG.md` (the release notes are made from it), and push the change to
`main`. The `image` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs after `verify` and, if that
version has no GitHub release yet, pushes the image to `ghcr.io/iyulab/u-board` under the version,
attests it, moves `<major>.<minor>` and `latest` onto it where it is the newest, and creates the
release `v<version>` with the image as a `docker save` archive and its checksum. A version's tag is
pushed once: if the job fails after that, re-run that workflow run — or, when GitHub will not retry
it, run the CI workflow on `main` by hand (`workflow_dispatch`) — and it releases the image already
in the registry. A later commit carrying the same unreleased version is refused rather than released as
an image it did not build; give it a new version. `npm run release:image` builds the same image and release files locally without
pushing anything.

To release the library, change `version` in `packages/core/package.json` (semver; while the version is 0.x, a
minor bump may break the public API), rename `## [Unreleased]` in `packages/core/CHANGELOG.md` to that
version and date (a tooling test fails on a version without its section), and push the change to `main`. The `publish` job in
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs after `verify` (`npm run check`) passes and publishes
with provenance if that version is not on the registry yet — a prerelease version under the `next`
dist-tag; on any other push it publishes nothing. Do not run
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
