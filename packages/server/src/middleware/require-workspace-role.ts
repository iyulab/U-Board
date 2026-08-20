import type { Response, NextFunction, RequestHandler } from 'express';
import type Database from 'better-sqlite3';
import type { AuthedRequest } from './require-auth.js';
import { findWorkspaceUser } from '../db/workspaces.js';

export function requireWorkspaceMember(db: Database.Database): RequestHandler {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const wu = findWorkspaceUser(db, req.params.workspaceId, req.userId ?? '');
    if (!wu) {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}

export function requireWorkspaceOwner(db: Database.Database): RequestHandler {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const wu = findWorkspaceUser(db, req.params.workspaceId, req.userId ?? '');
    if (!wu || wu.role !== 'owner') {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}
