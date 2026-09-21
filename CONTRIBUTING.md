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

```bash
npm install
npm run typecheck    # tsc --noEmit across the workspace
npm test             # vitest
npm run build        # all packages
npm run test:e2e     # Playwright (canvas rendering, console flows)
```

CI runs the same checks plus a real-Postgres concurrency suite; see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Run `npm run typecheck` and `npm test`
locally before opening a pull request.

## Pull requests

- One logical change per pull request. Keep unrelated refactors out of it.
- Add or update tests for behaviour you change. A bug fix without a test that fails before it is a
  fix that comes back.
- Write commit messages and code comments that describe the change on its own terms — what a
  reader of this repository can verify — rather than the context you found it in.

## Reporting issues

Bug reports and design questions are welcome via GitHub Issues. For anything involving a potential
security vulnerability, please do not open a public issue — report it privately through GitHub's
security advisory form for this repository instead.
