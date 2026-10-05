/** Server-side rules for the fields of an account. The console checks the same limits for quick
 *  feedback, but these are the ones that hold — every request reaches the server, not every request
 *  comes through the console. */

export const PASSWORD_MIN_CHARACTERS = 8;
/** bcrypt reads only the first 72 bytes of its input; a longer password would match any other that
 *  shares those bytes, so it is refused rather than silently cut. */
export const PASSWORD_MAX_BYTES = 72;
export const NAME_MAX_CHARACTERS = 100;

export type PasswordProblem = 'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_LONG';

/** The reason a password is refused, or undefined when it is acceptable. Length counts characters
 *  (code points), not UTF-16 units; the upper limit is bytes, which is what bcrypt sees. */
export function checkPassword(password: string): PasswordProblem | undefined {
  if ([...password].length < PASSWORD_MIN_CHARACTERS) return 'PASSWORD_TOO_SHORT';
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) return 'PASSWORD_TOO_LONG';
  return undefined;
}

/** A display name, trimmed — or undefined when it is blank or longer than the limit. */
export function normalizeName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed === '' || [...trimmed].length > NAME_MAX_CHARACTERS) return undefined;
  return trimmed;
}
