import { Router } from 'express';
import type { AppConfig } from '../app.js';
import {
  listWorkspacesForUser,
  listWorkspaceMembers,
  findWorkspaceUser,
  createWorkspace,
  addWorkspaceUser,
} from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { findUserByEmail } from '../db/users.js';
import { requireAuth, type AuthedRequest, SESSION_COOKIE_NAME, sessionCookieOptions } from '../middleware/require-auth.js';
import { requireWorkspaceOwner, requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { signSession } from '../auth/session.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createWorkspacesRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();
  router.use(requireAuth(db, sessionSecret));

  router.get('/me', asyncHandler(async (req: AuthedRequest, res) => {
    res.status(200).json({
      userId: req.userId,
      activeWorkspaceId: req.activeWorkspaceId,
      workspaces: await listWorkspacesForUser(db, req.userId!),
    });
  }));

  router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const workspace = await db.withTransaction(async tx => {
      const workspace = await createWorkspace(tx, name.trim());
      await addWorkspaceUser(tx, { workspaceId: workspace.id, userId: req.userId!, role: 'owner' });
      return workspace;
    });
    const token = signSession({ userId: req.userId!, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.status(201).json({ id: workspace.id, name: workspace.name, activeWorkspaceId: workspace.id });
  }));

  router.get('/:workspaceId/members', requireWorkspaceMember(db), asyncHandler(async (req, res) => {
    res.status(200).json({ members: await listWorkspaceMembers(db, req.params.workspaceId) });
  }));

  router.post('/:workspaceId/invitations', requireWorkspaceOwner(db), asyncHandler(async (req: AuthedRequest, res) => {
    const { email, role } = req.body ?? {};
    if (typeof email !== 'string' || (role !== 'owner' && role !== 'member')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    // Re-inviting someone who already belongs here is a conflict, not a second invitation —
    // otherwise a redundant token is minted that can only ever resolve to ALREADY_MEMBER.
    const existingUser = await findUserByEmail(db, email);
    if (existingUser && (await findWorkspaceUser(db, req.params.workspaceId, existingUser.id))) {
      res.status(409).json({ code: 'ALREADY_MEMBER' });
      return;
    }
    const invitation = await createInvitation(db, { workspaceId: req.params.workspaceId, email, role, invitedByUserId: req.userId! });
    res.status(201).json({ token: invitation.token, expiresAt: invitation.expiresAt });
  }));

  router.post('/:workspaceId/switch', requireWorkspaceMember(db), (req: AuthedRequest, res) => {
    const token = signSession({ userId: req.userId!, activeWorkspaceId: req.params.workspaceId, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.status(200).json({ activeWorkspaceId: req.params.workspaceId });
  });

  return router;
}
