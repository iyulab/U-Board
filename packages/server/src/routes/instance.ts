import { Router, type Response, type NextFunction } from 'express';
import type { AppConfig } from '../app.js';
import { findUserById, type InstanceRole } from '../db/users.js';
import { listInstanceUsers, listInstanceWorkspaces, makeWorkspaceOwner, setInstanceRole } from '../db/instance.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { listInstanceAuditEvents } from '../db/audit.js';
import { readAuditPage } from './audit-page.js';

/** Running the installation: every workspace and account, operator designation, and getting back
 *  into a workspace whose owners are gone. Operators only. */
export function createInstanceRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();
  router.use(requireAuth(db, sessionSecret));
  router.use(async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if ((await findUserById(db, req.userId!))?.instanceRole !== 'operator') {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    next();
  });

  router.get('/workspaces', async (_req, res) => {
    res.status(200).json({ workspaces: await listInstanceWorkspaces(db) });
  });

  router.get('/users', async (_req, res) => {
    res.status(200).json({ users: await listInstanceUsers(db) });
  });

  router.patch('/users/:userId', async (req: AuthedRequest<{ userId: string }>, res) => {
    const { instanceRole } = req.body ?? {};
    if (!isInstanceRole(instanceRole)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const result = await setInstanceRole(db, req.params.userId, instanceRole, req.userId!);
    if (result === 'not-found') {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (result === 'last-operator') {
      res.status(409).json({ code: 'LAST_OPERATOR' });
      return;
    }
    res.status(204).end();
  });

  router.post('/workspaces/:workspaceId/owners', async (req: AuthedRequest<{ workspaceId: string }>, res) => {
    const { userId } = req.body ?? {};
    if (typeof userId !== 'string' || userId === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const result = await makeWorkspaceOwner(db, req.params.workspaceId, userId, req.userId!);
    if (result !== 'changed') {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).end();
  });

  // The installation's own history: workspaces created, owners restored, operators designated,
  // accounts deleted. Not a workspace's membership changes — those are its owners' to read; an
  // operator sees them only by becoming an owner, which is itself recorded there.
  router.get('/audit', async (req, res) => {
    const page = readAuditPage(req.query);
    if (!page) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    res.status(200).json(await listInstanceAuditEvents(db, page));
  });

  return router;
}

function isInstanceRole(value: unknown): value is InstanceRole {
  return value === 'operator' || value === 'user';
}
