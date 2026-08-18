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

No view kind, editor, or renderer is implemented yet. There is no quality-ramp level to report
against.

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
