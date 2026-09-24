import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `auth.postgres.test.ts` starts a real Postgres container via testcontainers — running it
    // in the same parallel batch as every other file's PGlite startup starves both (PGlite is
    // WASM and CPU-hungry to spin up, one instance per test file — see
    // src/test-support/test-db.ts — and a Docker container startup in that same window turned
    // occasional timeouts into most of the suite failing). Run it separately via
    // `npm run test:postgres` instead — mirrors this monorepo's existing `test` vs. `test:e2e`
    // split (packages/core, packages/console) for the same reason: expensive,
    // environment-dependent checks get their own invocation, not bundled into the default one.
    exclude: [...configDefaults.exclude, '**/*.postgres.test.ts'],
  },
});
