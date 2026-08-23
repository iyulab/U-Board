import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
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
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  // 10mb: default 100kb rejects a ViewDocument whose background.image.src is a data: URI.
  app.use(express.json({ limit: '10mb' }));
  if (config.corsOrigins && config.corsOrigins.length > 0) {
    app.use(cors({ origin: config.corsOrigins, credentials: true }));
  }
  app.use(cookieParser());
  const resolveCache = new Map<string, unknown>();
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
