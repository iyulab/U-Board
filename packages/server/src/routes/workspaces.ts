import { Router, type Response } from 'express';
import type { AppConfig } from '../app.js';
import {
  listWorkspacesForUser,
  listWorkspaceMembers,
  findWorkspaceUser,
  createWorkspace,
  addWorkspaceUser,
  changeWorkspaceMembership,
  findWorkspaceById,
  type WorkspaceRole,
} from '../db/workspaces.js';
import { createInvitation, listPendingInvitations, revokeInvitation } from '../db/invitations.js';
import { findUserByEmail, findUserById } from '../db/users.js';
import { isPlausibleEmail } from '../db/email.js';
import { requireAuth, type AuthedRequest, SESSION_COOKIE_NAME, sessionCookieOptions } from '../middleware/require-auth.js';
import { requireWorkspaceOwner, requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { signSession } from '../auth/session.js';

export function createWorkspacesRouter(config: AppConfig): Router {
  const { db, sessionSecret, publicUrl, sendInvitationEmail } = config;
  const router = Router();
  router.use(requireAuth(db, sessionSecret));

  router.get('/me', async (req: AuthedRequest, res) => {
    const workspaces = await listWorkspacesForUser(db, req.userId!);
    // The session names the workspace it last switched to, but membership can end while the session
    // lives on (an owner removed this user, or they left). Answer with one they still belong to —
    // or none — instead of a workspace every request would then refuse.
    const activeWorkspaceId = workspaces.some(w => w.id === req.activeWorkspaceId)
      ? req.activeWorkspaceId
      : (workspaces[0]?.id ?? '');
    res.status(200).json({ userId: req.userId, activeWorkspaceId, workspaces });
  });

  router.post('/', async (req: AuthedRequest, res) => {
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
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(req));
    res.status(201).json({ id: workspace.id, name: workspace.name, activeWorkspaceId: workspace.id });
  });

  router.get('/:workspaceId/members', requireWorkspaceMember(db), async (req, res) => {
    res.status(200).json({ members: await listWorkspaceMembers(db, req.params.workspaceId) });
  });

  // An owner removes anyone; any member may remove themselves (leaving). Either way the workspace
  // keeps at least one owner.
  router.delete('/:workspaceId/members/:userId', requireWorkspaceMember(db), async (req: AuthedRequest<{ workspaceId: string; userId: string }>, res) => {
    const { workspaceId, userId } = req.params;
    if (userId !== req.userId && (await findWorkspaceUser(db, workspaceId, req.userId!))?.role !== 'owner') {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    const result = await changeWorkspaceMembership(db, { workspaceId, userId, change: { kind: 'remove' } });
    if (result === 'changed') {
      console.log(`[workspaces] ${userId === req.userId ? `${userId} left` : `${req.userId} removed ${userId} from`} ${workspaceId}`);
    }
    sendMembershipResult(res, result);
  });

  router.patch('/:workspaceId/members/:userId', requireWorkspaceOwner(db), async (req: AuthedRequest<{ workspaceId: string; userId: string }>, res) => {
    const { role } = req.body ?? {};
    if (!isWorkspaceRole(role)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const { workspaceId, userId } = req.params;
    const result = await changeWorkspaceMembership(db, { workspaceId, userId, change: { kind: 'set-role', role } });
    if (result === 'changed') console.log(`[workspaces] ${req.userId} set ${userId} to ${role} in ${workspaceId}`);
    sendMembershipResult(res, result);
  });

  router.get('/:workspaceId/invitations', requireWorkspaceOwner(db), async (req: AuthedRequest<{ workspaceId: string }>, res) => {
    res.status(200).json({ invitations: await listPendingInvitations(db, req.params.workspaceId) });
  });

  router.delete('/:workspaceId/invitations/:invitationId', requireWorkspaceOwner(db), async (req: AuthedRequest<{ workspaceId: string; invitationId: string }>, res) => {
    if (!(await revokeInvitation(db, req.params.workspaceId, req.params.invitationId))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).end();
  });

  router.post('/:workspaceId/invitations', requireWorkspaceOwner(db), async (req: AuthedRequest<{ workspaceId: string }>, res) => {
    const { email, role } = req.body ?? {};
    if (typeof email !== 'string' || !isPlausibleEmail(email) || !isWorkspaceRole(role)) {
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
    let emailed = false;
    if (publicUrl && sendInvitationEmail) {
      try {
        const [workspace, inviter] = await Promise.all([findWorkspaceById(db, invitation.workspaceId), findUserById(db, req.userId!)]);
        await sendInvitationEmail({
          email: invitation.email,
          invitationId: invitation.id,
          workspaceName: workspace?.name ?? '',
          inviterName: inviter?.name ?? '',
          role: invitation.role,
          link: `${publicUrl}/invite/${invitation.token}`,
          expiresAt: invitation.expiresAt,
        });
        emailed = true;
      } catch (err) {
        // The invitation stands either way — the owner still gets the link to pass on by hand.
        console.error('[workspaces] sendInvitationEmail failed:', err);
      }
    }
    res.status(201).json({ token: invitation.token, expiresAt: invitation.expiresAt, emailed });
  });

  router.post('/:workspaceId/switch', requireWorkspaceMember(db), (req: AuthedRequest<{ workspaceId: string }>, res) => {
    const token = signSession({ userId: req.userId!, activeWorkspaceId: req.params.workspaceId, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(req));
    res.status(200).json({ activeWorkspaceId: req.params.workspaceId });
  });

  return router;
}

function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return value === 'owner' || value === 'member';
}

function sendMembershipResult(res: Response, result: Awaited<ReturnType<typeof changeWorkspaceMembership>>): void {
  if (result === 'not-member') res.status(404).json({ code: 'NOT_FOUND' });
  else if (result === 'last-owner') res.status(409).json({ code: 'LAST_OWNER' });
  else res.status(204).end();
}
