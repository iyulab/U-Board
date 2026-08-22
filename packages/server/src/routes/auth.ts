import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { createUser, findUserByEmail, countUsers } from '../db/users.js';
import {
  createWorkspace,
  addWorkspaceUser,
  listWorkspacesForUser,
  type WorkspaceRole,
} from '../db/workspaces.js';
import {
  findInvitationByToken,
  markInvitationAcceptedIfUnused,
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

/** A signup gate that only the transaction can evaluate; carries the response it maps to. */
class SignupRejected extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
    this.name = 'SignupRejected';
  }
}

/** Postgres SQLSTATE for a UNIQUE constraint violation — thrown by the driver when the
 * concurrent-INSERT race on users.email is lost. */
const UNIQUE_VIOLATION = '23505';

/** Serializes the "am I the first user" bootstrap check against concurrent anonymous signups.
 * An arbitrary fixed key — `pg_advisory_xact_lock` just needs any bigint, held for the
 * transaction's lifetime and released automatically on commit/rollback. Without this, two
 * concurrent signups with no invitation could both observe countUsers() === 0 under Postgres's
 * default READ COMMITTED isolation and both try to become the first owner. */
const SIGNUP_BOOTSTRAP_LOCK_KEY = 727100;

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

      // Cheap advisory gates run first so a request that will be rejected never pays the bcrypt
      // cost (~250ms of CPU). Expiry and email-match can't change between this read and the
      // transaction below (they're immutable once an invitation is created), so re-checking them
      // there would be redundant — the only genuinely racy fact is "has this been redeemed
      // already", which markInvitationAcceptedIfUnused's conditional UPDATE handles atomically.
      if (await findUserByEmail(db, email)) {
        res.status(409).json({ code: 'EMAIL_TAKEN' });
        return;
      }

      let invitation: WorkspaceInvitation | undefined;
      if (invitationToken) {
        invitation =
          typeof invitationToken === 'string' ? await findInvitationByToken(db, invitationToken) : undefined;
        if (!invitation || !isInvitationUsable(invitation) || invitation.email !== normalizeEmail(email)) {
          res.status(410).json({ code: 'INVITATION_INVALID' });
          return;
        }
      } else if ((await countUsers(db)) > 0) {
        res.status(403).json({ code: 'SIGNUP_REQUIRES_INVITATION' });
        return;
      }

      const passwordHash = await hashPassword(password);

      let signedUp: { userId: string; workspaceId: string };
      try {
        signedUp = await db.withTransaction(async tx => {
          let workspaceId: string;
          let role: WorkspaceRole;
          if (invitation) {
            const claimed = await markInvitationAcceptedIfUnused(tx, invitation.id);
            if (!claimed) throw new SignupRejected(410, 'INVITATION_INVALID'); // a concurrent signup redeemed it first
            workspaceId = claimed.workspaceId;
            role = claimed.role;
          } else {
            await tx.query('SELECT pg_advisory_xact_lock($1)', [SIGNUP_BOOTSTRAP_LOCK_KEY]);
            if ((await countUsers(tx)) > 0) throw new SignupRejected(403, 'SIGNUP_REQUIRES_INVITATION');
            workspaceId = (await createWorkspace(tx, 'Default')).id;
            role = 'owner';
          }

          let user;
          try {
            user = await createUser(tx, { email, passwordHash, name });
          } catch (err) {
            if ((err as { code?: string }).code === UNIQUE_VIOLATION) throw new SignupRejected(409, 'EMAIL_TAKEN');
            throw err;
          }
          await addWorkspaceUser(tx, { workspaceId, userId: user.id, role });
          return { userId: user.id, workspaceId };
        });
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
      const user = await findUserByEmail(db, email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ code: 'INVALID_CREDENTIALS' });
        return;
      }
      const activeWorkspaceId = (await listWorkspacesForUser(db, user.id))[0]?.id ?? '';
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

  router.get(
    '/bootstrap-status',
    asyncHandler(async (_req, res) => {
      res.status(200).json({ hasAnyUser: (await countUsers(db)) > 0 });
    })
  );

  return router;
}
