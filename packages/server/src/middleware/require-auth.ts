import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type Database from 'better-sqlite3';
import { verifySession } from '../auth/session.js';
import { findUserById } from '../db/users.js';

export const SESSION_COOKIE_NAME = 'ub_session';

export interface AuthedRequest extends Request {
  userId?: string;
  activeWorkspaceId?: string;
}

export function requireAuth(db: Database.Database, sessionSecret: string): RequestHandler {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const cookieValue = req.cookies?.[SESSION_COOKIE_NAME];
    if (!cookieValue) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    const payload = verifySession(cookieValue, sessionSecret);
    if (!payload) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    const user = findUserById(db, payload.userId);
    if (!user) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    req.userId = payload.userId;
    req.activeWorkspaceId = payload.activeWorkspaceId;
    next();
  };
}
