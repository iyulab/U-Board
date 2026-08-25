import { describe, it, expect, vi, afterEach } from 'vitest';
import { getApiBase } from './api-base.js';

describe('getApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns an empty string when VITE_API_BASE_URL is unset', () => {
    expect(getApiBase()).toBe('');
  });

  it('returns VITE_API_BASE_URL as-is when it has no trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr');
    expect(getApiBase()).toBe('https://api.board.u-platform.kr');
  });

  it('strips a trailing slash so callers can concatenate a leading-slash path safely', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr/');
    expect(getApiBase()).toBe('https://api.board.u-platform.kr');
  });
});
