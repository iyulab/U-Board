import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import type Database from 'better-sqlite3';
import { createAuthRouter } from './routes/auth.js';
import { createInvitationsRouter } from './routes/invitations.js';
import { createWorkspacesRouter } from './routes/workspaces.js';
import { createBoardsRouter } from './routes/boards.js';
import { createConnectorsRouter } from './routes/connectors.js';

export interface AppConfig {
  db: Database.Database;
  sessionSecret: string;
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  // 10mb: default 100kb rejects a ViewDocument whose background.image.src is a data: URI.
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/auth', createAuthRouter(config));
  app.use('/invitations', createInvitationsRouter(config));
  app.use('/workspaces', createWorkspacesRouter(config));
  app.use('/workspaces/:workspaceId/boards', createBoardsRouter(config));
  app.use('/workspaces/:workspaceId/connectors', createConnectorsRouter(config));
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
  if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ code: 'PAYLOAD_TOO_LARGE' });
    return;
  }
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR' });
}
