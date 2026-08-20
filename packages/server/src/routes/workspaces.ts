import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { listWorkspacesForUser, listWorkspaceMembers } from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { requireAuth, type AuthedRequest, SESSION_COOKIE_NAME, sessionCookieOptions } from '../middleware/require-auth.js';
import { requireWorkspaceOwner, requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { signSession } from '../auth/session.js';

export function createWorkspacesRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();
  router.use(requireAuth(db, sessionSecret));

  router.get('/me', (req: AuthedRequest, res) => {
    res.status(200).json({
      userId: req.userId,
      activeWorkspaceId: req.activeWorkspaceId,
      workspaces: listWorkspacesForUser(db, req.userId!),
    });
  });

  router.get('/:workspaceId/members', requireWorkspaceMember(db), (req, res) => {
    res.status(200).json({ members: listWorkspaceMembers(db, req.params.workspaceId) });
  });

  router.post('/:workspaceId/invitations', requireWorkspaceOwner(db), (req: AuthedRequest, res) => {
    const { email, role } = req.body ?? {};
    if (typeof email !== 'string' || (role !== 'owner' && role !== 'member')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const invitation = createInvitation(db, { workspaceId: req.params.workspaceId, email, role, invitedByUserId: req.userId! });
    res.status(201).json({ token: invitation.token, expiresAt: invitation.expiresAt });
  });

  router.post('/:workspaceId/switch', requireWorkspaceMember(db), (req: AuthedRequest, res) => {
    const token = signSession({ userId: req.userId!, activeWorkspaceId: req.params.workspaceId, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.status(200).json({ activeWorkspaceId: req.params.workspaceId });
  });

  return router;
}
