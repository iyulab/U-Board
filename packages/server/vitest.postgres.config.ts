import { defineConfig } from 'vitest/config';

// Deliberately its own config, not vitest.config.ts with an override flag — `vitest run <path>`
// still applies `test.exclude`, so pointing that command at the very file it excludes just
// reports "No test files found". See vitest.config.ts for why the file is excluded from `npm
// test` in the first place.
export default defineConfig({
  test: {
    include: ['src/routes/auth.postgres.test.ts'],
  },
});
