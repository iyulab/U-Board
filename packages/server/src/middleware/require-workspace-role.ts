import type { Response, NextFunction } from 'express';
import type { DbClient } from '../db.js';
import type { AuthedRequest } from './require-auth.js';
import { findWorkspaceUser } from '../db/workspaces.js';
import { pathParam } from './path-param.js';

/**
 * Generic over the route's parameters so that placing a guard in front of a handler leaves the
 * handler's own `req.params` typing (inferred from the route string) intact.
 */
type WorkspaceGuard = <P>(req: AuthedRequest<P>, res: Response, next: NextFunction) => Promise<void>;

/** A request made with an API token reaches the token's own workspace only. */
function outsideTokenWorkspace(req: AuthedRequest<unknown>): boolean {
  return req.apiToken !== undefined && req.apiToken.workspaceId !== pathParam(req, 'workspaceId');
}

export function requireWorkspaceMember(db: DbClient): WorkspaceGuard {
  return async (req, res, next) => {
    const wu = outsideTokenWorkspace(req) ? undefined : await findWorkspaceUser(db, pathParam(req, 'workspaceId'), req.userId ?? '');
    if (!wu) {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}

export function requireWorkspaceOwner(db: DbClient): WorkspaceGuard {
  return async (req, res, next) => {
    const wu = outsideTokenWorkspace(req) ? undefined : await findWorkspaceUser(db, pathParam(req, 'workspaceId'), req.userId ?? '');
    if (!wu || wu.role !== 'owner') {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}
