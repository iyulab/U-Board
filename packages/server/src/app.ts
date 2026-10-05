import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { DbClient } from './db.js';
import type { InvitationEmail } from './email/sendway-email-sender.js';
import { createAuthRouter } from './routes/auth.js';
import { createInvitationsRouter } from './routes/invitations.js';
import { createWorkspacesRouter } from './routes/workspaces.js';
import { createBoardsRouter } from './routes/boards.js';
import { createBoardShareTokensRouter } from './routes/board-share-tokens.js';
import { createConnectorsRouter } from './routes/connectors.js';
import { createShareRouter } from './routes/share.js';
import { createInstanceRouter } from './routes/instance.js';
import { ClientCredentialsTokens } from './oauth-client-credentials.js';
import type { ResolveState } from './resolve-connector.js';
import { serveWebApps, type WebApps } from './web-apps.js';
import type { WorkspaceCreation } from './workspace-creation.js';

export interface AppConfig {
  db: DbClient;
  sessionSecret: string;
  /** CORS allowlist for a deployment that hosts the console and share viewer on other origins than
   *  the API. Unset when they are served from the API's own origin (`webApps`) or in dev/test, where
   *  the dev proxy makes requests same-origin. */
  corsOrigins?: string[];
  /** Key the auth rate limiter off Cloudflare's `CF-Connecting-IP` header instead of `req.ip`.
   *  Enable ONLY once the deployment's ingress is locked to Cloudflare-only traffic — otherwise
   *  the header is client-spoofable and the limiter is worse than doing nothing. Unset in
   *  dev/test, where the header doesn't exist. */
  trustCloudflareProxy?: boolean;
  /** Delivers a password-reset link/token to a user's inbox. Injected so the actual email
   *  provider is a deployment-time choice, not a compile-time dependency — omit it and a safe
   *  dev-mode default logs the token server-side instead of sending anything (see
   *  `routes/auth.ts`'s `defaultSendPasswordResetEmail`). Whatever this does or doesn't do, the
   *  token itself must never appear in an HTTP response — only ever passed to this function. */
  sendPasswordResetEmail?: (input: { email: string; token: string }) => Promise<void>;
  /** Origin people open the console at (no trailing slash) — the base of links the server puts in
   *  email. Configured rather than read from the request, so whoever triggers an email cannot
   *  choose where its link points. */
  publicUrl?: string;
  /** Emails an invitation link. Used only with `publicUrl`; without both, an invitation is
   *  delivered by the owner copying the link the console shows. */
  sendInvitationEmail?: (input: InvitationEmail) => Promise<void>;
  /** How old a connector's last-known value may be and still be served as `stale` when a read fails
   *  (milliseconds) — past it the binding reads `disconnected`. Unset: no limit. */
  staleMaxAgeMs?: number;
  /** Who may create workspaces — instance operators only (default) or every account. */
  workspaceCreation?: WorkspaceCreation;
  /** The built console and share viewer to serve next to the API, from one origin: the share
   *  viewer under `/share/`, the console at every other path. Omit to serve the API alone (tests,
   *  or a deployment that hosts the two apps elsewhere). */
  webApps?: WebApps;
}

/** `req.ip` collapses to the single ingress IP behind Cloudflare -> the hosting platform unless the
 *  exact hop count is configured via Express's `trust proxy`, which is fragile (a platform-side
 *  change to that chain silently reopens the shared-bucket DoS). `CF-Connecting-IP` sidesteps the
 *  hop-count question entirely — Cloudflare always sets it to the real client IP, and it's only
 *  trustworthy once ingress rejects traffic that didn't come through Cloudflare.
 *
 *  The address goes through `ipKeyGenerator`, which keys an IPv6 client by its /56 subnet: a single
 *  IPv6 subscriber typically holds a whole /64 or larger, so keying the full address would let one
 *  client rotate through addresses and never hit the limit. */
