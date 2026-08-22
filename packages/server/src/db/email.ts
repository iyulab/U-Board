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
