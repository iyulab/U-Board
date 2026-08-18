# Principles

Each principle here costs something. A principle without a cost is a preference, not a
commitment — the cost is listed so the trade-off stays visible.

## Editor and renderer are architecturally separate (non-negotiable)

The authoring tool may be as heavy and feature-rich as it needs to be. The renderer that displays
an authored view must always stay light and fast, regardless of how complex the authoring tool
becomes. This is the one principle on this list the project will not trade away.

**Cost**: every authoring feature has to be checked against whether it leaks weight into the
renderer. This slows feature development and effectively means the editor and the renderer live
on separate release rhythms.

## Backgrounds are domain-neutral

The system treats a view's background as generic media (an image, or nothing) and does not
attach meaning to it. Whether a background reads as a "floor plan" or a "map" is an
interpretation the author and viewer bring to it — the system's behavior does not branch on that
interpretation.

**Cost**: domain-specific behavior (a particular icon set for a particular kind of facility, for
example) cannot live in the core — it has to be built as an adapter on top, which means more
integration work for any one domain's specific needs.

## Extension follows demonstrated demand

New view kinds, new integration surfaces, and new generalized contracts are built once a second
real consumer needs them — not designed speculatively ahead of that need.

**Cost**: the first consumer of a capability sometimes has to accept a narrower, more specific
solution than a fully general one, and some rework happens when the second consumer arrives.

## View kinds are an extension point, not a fixed set

A view is authored as a specific "kind" (for example, a spatial canvas view), and each kind owns
its own authoring capabilities. A new kind can be added later without redesigning the kinds that
already exist.

**Cost**: the shared structure between kinds has to be drawn carefully up front — getting that
boundary wrong makes the first kind's implementation quietly load-bearing for every kind added
after it.
