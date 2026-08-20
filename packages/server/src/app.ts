import express from 'express';
import cookieParser from 'cookie-parser';
import type Database from 'better-sqlite3';
import { createAuthRouter } from './routes/auth.js';
import { createInvitationsRouter } from './routes/invitations.js';
import { createWorkspacesRouter } from './routes/workspaces.js';

export interface AppConfig {
  db: Database.Database;
  sessionSecret: string;
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.set('appConfig', config);
  app.use('/auth', createAuthRouter(config));
  app.use('/invitations', createInvitationsRouter(config));
  app.use('/workspaces', createWorkspacesRouter(config));
  return app;
}
