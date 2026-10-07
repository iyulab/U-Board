# Contributing to U-Board

Thanks for your interest. Please read this before opening an issue or a pull request.

## Status

U-Board is in early development and the public API is not stable — see the Status section of the
[README](README.md) for what is implemented today. Issues that report bugs, gaps or
inconsistencies are welcome. For anything larger than a small fix, open an issue to agree on scope
before writing code: the architecture has hard boundaries (below) and a pull request that crosses
one will be declined regardless of how well it is written.

## Contributor License Agreement (CLA)

U-Board is dual-licensed: AGPL-3.0 for open-source use, with a separate commercial license
available. Offering a commercial license depends on the project holding clear rights to every
contribution it ships — a contribution whose rights were never granted can keep that file out of
the commercial offering.

**Every external code contribution requires a signed CLA before it can be merged.** The CLA does
not transfer ownership of your contribution; it grants the project the rights needed to distribute
it under both the open-source and the commercial license terms. Signing is a file you add in your
own pull request — no external service, no account. See [`CLA.md`](CLA.md) for the agreement and
the signing steps.

An automated check on each pull request looks for your signature file and tells you what to add if
it is missing. Members of the iyulab organization, and bots such as dependency updaters, are
exempt.

## Architecture boundaries

These are not style preferences. A change that crosses one of them will be declined:

- **The renderer never depends on the authoring tool.** The authoring tool writes a view document;
  the renderer reads it. Anything that makes the renderer need the editor's runtime is out of
  bounds.
- **Widget rendering is delegated to [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets).**
  U-Board's own scope is the spatial layer — positioning, backgrounds, connectors, bindings. New
  widget types belong in that project, not here.
- **U-Board does not own domain data.** Bindings are read-only and resolve through adapters. A
  change that makes U-Board store or become the system of record for the data it displays is out
  of scope.
- **No system-specific knowledge in core.** Knowledge of a particular host system belongs in a
  separate adapter, never in the core binding surface.

[`docs/principles.md`](docs/principles.md) and [`docs/scope.md`](docs/scope.md) go into why.

## No copyleft dependencies

U-Board does not take on dependencies licensed under AGPL, GPL or LGPL. A copyleft dependency
would reach the commercial half of the dual license through the linked whole, which the project
cannot offer. A change that introduces one will be declined regardless of technical merit — open
an issue first if you think an exception is warranted.

## Development

Develop on Node `^22.22.2` or `24.15` and later — what the test tooling needs, a little above the
versions the packages themselves run on (`devEngines` in `package.json`; npm warns below it).

```bash
npm install
npm run typecheck    # tsc --noEmit across the workspace
npm run lint         # oxlint — correctness rules plus the React hooks rules
npm test             # vitest
npm run build        # all packages
npm run test:e2e     # Playwright (canvas rendering, console flows, and the built apps served by the server)
npm run check        # everything CI checks, in CI's order — `-- --skip=postgres,image,e2e` without Docker or browsers
```

The server and the other applications import `@iyulab/u-board` from `packages/core/dist/lib`,
which `npm install` builds once. After changing `packages/core`, run `npm run build:lib` before
testing them, or they keep running against the previous build.

CI runs `npm run check` ([`scripts/check.mjs`](scripts/check.mjs) holds the list), which adds to the
commands above a real-Postgres concurrency suite (needs Docker), `npm run smoke:library` (the built
library entry used the way a consumer would; CI also runs it on the oldest supported Node),
`npm run check:package-types`
(the published package's type declarations resolve for ESM consumers — `attw`),
`npm run check:image` (needs Docker: the container image builds, starts on its required settings
alone, passes `npm run smoke`, and stops cleanly on `SIGTERM`), and three
repository checks:
`npm run check:dependency-drift` (dependencies not left behind their published versions; a breaking
release — a new major, or below 1.0 a new minor — is either adopted or recorded in
[`dependency-deferrals.json`](dependency-deferrals.json) with a reason and a review date, after
which the check fails again) and
`npm run check:public-text` (no private tracking ids, local paths, or hosts outside the
allowlist in [`public-text.json`](public-text.json) — a link to a new public site means adding it
there), and `npm run check:doc-links` (every relative link in the
Markdown docs reaches a file and heading that exist). See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
Run `npm run check` (or at least `npm run typecheck` and `npm test`) locally before opening a pull request.

When upgrading a dependency that several workspaces share, install it for all of them in one
command (`npm install -D <pkg>@<version> --workspace=packages/a --workspace=packages/b …`) and
finish with `npm dedupe`. Upgrading one workspace at a time can leave a second copy nested under
a package, and a second copy of a test runner silently splits type augmentation (such as
jest-dom's matchers) from the instance the tests use.

## Changelog

`packages/core/CHANGELOG.md` records what consumers of `@iyulab/u-board` can notice, in the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. A change to the published package's
behaviour or API adds an entry under `## [Unreleased]` in the same commit — breaking changes say how
to migrate. A release renames that section to the version and date.

## Pull requests

- One logical change per pull request. Keep unrelated refactors out of it.
- Add or update tests for behaviour you change. A bug fix without a test that fails before it is a
  fix that comes back.
- Write commit messages and code comments that describe the change on its own terms — what a
  reader of this repository can verify — rather than the context you found it in.

## Reporting issues

Bug reports and design questions are welcome via GitHub Issues. For anything involving a potential
security vulnerability, do not open a public issue — see [`SECURITY.md`](SECURITY.md) instead.
