import { createHash } from 'node:crypto';
import type { Response } from 'express';
import { elementFrameHtml, elementFrameScripts, type ElementDefinition } from '@iyulab/u-board/picture';
import { guardLoops } from './loop-guard.js';

/**
 * Reads `UBOARD_ELEMENT_ORIGINS`: the origins a board's elements may load from — a font, an image, a script library —
 * when an element also lists them in its `resources`. Unset or empty means none, so by default a board loads nothing
 * from another origin. Origins are separated by commas or spaces, each an https origin — a host and an optional port —
 * with nothing after; anything else fails startup.
 */
export function elementOriginsFromEnv(value: string | undefined): string[] {
  const origins = (value ?? '').split(/[\s,]+/).filter(Boolean);
  for (const origin of origins) {
    let canonical: string | undefined;
    try {
      const url = new URL(origin);
      if (url.protocol === 'https:') canonical = url.origin;
    } catch {
      // reported below
    }
    if (canonical !== origin) throw new Error(`UBOARD_ELEMENT_ORIGINS must list https origins with nothing after the host and port (got "${origin}")`);
  }
  return origins;
}

/**
 * Reads `UBOARD_ELEMENT_FRAME_ORIGIN`: an https origin whose host starts with a `*` label — `https://*.frames.example.com`
 * — to serve each script element definition's frames from an origin of its own under it (`<definition label>.frames…`,
 * `elementFrameLabel`). A browser runs each origin's frames in a process of its own, so one element whose code never
 * yields does not stop the board's other script elements (measured, Chrome and Edge). Needs a wildcard DNS name and
 * certificate pointing at this server. Unset: frames are served from the server's own origin, as before.
 */
export function elementFrameOriginFromEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const sample = value.replace('*', 'x');
  let origin: string | undefined;
  try {
    origin = new URL(sample).origin;
  } catch {
    // reported below
  }
  if (!value.startsWith('https://*.') || origin !== sample) {
    throw new Error(`UBOARD_ELEMENT_FRAME_ORIGIN must be an https origin whose host starts with "*." such as https://*.frames.example.com (got "${value}")`);
  }
  return value;
}

/** The address a page builds a board's script element frames from (`elementFrames`): `{definition}` stands for each
 *  definition's label. */
export function elementFramesAddress(frameOrigin: string, boardId: string): string {
  return `${frameOrigin.replace('*', '{definition}')}/api/element-frames/${encodeURIComponent(boardId)}`;
}

/** The label a request's host gives in place of the frame origin's `*`, or `undefined` when the host is not one of the
 *  frame origin's. */
export function frameHostLabel(frameOrigin: string, host: string | undefined): string | undefined {
  const suffix = new URL(frameOrigin.replace('*', 'x')).host.slice(1);
  const asked = host?.toLowerCase();
  if (!asked?.endsWith(suffix)) return undefined;
  const label = asked.slice(0, -suffix.length);
  return label !== '' && !label.includes('.') ? label : undefined;
}

function sha256(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/**
 * Answers the frame of the document's script element `name` — or 404 when the document defines no script element by
 * that name. The policy sent with it is the element's whole world:
 * - `sandbox allow-scripts` — an origin of its own even when the frame is opened on its own, so it never runs as the
 *   console's origin, its session or storage;
 * - scripts only the frame runtime and the element's own code (by hash), plus the origins it declares that the
 *   installation allows; the same origins for styles, images, fonts and media;
 * - no network (`connect-src 'none'`) — its data arrives as props, through the board's bindings;
 * - framed only by the page that shows the board (`frameAncestors`).
 *
 * The element's code is served with its loops bounded in time (`guardLoops`), so one that never ends stops with an
 * error instead of holding the frame — in a browser without site isolation, the whole page.
 */
export function sendElementFrame(res: Response, definition: ElementDefinition, allowedOrigins: readonly string[], frameAncestors: string): void {
  if (definition.render !== 'script') {
    res.status(404).json({ code: 'NOT_FOUND' });
    return;
  }
  const origins = (definition.resources ?? []).filter(origin => allowedOrigins.includes(origin)).join(' ');
  const served = definition.script === undefined ? definition : { ...definition, script: guardLoops(definition.script) };
  const html = elementFrameHtml(served);
  const scripts = elementFrameScripts(served).map(sha256).join(' ');
  const from = (base: string) => (origins ? `${base} ${origins}` : base);
  const csp = [
    'sandbox allow-scripts',
    "default-src 'none'",
    `script-src ${scripts}${origins ? ` ${origins}` : ''}`,
    from("style-src 'unsafe-inline'"),
    from('img-src data: blob:'),
    from("font-src data:"),
    origins ? `media-src ${origins}` : "media-src 'none'",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${frameAncestors}`,
  ].join('; ');
  const etag = `"${createHash('sha256').update(csp).update(html).digest('base64url').slice(0, 27)}"`;
  res.set({
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-cache',
    ETag: etag,
  });
  if (res.req.fresh) {
    res.status(304).end();
    return;
  }
  res.status(200).type('html').send(html);
}
