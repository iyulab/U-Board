import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { DbClient } from './db.js';
import { createAuthRouter } from './routes/auth.js';
import { createInvitationsRouter } from './routes/invitations.js';
import { createWorkspacesRouter } from './routes/workspaces.js';
import { createBoardsRouter } from './routes/boards.js';
import { createBoardShareTokensRouter } from './routes/board-share-tokens.js';
import { createConnectorsRouter } from './routes/connectors.js';
import { createShareRouter } from './routes/share.js';

export interface AppConfig {
  db: DbClient;
  sessionSecret: string;
  /** Production-only CORS allowlist (console + share origins). Unset in dev/test, where the
   *  same-origin dev proxy makes CORS a no-op anyway. */
  corsOrigins?: string[];
  /** Key the auth rate limiter off Cloudflare's `CF-Connecting-IP` header instead of `req.ip`.
   *  Enable ONLY once the deployment's ingress is locked to Cloudflare-only traffic — otherwise
   *  the header is client-spoofable and the limiter is worse than doing nothing. Unset in
   *  dev/test, where the header doesn't exist. */
  trustCloudflareProxy?: boolean;
}

/** `req.ip` collapses to the single ingress IP behind Cloudflare -> Container Apps unless the
 *  exact hop count is configured via Express's `trust proxy`, which is fragile (a platform-side
 *  change to that chain silently reopens the shared-bucket DoS). `CF-Connecting-IP` sidesteps the
 *  hop-count question entirely — Cloudflare always sets it to the real client IP, and it's only
 *  trustworthy once ingress rejects traffic that didn't come through Cloudflare. */
function cloudflareKeyGenerator(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  return typeof cfIp === 'string' && cfIp.length > 0 ? cfIp : (req.ip ?? 'unknown');
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  // CORS must be registered before express.json(): when express.json() throws (413 for an
  // oversized body, 400 for malformed JSON), Express skips every remaining non-error middleware
  // and jumps straight to errorHandler — a cors() mounted after it would never run, so those
  // error responses would ship without CORS headers and the browser would block the client from
  // ever reading them.
  if (config.corsOrigins && config.corsOrigins.length > 0) {
    app.use(cors({ origin: config.corsOrigins, credentials: true }));
  }
  // 10mb: default 100kb rejects a ViewDocument whose background.image.src is a data: URI.
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  const resolveCache = new Map<string, unknown>();
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    ...(config.trustCloudflareProxy
      ? { keyGenerator: cloudflareKeyGenerator, validate: { xForwardedForHeader: false } }
      : {}),
  });
  app.use('/auth/login', authRateLimiter);
  app.use('/auth/signup', authRateLimiter);
  app.use('/auth', createAuthRouter(config));
  app.use('/invitations', createInvitationsRouter(config));
  app.use('/workspaces', createWorkspacesRouter(config));
  app.use('/workspaces/:workspaceId/boards', createBoardsRouter(config));
  app.use('/workspaces/:workspaceId/boards/:boardId/share-tokens', createBoardShareTokensRouter(config));
  app.use('/workspaces/:workspaceId/connectors', createConnectorsRouter(config, resolveCache));
  app.use('/share', createShareRouter(config, resolveCache));
  // Must stay last: Express only reaches an error handler registered AFTER the layer that
  // failed, so anything mounted below this line would bypass it.
  app.use(errorHandler);
  return app;
}

/**
 * Catch-all for anything a route forwards via `next(err)` (async handlers reach here through
 * `asyncHandler`). Answers with an opaque code so an internal failure never leaks stack or
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
