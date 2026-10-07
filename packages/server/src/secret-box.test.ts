import { describe, it, expect } from 'vitest';
import { secretBox, isSealed, SecretUnreadableError, UNSEALED } from './secret-box.js';

const KEY = 'a-secrets-key-of-at-least-32-characters';

describe('secretBox', () => {
  it('seals a secret so the stored text does not contain it, and opens it again', () => {
    const box = secretBox(KEY);
    const stored = box.seal('plant-api-token');
    expect(isSealed(stored)).toBe(true);
    expect(stored).not.toContain('plant-api-token');
    expect(box.open(stored)).toBe('plant-api-token');
  });

  it('seals the same secret differently each time', () => {
    const box = secretBox(KEY);
    expect(box.seal('same')).not.toBe(box.seal('same'));
  });

  it('refuses to open a value sealed under another key, or altered', () => {
    const stored = secretBox(KEY).seal('plant-api-token');
    expect(() => secretBox(KEY + '!').open(stored)).toThrow(SecretUnreadableError);
    const altered = stored.slice(0, -2) + (stored.endsWith('AA') ? 'BB' : 'AA');
    expect(() => secretBox(KEY).open(altered)).toThrow(SecretUnreadableError);
  });

  it('returns text that was never sealed as it is', () => {
    expect(secretBox(KEY).open('stored-before-sealing')).toBe('stored-before-sealing');
  });

  it('refuses a key shorter than 32 characters', () => {
    expect(() => secretBox('short')).toThrow(/at least 32/);
  });

  it('has an unsealed box for tests that stores as given', () => {
    expect(UNSEALED.seal('x')).toBe('x');
  });
});
