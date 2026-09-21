# Security Policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/iyulab/U-Board/security/advisories/new) for
this repository, not as a public issue.

Include what you need to make the problem reproducible: affected package and version (or commit),
the setup it occurs in, the steps, and what an attacker gains. A proof of concept helps; a
description of the flaw is enough to start.

Expect an acknowledgement within a week. Confirmed issues get a fix and an advisory; if a report
turns out not to be a vulnerability, you will get the reasoning rather than silence.

## What is in scope

U-Board is in early development and its API is not stable, so "supported" means the current
`main` branch — fixes land there and are released from there rather than backported.

Things that are in scope and worth reporting:

- `packages/server` — authentication, session handling, workspace and board authorization, the
  share-link surface, the connector proxy.
- The HTTP connector adapter's origin pinning and credential handling. It is deliberately
  restricted; a way around that restriction is a vulnerability.
- `packages/share` — the unauthenticated embed viewer, and anything it can reach that a share
  token should not grant.
- Stored view documents being able to execute script in a viewer's browser.

Out of scope: findings against a deployment's own configuration rather than this code, missing
hardening headers with no demonstrated impact, and automated-scanner output without a reproducible
case.

## Data this project holds

U-Board binds to data that lives in other systems and does not store it. A vulnerability that
exposes a view document, a connector's credentials, or a share token is therefore more serious
than its size suggests — the credentials reach systems this project does not own.
