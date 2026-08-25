import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `auth.postgres.test.ts` starts a real Postgres container via testcontainers — running it
    // in the same parallel batch as every other file's PGlite `beforeEach` starves both (PGlite
    // is WASM and CPU-hungry to spin up; a couple dozen instances initializing at once is already
    // known-flaky on its own, see HANDOFF.md — adding a Docker container startup into that same
    // window turned "occasional timeout" into most of the suite failing). Run it separately via
    // `npm run test:postgres` instead — mirrors this monorepo's existing `test` vs. `test:e2e`
    // split (packages/core, packages/console) for the same reason: expensive,
    // environment-dependent checks get their own invocation, not bundled into the default one.
    exclude: [...configDefaults.exclude, '**/*.postgres.test.ts'],
  },
});
