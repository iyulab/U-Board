import express from 'express';
import cookieParser from 'cookie-parser';
import type Database from 'better-sqlite3';

export interface AppConfig {
  db: Database.Database;
  sessionSecret: string;
}

export function createApp(config: AppConfig): express.Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.set('appConfig', config);
  return app;
}
