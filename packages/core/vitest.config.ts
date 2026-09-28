import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "paths" entry — vitest resolves modules through Vite, which
      // doesn't read tsconfig "paths" on its own, so the alias has to be declared here too.
      '@iyulab/u-board': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // `@testing-library/react` unmounts rendered trees after each test only when it finds a
    // global `afterEach`; without globals, renders would leak from one test into the next.
    globals: true,
    // Without this, vitest's default glob also picks up e2e/*.spec.ts — those use
    // @playwright/test's own `test`/`expect`, which vitest can't run (see playwright.config.ts;
    // upstream/u-widgets' vitest config scopes the same way for the same reason).
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
