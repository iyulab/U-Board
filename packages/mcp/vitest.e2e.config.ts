import { defineConfig } from 'vitest/config';

// The tests that drive a real browser — run by `test:e2e`, like the other packages' browser suites.
export default defineConfig({
  test: { include: ['src/**/*.e2e.test.ts'], testTimeout: 30_000, hookTimeout: 60_000 },
});
