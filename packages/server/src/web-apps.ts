import path from 'node:path';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';

/** The built console and share viewer the server hosts next to its API. */
export interface WebApps {
  /** The console's build output (its `index.html` and `assets/`). Served at `/`. */
  consoleDir: string;
  /** The share viewer's build output. Served at `/share/`. */
  shareDir: string;
  /** Who may embed the share viewer in a frame — a CSP `frame-ancestors` source list. Defaults to
   *  `https:` (any page served over HTTPS). */
  shareFrameAncestors?: string;
}

const SHARE_PREFIX = '/share';

// `script-src 'self'` keeps an injected script from running in either app — the share viewer shows
// boards other people authored, on the console's origin. Images, styles and data are left open:
// a board's background is any image URL or a `data:` URI.
function contentSecurityPolicy(frameAncestors: string): string {
  return `script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors ${frameAncestors}`;
}

function staticApp(dir: string, csp: string) {
  return express.static(dir, {
    index: 'index.html',
    redirect: false,
    setHeaders(res, filePath) {
      res.setHeader('Content-Security-Policy', csp);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Build output under `assets/` carries a content hash in its name, so it never changes in
      // place; the HTML that points at it must be revalidated to pick up a new build.
      const underAssets = path.relative(dir, filePath).split(path.sep)[0] === 'assets';
      res.setHeader('Cache-Control', underAssets ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });
}

/**
 * Serves the share viewer under `/share/` and the console at every other path, after the API
 * (`/api`) and `/health` have had their turn. The console is a single-page app: a page load of one
 * of its routes (`/boards/…`) gets its `index.html`.
 */
export function serveWebApps(app: Express, { consoleDir, shareDir, shareFrameAncestors = 'https:' }: WebApps): void {
  const consoleCsp = contentSecurityPolicy("'none'");

  // The share viewer loads its files relative to its own URL, so it must be addressed as a
  // directory: `/share?board=…` would resolve them against `/`.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path !== SHARE_PREFIX || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
    const queryStart = req.originalUrl.indexOf('?');
    res.redirect(301, `${SHARE_PREFIX}/${queryStart === -1 ? '' : req.originalUrl.slice(queryStart)}`);
  });
  app.use(SHARE_PREFIX, staticApp(shareDir, contentSecurityPolicy(shareFrameAncestors)));
  app.use(staticApp(consoleDir, consoleCsp));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isPageLoad = (req.method === 'GET' || req.method === 'HEAD') && req.accepts('html') === 'html';
    if (!isPageLoad || req.path.startsWith(`${SHARE_PREFIX}/`)) return next();
    res.setHeader('Content-Security-Policy', consoleCsp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(consoleDir, 'index.html'));
  });
}
