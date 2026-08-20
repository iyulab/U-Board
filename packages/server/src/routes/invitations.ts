import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { findInvitationByToken, markInvitationAccepted, isInvitationUsable } from '../db/invitations.js';
import { findUserByEmail } from '../db/users.js';
import { addWorkspaceUser, findWorkspaceUser } from '../db/workspaces.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';

export function createInvitationsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();

  router.get('/:token', (req, res) => {
    const invitation = findInvitationByToken(db, req.params.token);
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
      hasAccount: Boolean(findUserByEmail(db, invitation.email)),
    });
  });

  router.post('/:token/accept', requireAuth(db, sessionSecret), (req: AuthedRequest, res) => {
    const invitation = findInvitationByToken(db, req.params.token);
    if (!invitation) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (!isInvitationUsable(invitation)) {
      res.status(410).json({ code: 'INVITATION_EXPIRED' });
      return;
    }
    if (findWorkspaceUser(db, invitation.workspaceId, req.userId!)) {
      res.status(409).json({ code: 'ALREADY_MEMBER' });
      return;
    }
    addWorkspaceUser(db, { workspaceId: invitation.workspaceId, userId: req.userId!, role: invitation.role });
    markInvitationAccepted(db, invitation.id);
    res.status(200).json({ workspaceId: invitation.workspaceId });
  });

  return router;
}