export function cloudflareKeyGenerator(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = typeof cfIp === 'string' && cfIp.length > 0 ? cfIp : req.ip;
  return ip ? ipKeyGenerator(ip) : 'unknown';
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  app.disable('x-powered-by');
  // CORS must be registered before express.json(): when express.json() throws (413 for an
  // oversized body, 400 for malformed JSON), Express skips every remaining non-error middleware
  // and jumps straight to errorHandler — a cors() mounted after it would never run, so those
  // error responses would ship without CORS headers and the browser would block the client from
  // ever reading them.
  if (config.corsOrigins && config.corsOrigins.length > 0) {
    // `maxAge`: every share-viewer resolve is a cross-origin JSON POST and so needs a preflight;
    // without it browsers cache that answer for seconds only, and each binding's poll pays an extra
    // round trip that also counts against the edge rate limit on `/api/share/*`. Browsers cap it lower
    // on their own (Chromium at 2 hours), so 10 minutes applies as written everywhere.
    app.use(cors({ origin: config.corsOrigins, credentials: true, maxAge: 600 }));
  }
  // 10mb: default 100kb rejects a ViewDocument whose background.image.src is a data: URI.
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  // Per-process resolve state shared by the member and share-link resolve routes: last-known values
  // (so a failure can degrade to `stale`), OAuth access tokens, and which failures are already logged.
  const resolveState: ResolveState = {
    values: new Map(),
    tokens: new ClientCredentialsTokens(),
    failures: new Map(),
    inflight: new Map(),
    staleMaxAgeMs: config.staleMaxAgeMs,
  };
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    ...(config.trustCloudflareProxy
      ? { keyGenerator: cloudflareKeyGenerator, validate: { xForwardedForHeader: false } }
      : {}),
  });
  // Every API route lives under `/api`, so the web apps can own every other path — the console's
  // client-side routes and the share viewer's `/share/` — on the same origin.
  const api = express.Router();
  // Unauthenticated liveness/readiness check — a DB round-trip, not just "the process is up", so
  // it catches a listening-but-stuck app (e.g. an exhausted connection pool) that a bare TCP probe
  // would miss. Registered before auth/rate-limiting so it stays cheap to poll.
  app.get('/health', (_req, res) => {
    config.db
      .query('SELECT 1')
      .then(() => res.status(200).json({ status: 'ok' }))
      .catch(() => res.status(503).json({ status: 'error' }));
  });
  api.use('/auth/login', authRateLimiter);
  api.use('/auth/signup', authRateLimiter);
  // Same bucket as login/signup: an unlimited request-password-reset would let an attacker spam
  // token generation (and, once a real email provider is wired, email-bomb a victim's inbox);
  // reset-password shares it too for the same "auth attack surface" reasoning login/signup do.
  api.use('/auth/request-password-reset', authRateLimiter);
  api.use('/auth/reset-password', authRateLimiter);
  api.use('/auth', createAuthRouter(config));
  api.use('/invitations', createInvitationsRouter(config));
  api.use('/workspaces', createWorkspacesRouter(config));
  api.use('/workspaces/:workspaceId/boards', createBoardsRouter(config));
  api.use('/workspaces/:workspaceId/boards/:boardId/share-tokens', createBoardShareTokensRouter(config));
  api.use('/workspaces/:workspaceId/connectors', createConnectorsRouter(config, resolveState));
  api.use('/share', createShareRouter(config, resolveState));
  api.use('/instance', createInstanceRouter(config));
  // An unknown API path answers as the API does — never with the console's HTML.
  api.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND' });
  });
  app.use('/api', api);
  if (config.webApps) serveWebApps(app, config.webApps);
  // Must stay last: Express only reaches an error handler registered AFTER the layer that
  // failed, so anything mounted below this line would bypass it.
  app.use(errorHandler);
  return app;
}

/**
 * Catch-all for anything a route forwards via `next(err)`, including a rejected promise from an
 * async handler (Express 5 forwards those itself). Answers with an opaque code so an internal failure never leaks stack or
 * driver detail to the client.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const type = err && typeof err === 'object' && 'type' in err ? (err as { type?: string }).type : undefined;
  if (type === 'entity.too.large') {
    res.status(413).json({ code: 'PAYLOAD_TOO_LARGE' });
    return;
  }
  if (type === 'entity.parse.failed') {
    res.status(400).json({ code: 'INVALID_JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR' });
}
