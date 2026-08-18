# Overview

> Status: this document describes the current design intent.

## What U-Board is

U-Board is authoring middleware for spatial, data-bound views. An author places a background (a
floor plan image, a network diagram, a map, or nothing at all), positions nodes on it — anchored
to real coordinates or freely arranged — connects them where a relationship needs to be shown,
and binds each node's widget to a live data source. The result is a view that can be embedded in
any web application.

## Role

U-Board is middleware, not a standalone product a user opens on its own. Another application
embeds a U-Board-authored view and supplies the data that view binds to. U-Board owns the view's
layout and presentation; it does not own or store the data displayed in it.

## Editor and renderer are separate

Authoring a view can be a heavyweight, feature-rich experience. Viewing one must not be — the
same view, once authored, renders in a lightweight, fast runtime that carries none of the
authoring tool's weight. This separation is the project's central design commitment; see
[`principles.md`](principles.md).
