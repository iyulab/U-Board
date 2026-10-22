import { defineConfig } from 'vitest/config';

// Deliberately its own config, not vitest.config.ts with an override flag — `vitest run <path>`
// still applies `test.exclude`, so pointing that command at the very file it excludes just
// reports "No test files found". See vitest.config.ts for why the file is excluded from `npm
// test` in the first place.
export default defineConfig({
  test: {
    include: ['src/**/*.postgres.test.ts'],
    // Each concurrency test runs ten rounds of racing transactions against a real Postgres in a container — tens of
    // round trips, which take 6–7 s on a busy machine. The invariant is what is checked, not the speed; the default
    // 5 s cut them off mid-round.
    testTimeout: 30_000,
  },
});
