import type { CookieOptions, Request, Response, NextFunction, RequestHandler } from 'express';
import type { DbClient } from '../db.js';
import { verifySession } from '../auth/session.js';
import { findUserById } from '../db/users.js';

export const SESSION_COOKIE_NAME = 'ub_session';

/** Must stay in step with `SESSION_TTL_MS` in `auth/session.ts` — the cookie should not
 *  outlive the signature's own validity window. */
export const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Whether the browser reached this server over HTTPS — directly, or through a proxy that
 * terminated TLS and said so in `X-Forwarded-Proto`. A `Secure` cookie is dropped by the browser on
 * a plain-HTTP page, so the session cookie is `Secure` exactly when the page is HTTPS: a plain-HTTP
 * installation (dev, or an intranet without TLS) can still sign in. A client that forges the
 * header only changes the attributes of its own cookie.
 */
function isHttps(req: Request): boolean {
  return req.secure || req.get('X-Forwarded-Proto')?.split(',')[0].trim() === 'https';
}

/**
 * The single definition of how the session cookie is written. Every set-site uses this so the
 * attributes can never drift apart between signup, login and workspace switch.
 */
export function sessionCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    sameSite: 'lax' as const,
    secure: isHttps(req),
  };
}

/**
 * The subset of the above that a `res.clearCookie` must repeat for browsers to match the
 * cookie being cleared. Deliberately NOT `sessionCookieOptions()`: Express merges the options
 * into the clearing cookie, so carrying `maxAge` over would re-issue a 30-day expiry instead
 * of expiring it.
 */
export function clearSessionCookieOptions(req: Request): CookieOptions {
  return {
    sameSite: 'lax' as const,
    secure: isHttps(req),
  };
}

export interface AuthedRequest<P = Request['params']> extends Request<P> {
  userId?: string;
  activeWorkspaceId?: string;
}

export function requireAuth(db: DbClient, sessionSecret: string): RequestHandler {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
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
  };
}
