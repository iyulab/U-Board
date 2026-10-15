import { createHash } from 'node:crypto';
import type { Response } from 'express';
import { elementFrameHtml, elementFrameScripts, type ViewDocument } from '@iyulab/u-board/domain';

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
 */
export function sendElementFrame(res: Response, doc: ViewDocument, name: string, allowedOrigins: readonly string[], frameAncestors: string): void {
  const definition = Object.hasOwn(doc.elements ?? {}, name) ? doc.elements![name] : undefined;
  if (!definition || definition.render !== 'script') {
    res.status(404).json({ code: 'NOT_FOUND' });
    return;
  }
  const origins = (definition.resources ?? []).filter(origin => allowedOrigins.includes(origin)).join(' ');
  const html = elementFrameHtml(definition);
  const scripts = elementFrameScripts(definition).map(sha256).join(' ');
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
