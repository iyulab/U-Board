import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionPayload {
  userId: string;
  activeWorkspaceId: string;
  issuedAt: number;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifySession(cookieValue: string, secret: string): SessionPayload | null {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expectedSignature = createHmac('sha256', secret).update(body).digest('base64url');
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (Date.now() - payload.issuedAt > SESSION_TTL_MS) return null;
  return payload;
}
