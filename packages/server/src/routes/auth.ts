import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { createUser, findUserByEmail, countUsers } from '../db/users.js';
import { createWorkspace, addWorkspaceUser, type WorkspaceRole } from '../db/workspaces.js';
import {
  findInvitationByToken,
  markInvitationAccepted,
  isInvitationUsable,
  type WorkspaceInvitation,
} from '../db/invitations.js';
import { normalizeEmail } from '../db/email.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signSession } from '../auth/session.js';
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from '../middleware/require-auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { listWorkspacesForUser } from '../db/workspaces.js';

/** A signup gate that only the transaction can evaluate; carries the response it maps to. */
class SignupRejected extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
    this.name = 'SignupRejected';
  }
}

export function createAuthRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();

  router.post(
    '/signup',
    asyncHandler(async (req, res) => {
      const { email, password, name, invitationToken } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        res.status(400).json({ code: 'INVALID_INPUT' });
        return;
      }

      // Cheap synchronous gates run first so a request that will be rejected never pays the
      // bcrypt cost (~250ms of CPU). They are advisory only — the authoritative versions run
      // again inside the transaction below, since `await hashPassword` yields the event loop
      // in between and a concurrent signup could land in that window.
      if (findUserByEmail(db, email)) {
        res.status(409).json({ code: 'EMAIL_TAKEN' });
        return;
      }

      let invitation: WorkspaceInvitation | undefined;
      if (invitationToken) {
        invitation =
          typeof invitationToken === 'string' ? findInvitationByToken(db, invitationToken) : undefined;
        if (!invitation || !isInvitationUsable(invitation) || invitation.email !== normalizeEmail(email)) {
          res.status(410).json({ code: 'INVITATION_INVALID' });
          return;
        }
      } else if (countUsers(db) > 0) {
        res.status(403).json({ code: 'SIGNUP_REQUIRES_INVITATION' });
        return;
      }

      const passwordHash = await hashPassword(password);

      // Everything from here on is one atomic unit: the gates and the writes they guard cannot
      // be interleaved (better-sqlite3 transactions are fully synchronous — no `await` may
      // appear inside, which is why the hash is computed above and passed in), and any error
      // rolls the whole sequence back rather than leaving a half-created workspace behind.
      //
      // Scope: this makes the check-then-write uninterruptible within this Node process, which
      // is what the deployment model assumes (one process owns the SQLite file). Two server
      // processes sharing one file would need `db.transaction(...).immediate()` to serialize
      // the read side as well.
      const runSignup = db.transaction((hash: string) => {
        if (findUserByEmail(db, email)) throw new SignupRejected(409, 'EMAIL_TAKEN');

        let workspaceId: string;
        let role: WorkspaceRole;
        if (invitation) {
          const current = findInvitationByToken(db, invitation.token);
          if (!current || !isInvitationUsable(current)) throw new SignupRejected(410, 'INVITATION_INVALID');
          workspaceId = current.workspaceId;
          role = current.role;
        } else {
          if (countUsers(db) > 0) throw new SignupRejected(403, 'SIGNUP_REQUIRES_INVITATION');
          workspaceId = createWorkspace(db, 'Default').id;
          role = 'owner';
        }

        const user = createUser(db, { email, passwordHash: hash, name });
        addWorkspaceUser(db, { workspaceId, userId: user.id, role });
        if (invitation) markInvitationAccepted(db, invitation.id);
        return { userId: user.id, workspaceId };
      });

      let signedUp: { userId: string; workspaceId: string };
      try {
        signedUp = runSignup(passwordHash);
      } catch (err) {
        if (err instanceof SignupRejected) {
          res.status(err.status).json({ code: err.code });
          return;
        }
        throw err;
      }

      const token = signSession(
        { userId: signedUp.userId, activeWorkspaceId: signedUp.workspaceId, issuedAt: Date.now() },
        sessionSecret
      );
      res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
      res.status(201).json(signedUp);
    })
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
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
      res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
      res.status(200).json({ userId: user.id, activeWorkspaceId });
    })
  );

  router.post('/logout', (_req, res) => {
    // The clearing cookie must repeat the attributes the cookie was set with, or some browsers
    // treat it as a different cookie and keep the session alive.
    res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
    res.status(204).end();
  });

  router.get('/bootstrap-status', (_req, res) => {
    res.status(200).json({ hasAnyUser: countUsers(db) > 0 });
  });

  return router;
}
