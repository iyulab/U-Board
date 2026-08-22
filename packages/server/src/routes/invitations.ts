import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { findInvitationByToken, markInvitationAccepted, isInvitationUsable } from '../db/invitations.js';
import { findUserByEmail, findUserById } from '../db/users.js';
import { normalizeEmail } from '../db/email.js';
import { addWorkspaceUser, findWorkspaceUser } from '../db/workspaces.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createInvitationsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();

  router.get('/:token', asyncHandler(async (req, res) => {
    const invitation = await findInvitationByToken(db, req.params.token);
    if (!invitation) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (!isInvitationUsable(invitation)) {
      res.status(410).json({ code: 'INVITATION_EXPIRED' });
      return;
    }
    res.status(200).json({
      email: invitation.email,
      workspaceId: invitation.workspaceId,
      hasAccount: Boolean(await findUserByEmail(db, invitation.email)),
    });
  }));

  router.post('/:token/accept', requireAuth(db, sessionSecret), asyncHandler(async (req: AuthedRequest, res) => {
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
    await addWorkspaceUser(db, { workspaceId: invitation.workspaceId, userId: req.userId!, role: invitation.role });
    await markInvitationAccepted(db, invitation.id);
    res.status(200).json({ workspaceId: invitation.workspaceId });
  }));

  return router;
}
