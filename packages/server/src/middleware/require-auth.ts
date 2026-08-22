import type { CookieOptions, Request, Response, NextFunction, RequestHandler } from 'express';
import type { DbClient } from '../db.js';
import { verifySession } from '../auth/session.js';
import { findUserById } from '../db/users.js';
import { asyncHandler } from './async-handler.js';

export const SESSION_COOKIE_NAME = 'ub_session';

/** Must stay in step with `SESSION_TTL_MS` in `auth/session.ts` — the cookie should not
 *  outlive the signature's own validity window. */
export const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The single definition of how the session cookie is written. Every set-site uses this so the
 * attributes can never drift apart between signup, login and workspace switch.
 *
 * `secure` is on outside development only, because a dev/test server is plain HTTP and the
 * browser would silently drop a `Secure` cookie there.
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

/**
 * The subset of the above that a `res.clearCookie` must repeat for browsers to match the
 * cookie being cleared. Deliberately NOT `sessionCookieOptions()`: Express merges the options
 * into the clearing cookie, so carrying `maxAge` over would re-issue a 30-day expiry instead
 * of expiring it.
 */
export function clearSessionCookieOptions(): CookieOptions {
  return {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

export interface AuthedRequest extends Request {
  userId?: string;
  activeWorkspaceId?: string;
}

export function requireAuth(db: DbClient, sessionSecret: string): RequestHandler {
  return asyncHandler(async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const cookieValue = req.cookies?.[SESSION_COOKIE_NAME];
    if (!cookieValue) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    const payload = verifySession(cookieValue, sessionSecret);
    if (!payload) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    const user = await findUserById(db, payload.userId);
    if (!user) {
      res.status(401).json({ code: 'UNAUTHENTICATED' });
      return;
    }
    req.userId = payload.userId;
    req.activeWorkspaceId = payload.activeWorkspaceId;
    next();
  });
}
