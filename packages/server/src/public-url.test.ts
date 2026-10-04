import { describe, it, expect } from 'vitest';
import { publicUrlFromEnv } from './public-url.js';

describe('publicUrlFromEnv', () => {
  it('is undefined when unset or empty', () => {
    expect(publicUrlFromEnv(undefined)).toBeUndefined();
    expect(publicUrlFromEnv('')).toBeUndefined();
  });

  it('returns the origin, without a trailing slash', () => {
    expect(publicUrlFromEnv('https://board.example.com')).toBe('https://board.example.com');
    expect(publicUrlFromEnv('https://board.example.com/')).toBe('https://board.example.com');
    expect(publicUrlFromEnv('http://localhost:4000')).toBe('http://localhost:4000');
  });

  it.each(['board.example.com', 'ftp://board.example.com', 'https://board.example.com/console', 'https://board.example.com/?a=1', 'https://board.example.com/#top'])(
    'rejects %s',
    value => {
      expect(() => publicUrlFromEnv(value)).toThrow(/UBOARD_PUBLIC_URL/);
    }
  );
});
