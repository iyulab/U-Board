import { describe, it, expect } from 'vitest';
import { isPlausibleEmail, normalizeEmail } from './email.js';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Alice@X.com ')).toBe('alice@x.com');
  });
});

describe('isPlausibleEmail', () => {
  it.each(['a@x.com', ' a.b+c@x.com ', 'user@test.com'])('accepts %s', value => {
    expect(isPlausibleEmail(value)).toBe(true);
  });

  it.each(['', 'alice', 'alice@', '@x.com', 'alice@x', 'a b@x.com', 'a@b@x.com', `${'a'.repeat(250)}@x.com`])('rejects %j', value => {
    expect(isPlausibleEmail(value)).toBe(false);
  });
});
