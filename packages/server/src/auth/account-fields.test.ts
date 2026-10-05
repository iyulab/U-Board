import { describe, it, expect } from 'vitest';
import { checkPassword, normalizeName } from './account-fields.js';

describe('checkPassword', () => {
  it('accepts 8 characters up to 72 bytes', () => {
    expect(checkPassword('12345678')).toBeUndefined();
    expect(checkPassword('a'.repeat(72))).toBeUndefined();
  });

  it('counts characters, not UTF-16 units, toward the minimum', () => {
    // Seven emoji are 14 UTF-16 units but seven characters.
    expect(checkPassword('🙂'.repeat(7))).toBe('PASSWORD_TOO_SHORT');
  });

  it('rejects fewer than 8 characters and more than 72 UTF-8 bytes', () => {
    expect(checkPassword('1234567')).toBe('PASSWORD_TOO_SHORT');
    expect(checkPassword('a'.repeat(73))).toBe('PASSWORD_TOO_LONG');
    expect(checkPassword('가'.repeat(25))).toBe('PASSWORD_TOO_LONG');
  });
});

describe('normalizeName', () => {
  it('trims, and refuses a blank or overlong name', () => {
    expect(normalizeName('  Kim  ')).toBe('Kim');
    expect(normalizeName('   ')).toBeUndefined();
    expect(normalizeName('a'.repeat(101))).toBeUndefined();
    expect(normalizeName('a'.repeat(100))).toBe('a'.repeat(100));
  });
});
