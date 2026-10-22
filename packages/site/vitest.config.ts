import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Without this, vitest's default glob also picks up e2e/*.spec.ts — those use @playwright/test's own
    // `test`/`expect`, which vitest can't run (see playwright.config.ts; core's vitest config scopes the same way).
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
