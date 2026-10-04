import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `*.postgres.test.ts` files start a real Postgres container via testcontainers — running them
    // in the same parallel batch as every other file's PGlite startup starves both (PGlite is
    // WASM and CPU-hungry to spin up, one instance per test file — see
    // src/test-support/test-db.ts — and a Docker container startup in that same window turned
    // occasional timeouts into most of the suite failing). Run it separately via
    // `npm run test:postgres` instead — mirrors this monorepo's existing `test` vs. `test:e2e`
    // split (packages/core, packages/console) for the same reason: expensive,
    // environment-dependent checks get their own invocation, not bundled into the default one.
    exclude: [...configDefaults.exclude, '**/*.postgres.test.ts'],
    // Most tests here start (or are the first in their file to start) a PGlite engine, which takes
    // 1–2s on an idle machine and several times that while every test file does it in parallel.
    // Vitest already gives hooks 10s for exactly that startup when it happens in `beforeEach`; a
    // test that starts the engine in its own body pays the same cost and gets the same budget,
    // instead of the 5s default that it overran whenever the machine was busy.
    testTimeout: 10_000,
  },
});
