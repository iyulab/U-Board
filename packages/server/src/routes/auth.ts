import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { createUser, findUserByEmail, countUsers } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { findInvitationByToken, markInvitationAccepted, isInvitationUsable } from '../db/invitations.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';
import { listWorkspacesForUser } from '../db/workspaces.js';

const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function createAuthRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();

  router.post('/signup', async (req, res) => {
    const { email, password, name, invitationToken } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }

    // Hash the password (async) BEFORE any check-then-write gating logic below, so that
    // nothing yields the event loop between a synchronous gate check (countUsers === 0 for
    // bootstrap, isInvitationUsable for invitation redemption) and the synchronous writes it
    // is meant to gate. Concurrent requests interleaving inside that gap could otherwise both
    // pass the same gate before either write lands (double-bootstrap owners, double-redeemed
    // invitation tokens).
    const passwordHash = await hashPassword(password);

    if (findUserByEmail(db, email)) {
      res.status(409).json({ code: 'EMAIL_TAKEN' });
      return;
    }

    let workspaceId: string;
    let role: 'owner' | 'member';
    const invitation = typeof invitationToken === 'string' ? findInvitationByToken(db, invitationToken) : undefined;

    if (invitationToken) {
      if (!invitation || !isInvitationUsable(invitation) || invitation.email !== email) {
        res.status(410).json({ code: 'INVITATION_INVALID' });
        return;
      }
      workspaceId = invitation.workspaceId;
      role = invitation.role;
    } else {
      if (countUsers(db) > 0) {
        res.status(403).json({ code: 'SIGNUP_REQUIRES_INVITATION' });
        return;
      }
      workspaceId = createWorkspace(db, 'Default').id;
      role = 'owner';
    }

    const user = createUser(db, { email, passwordHash, name });
    addWorkspaceUser(db, { workspaceId, userId: user.id, role });
    if (invitation) markInvitationAccepted(db, invitation.id);

    const token = signSession({ userId: user.id, activeWorkspaceId: workspaceId, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, { httpOnly: true, maxAge: SESSION_COOKIE_MAX_AGE_MS, sameSite: 'lax' });
    res.status(201).json({ userId: user.id, workspaceId });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const user = findUserByEmail(db, email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ code: 'INVALID_CREDENTIALS' });
      return;
    }
    const activeWorkspaceId = listWorkspacesForUser(db, user.id)[0]?.id ?? '';
    const token = signSession({ userId: user.id, activeWorkspaceId, issuedAt: Date.now() }, sessionSecret);
    res.cookie(SESSION_COOKIE_NAME, token, { httpOnly: true, maxAge: SESSION_COOKIE_MAX_AGE_MS, sameSite: 'lax' });
    res.status(200).json({ userId: user.id, activeWorkspaceId });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(204).end();
  });

  router.get('/bootstrap-status', (_req, res) => {
    res.status(200).json({ hasAnyUser: countUsers(db) > 0 });
  });

  return router;
}
