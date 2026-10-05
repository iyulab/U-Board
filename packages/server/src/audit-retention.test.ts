import { describe, it, expect } from 'vitest';
import { auditRetentionDaysFromEnv, DEFAULT_AUDIT_RETENTION_DAYS } from './audit-retention.js';

describe('auditRetentionDaysFromEnv', () => {
  it('defaults when unset or empty', () => {
    expect(auditRetentionDaysFromEnv(undefined)).toBe(DEFAULT_AUDIT_RETENTION_DAYS);
    expect(auditRetentionDaysFromEnv('')).toBe(DEFAULT_AUDIT_RETENTION_DAYS);
  });

  it('reads a whole number of days', () => {
    expect(auditRetentionDaysFromEnv('365')).toBe(365);
  });

  it('refuses anything else', () => {
    for (const value of ['0', '-1', '1.5', 'forever']) {
      expect(() => auditRetentionDaysFromEnv(value)).toThrow(/UBOARD_AUDIT_RETENTION_DAYS/);
    }
  });
});
