import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { findInvitationByToken, markInvitationAcceptedIfUnused, isInvitationUsable } from '../db/invitations.js';
import { findUserByEmail, findUserById } from '../db/users.js';
import { normalizeEmail } from '../db/email.js';
import { addWorkspaceUser, findWorkspaceById, findWorkspaceUser } from '../db/workspaces.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';

export function createInvitationsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();

  router.get('/:token', async (req, res) => {
    const invitation = await findInvitationByToken(db, req.params.token);
    if (!invitation) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (!isInvitationUsable(invitation)) {
      res.status(410).json({ code: 'INVITATION_EXPIRED' });
      return;
    }
    // The same facts the invitation email carries — the token holder already has them that way.
    const [workspace, inviter, account] = await Promise.all([
      findWorkspaceById(db, invitation.workspaceId),
      findUserById(db, invitation.invitedByUserId),
      findUserByEmail(db, invitation.email),
    ]);
    res.status(200).json({
      email: invitation.email,
      workspaceId: invitation.workspaceId,
      workspaceName: workspace?.name ?? '',
      inviterName: inviter?.name ?? '',
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      hasAccount: Boolean(account),
    });
  });

  router.post('/:token/accept', requireAuth(db, sessionSecret), async (req: AuthedRequest<{ token: string }>, res) => {
    const invitation = await findInvitationByToken(db, req.params.token);
    if (!invitation) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (!isInvitationUsable(invitation)) {
      res.status(410).json({ code: 'INVITATION_EXPIRED' });
      return;
    }
    const user = await findUserById(db, req.userId!);
    // An invitation is addressed to one specific email, and `createInvitation` takes an
    // arbitrary role — so a forwarded/leaked owner-role link must not let whoever happens to
    // be logged in redeem it. `POST /auth/signup` enforces the same match for the other
    // redemption path; both return the identical 410 INVITATION_INVALID.
    if (!user || normalizeEmail(invitation.email) !== normalizeEmail(user.email)) {
      res.status(410).json({ code: 'INVITATION_INVALID' });
      return;
    }
    if (await findWorkspaceUser(db, invitation.workspaceId, req.userId!)) {
      res.status(409).json({ code: 'ALREADY_MEMBER' });
      return;
    }
    // Claim and join as one transaction: the conditional claim loses to a concurrent redemption
    // and to an owner revoking the invitation in between (the row is gone), so neither can admit
    // a member the invitation no longer allows.
    const joined = await db.withTransaction(async tx => {
      const claimed = await markInvitationAcceptedIfUnused(tx, invitation.id);
      if (!claimed) return false;
      await addWorkspaceUser(tx, { workspaceId: claimed.workspaceId, userId: req.userId!, role: claimed.role });
      return true;
    });
    if (!joined) {
      res.status(410).json({ code: 'INVITATION_EXPIRED' });
      return;
    }
    res.status(200).json({ workspaceId: invitation.workspaceId });
  });

  return router;
}
