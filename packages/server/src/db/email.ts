/**
 * Canonical form for an email address as this system stores and compares it.
 *
 * A database's default column collation is typically case-sensitive, so `Alice@x.com` and
 * `alice@x.com` would otherwise be two different accounts. Rather than a case-insensitive
 * collation/index at the schema level, every email is normalized at the boundary where it first
 * enters the system (repository writes and lookups) so only one form is ever persisted or
 * compared.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A deliberately loose shape check — one `@`, something on each side, a dot in the domain, no
 *  whitespace, within the 254-character limit for an address. It catches typos and garbage at the
 *  boundary (an invitation emailed to `alice` would fail at the provider, and an account under it
 *  could never receive a reset code); whether the mailbox exists is only learned by sending. */
export function isPlausibleEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
