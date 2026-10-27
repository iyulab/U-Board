# Security Policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/iyulab/U-Board/security/advisories/new) for
this repository, not as a public issue.

Include what you need to make the problem reproducible: affected version (or commit), the setup it
occurs in, the steps, and what an attacker gains. A proof of concept helps; a description of the flaw
is enough to start.

Expect an acknowledgement within a week. Confirmed issues get a fix and an advisory; if a report
turns out not to be a vulnerability, you will get the reasoning rather than silence.

## What is in scope

The project is in early development and its API is not stable, so "supported" means the current
`main` branch — fixes land there and are released from there rather than backported.

Things that are in scope and worth reporting:

- A board, or the data a board reads, being able to execute script in the page that shows it. A board's script
  elements run by design, in a sandboxed frame of their own origin with no network; script that escapes that frame, or a
  template element whose markup runs script, is a vulnerability.
- A board's links reaching an address the host did not allow (`linkOrigins`), or a link built from data that changes
  where it goes.
- The HTTP reference's request construction and its handling of the credentials a host gives it.

Out of scope: findings against a host application's own configuration rather than this code, and
automated-scanner output without a reproducible case.
