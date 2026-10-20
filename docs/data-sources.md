# Serving data to a board

A board reads its values through a data source an installation connects to — most often the HTTP
connector, pointed at an API another system already runs. This page is for whoever builds or shapes that
API: what the connector can read, and the form that makes a board easy to build and keeps it honest about
what it shows. Nothing here is specific to one product; a board reads any source the same way.

## What the HTTP connector reads

- **A `GET` that answers JSON.** Another format is shown as not connected, with the reason "the source
  answered in a form that cannot be read". A redirect is not followed.
- **A slow source.** A board waits up to 5 seconds for a read; a slower source is read on in the background, for up
  to 25 seconds, and its answer serves the next refresh. Meanwhile the board shows the last answer — or, the first
  time, "still reading" (reason `pending`). A request that takes over 25 seconds is a failed read.
- **Credentials** a server can hold: none, a bearer token, a header of your choice, a key in the query or
  in the path, or OAuth 2.0 client credentials (RFC 6749 §4.4 — form body or HTTP Basic; the token is
  reused until it expires and requested again once on a `401`).
- **A value anywhere in the answer**, by JSON Pointer (`/value/0/load`), or an **item of a list picked by
  its fields** (`{ "list": "/value", "where": { "id": "PR-01" } }`) so a reordered list still gives the
  same item. A whole array or object can be bound too — a table or a chart takes it as it is, as rows or
  as one array per field.
- **When the value was observed**, from a field of the answer, and **how old it may normally be**. With
  both, a board shows each value's age and marks a source that has fallen behind.

A board asks again every 30 seconds while it is open. The server reads the same address once for any
number of open screens within 10 seconds — or, for a binding that says how old its value may be, within an
eighth of that age. There is no push: a board is a status display, and polling is how it stays current.

## The form that reads well

1. **One stable address per view of the data**, with the window or filter in the query
   (`/usage?window=1h`). A board that reads a few addresses costs the source a few requests, however many
   screens show it.
2. **A time on every answer** — when the values were observed, in ISO 8601 with its offset
   (`"updatedAt": "2026-10-15T14:30:00+09:00"`). Say in your documentation how often it changes; that is
   what a board's author sets as the value's normal age.
3. **Lists as objects with an identifying field** (`{ "id": "PR-01", ... }`), so a value is picked by what
   it is, not where it is. Time series as rows (`{ "t": ..., "value": ... }`) or as arrays of one length.
4. **States as a closed set of codes** (`ok | degraded | down | unknown`), listed in your documentation.
   The board maps codes to words and colors in its own language; do not send colors or display text.
5. **Numbers as JSON numbers**, with the unit in the field name or the documentation (`latencyP95Ms`).
6. **Figures computed at the source.** A board places and colors values; it does not sum, group or average
   them. Serve the totals, rates and percentiles a view needs.
7. **"No value" distinct from zero, and every field always there** — send `null` when there is no value
   and `0` only for a real zero. A field that disappears from the answer reads as "bound value not found at
   the source": the board takes it for an answer that changed shape, not for an empty value.
8. **Cheap to ask often** — answer from what you already hold. If you limit requests, answer `429`; the
   board shows the source as "rate limited" rather than unreachable.
9. **A read-only credential** for the board's server, scoped to what the views read. Prefer short-lived
   tokens (client credentials) to a key that never expires.
10. **Paths written down where the source is set up.** A data source carries a description (up to 2,000
    characters) its owner writes — the requests it answers and what each holds (`GET /line-1.json — the
    line; its stations under /stations, by "id"`). Whoever binds to it next reads it instead of guessing paths:
    a person in the console, or an assistant through `list_sources`. It is not shown with a shared board.
11. **Errors as errors** — a refused key, a rejected query or a spent quota answered with `401`, `400` or `429`,
    not with `200`. A source that answers them with `200` and a status in the body can still be read: its data
    source says where that status is (the console's «응답 속 오류 위치», `sourceError` through the API), and its
    bindings then fail with what the source said instead of reading as a value missing from the answer.

What a board does with the answer — the reasons it gives when a value is not current, and the types a
custom adapter returns instead of the HTTP connector — is in [`api-reference.md`](api-reference.md)
(`HttpRef`, `ResolvedBinding`, `QualityReason`). Which addresses the server may reach at all is an
installation setting: [`self-hosting.md`](self-hosting.md) (`UBOARD_CONNECTOR_ADDRESSES`).
