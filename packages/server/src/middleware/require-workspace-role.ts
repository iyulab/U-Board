import type { Response, NextFunction, RequestHandler } from 'express';
import type { DbClient } from '../db.js';
import type { AuthedRequest } from './require-auth.js';
import { findWorkspaceUser } from '../db/workspaces.js';
import { asyncHandler } from './async-handler.js';

export function requireWorkspaceMember(db: DbClient): RequestHandler {
  return asyncHandler(async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const wu = await findWorkspaceUser(db, req.params.workspaceId, req.userId ?? '');
    if (!wu) {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  });
}

export function requireWorkspaceOwner(db: DbClient): RequestHandler {
  return asyncHandler(async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const wu = await findWorkspaceUser(db, req.params.workspaceId, req.userId ?? '');
    if (!wu || wu.role !== 'owner') {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  });
}
