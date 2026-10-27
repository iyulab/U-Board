# Contributing to U-Board

Thanks for your interest. Please read this before opening an issue or a pull request.

## Status

U-Board is in early development and the public API is not stable. Issues that report bugs, gaps or
inconsistencies are welcome. For anything larger than a small fix, open an issue to agree on scope
before writing code: the architecture has hard boundaries (below) and a pull request that crosses
one will be declined regardless of how well it is written.

## Sign-off

Sign off your commits (`git commit -s`): the `Signed-off-by:` line certifies that you wrote the
change, or have the right to submit it, under the project's [MIT License](LICENSE) (the
[Developer Certificate of Origin](https://developercertificate.org/)).

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

## Dependencies

The library is MIT-licensed, so it takes on dependencies under permissive licenses (MIT, Apache-2.0, BSD, ISC). A
change that adds an AGPL, GPL or LGPL dependency will be declined; open an issue first if you think an exception is
warranted.

## Development

Develop on Node `^22.22.2` or `24.15` and later — what the test tooling needs, a little above the
versions the packages themselves run on (`devEngines` in `package.json`; npm warns below it).

```bash
npm install
npm run typecheck    # tsc --noEmit
npm run lint         # oxlint — correctness rules plus the React hooks rules
npm test             # vitest
npm run build        # the library
npm run test:e2e     # Playwright, against the viewer-only demo (needs a browser)
npm run check        # everything CI checks, in CI's order — `-- --skip=e2e` without browsers
```

CI runs `npm run check` ([`scripts/check.mjs`](scripts/check.mjs) holds the list), which adds to the commands above
`npm run smoke:library` (the built library entry used the way a consumer would; CI also runs it on the oldest
supported Node), `npm run check:package-types` (the published package's type declarations resolve for ESM consumers —
`attw`), and three repository checks: `npm run check:dependency-drift` (dependencies not left behind their published
versions; a breaking release — a new major, or below 1.0 a new minor — is either adopted or recorded in
[`dependency-deferrals.json`](dependency-deferrals.json) with a reason and a review date, after which the check fails
again), `npm run check:public-text` (no private tracking ids, local paths, or hosts outside the allowlist in
[`public-text.json`](public-text.json) — a link to a new public site means adding it there) and `npm run
check:doc-links` (every relative link in the Markdown docs reaches a file and heading that exist). See
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Run `npm run check` (or at least `npm run typecheck` and
`npm test`) locally before opening a pull request.

## Changelog

[`packages/core/CHANGELOG.md`](packages/core/CHANGELOG.md), in the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, records what consumers of the library can notice. A
change to its behaviour or API adds an entry under `## [Unreleased]` in the same commit — breaking changes say how to
migrate. A release renames `## [Unreleased]` to the version and date, in the commit that sets that version.

## Pull requests

- One logical change per pull request. Keep unrelated refactors out of it.
- Add or update tests for behaviour you change. A bug fix without a test that fails before it is a
  fix that comes back.
- Write commit messages and code comments that describe the change on its own terms — what a
  reader of this repository can verify — rather than the context you found it in.

## Reporting issues

Bug reports and design questions are welcome via GitHub Issues. For anything involving a potential
security vulnerability, do not open a public issue — see [`SECURITY.md`](SECURITY.md) instead.
