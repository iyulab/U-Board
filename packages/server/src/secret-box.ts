import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/** Seals the secrets the server stores on others' behalf — connector credentials — so a copy of the
 *  database (a backup, a dump, a copied volume) does not hand them out. */
export interface SecretBox {
  seal(plain: string): string;
  /** The secret `stored` holds. Text that was never sealed comes back as it is — a value stored
   *  before sealing existed, until `sealStoredConnectorSecrets` reseals it. */
  open(stored: string): string;
}

/** Stores secrets as given — for tests, which have no key to keep. */
export const UNSEALED: SecretBox = { seal: plain => plain, open: stored => stored };

const PREFIX = 'sealed:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;
export const MIN_SECRETS_KEY_LENGTH = 32;

/** Thrown when a sealed value cannot be opened — sealed under another key, or altered. */
export class SecretUnreadableError extends Error {
  constructor() {
    super('a stored secret cannot be opened with this key');
  }
}

export function isSealed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/** A box keyed by `key` (an installation setting): AES-256-GCM under a key derived from it with
 *  HKDF-SHA256, a fresh IV per value, stored as `sealed:v1:<base64url(iv | tag | ciphertext)>`. */
export function secretBox(key: string): SecretBox {
  if (key.length < MIN_SECRETS_KEY_LENGTH) {
    throw new Error(`UBOARD_SECRETS_KEY must be at least ${MIN_SECRETS_KEY_LENGTH} characters`);
  }
  const aesKey = Buffer.from(hkdfSync('sha256', key, 'u-board', 'connector-secrets', 32));
  return {
    seal(plain) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
    },
    open(stored) {
      if (!isSealed(stored)) return stored;
      const raw = Buffer.from(stored.slice(PREFIX.length), 'base64url');
      try {
        const decipher = createDecipheriv('aes-256-gcm', aesKey, raw.subarray(0, IV_BYTES));
        decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
        return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString('utf8');
      } catch {
        throw new SecretUnreadableError();
      }
    },
  };
}
