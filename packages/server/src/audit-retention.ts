import type { DbClient } from './db.js';
import { purgeAuditEventsBefore } from './db/audit.js';

/** How long audit events are kept when `UBOARD_AUDIT_RETENTION_DAYS` is unset — the period GitHub
 *  keeps an organization's audit log for. */
export const DEFAULT_AUDIT_RETENTION_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Reads `UBOARD_AUDIT_RETENTION_DAYS`: a whole number of days, at least 1. Unset or empty means the
 *  default; anything else fails startup rather than keeping records for a period nobody chose. */
export function auditRetentionDaysFromEnv(value: string | undefined): number {
  if (!value) return DEFAULT_AUDIT_RETENTION_DAYS;
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error(`UBOARD_AUDIT_RETENTION_DAYS must be a whole number of days, at least 1 (got "${value}")`);
  }
  return Number(value);
}

/** Purges events older than the retention period now and then once a day. The timer does not keep
 *  the process alive, and a server that is scaled to zero purges again when it next starts. */
export function scheduleAuditPurge(db: DbClient, retentionDays: number): void {
  const purge = () =>
    purgeAuditEventsBefore(db, new Date(Date.now() - retentionDays * DAY_MS)).catch(err => {
      console.error('[audit] purging expired events failed:', err);
    });
  void purge();
  setInterval(purge, DAY_MS).unref();
}
