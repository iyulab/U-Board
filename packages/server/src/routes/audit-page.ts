import type { AuditPage } from '../db/audit.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Reads `?limit=&before=` for an audit listing; `undefined` when either is malformed. */
export function readAuditPage(query: Record<string, unknown>): AuditPage | undefined {
  const { limit: rawLimit, before } = query;
  let limit = DEFAULT_LIMIT;
  if (rawLimit !== undefined) {
    if (typeof rawLimit !== 'string' || !/^\d+$/.test(rawLimit)) return undefined;
    limit = Number(rawLimit);
    if (limit < 1 || limit > MAX_LIMIT) return undefined;
  }
  if (before !== undefined && (typeof before !== 'string' || !/^\d{1,18}$/.test(before))) return undefined;
  return { limit, before: before as string | undefined };
}
