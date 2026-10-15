import { createHash, randomBytes } from 'node:crypto';

/** Every API token starts so — a program, a log scanner or a person can tell one apart from other secrets. */
export const API_TOKEN_PREFIX = 'ubt_';

export function hashApiToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

/** A new token: its text (shown once), the hash kept of it, and the ending the console lists it by. */
export function generateApiToken(): { plain: string; hash: string; mask: string } {
  const plain = API_TOKEN_PREFIX + randomBytes(32).toString('base64url');
  return { plain, hash: hashApiToken(plain), mask: `${API_TOKEN_PREFIX}…${plain.slice(-6)}` };
}
