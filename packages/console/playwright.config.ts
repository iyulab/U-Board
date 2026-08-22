import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // NOTE — `test:e2e` in package.json runs each spec file as its OWN `playwright test`
  // invocation (`playwright test e2e/a.spec.ts && playwright test e2e/b.spec.ts`) rather than
  // a single bare `playwright test`. That is deliberate, and JSON has no comments, so the
  // reason lives here:
  //
  // Both spec files need to be the first-ever signup against the server, because the server
  // grants owner + a default workspace only while the users table is empty (the bootstrap
  // rule). The `webServer` entries below start ONE server per invocation, backed by one
  // `:memory:` database — so within a single invocation the two specs would compete for that
  // one-time slot and whichever ran second would fail.
  //
  // Consequences for anyone adding an e2e spec:
  //   - A new spec that needs the bootstrap slot must be appended to `test:e2e` as its own
  //     `&& playwright test e2e/<newfile>.spec.ts` entry. Dropping the file into `e2e/` alone
  //     is silently a no-op — nothing globs the directory.
  //   - A spec that does NOT need the bootstrap slot may share an invocation with others, but
  //     must still be named explicitly in `test:e2e` for the same reason.
  //
  // Caveat: `reuseExistingServer: !process.env.CI` means that on a warm local machine the
  // second invocation may attach to the server the first one left running, and therefore to
  // the same `:memory:` database. The per-invocation isolation this chain relies on is
  // guaranteed under CI; locally, stop a stale server (or set `CI=1`) if a spec fails on an
  // unexpectedly non-empty database.
  webServer: [
    {
      // Env vars are passed via the `env` option (not inline `VAR=value` shell syntax in
      // `command`) so this works under both POSIX shells and Windows cmd.exe — Playwright sets
      // them directly on the spawned process's environment rather than relying on shell parsing.
      command: 'npm run build && npm start',
      cwd: '../server',
      env: { UBOARD_DATABASE_URL: ':memory:', UBOARD_SESSION_SECRET: 'e2e-test-secret-32-chars-long' },
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 5175',
      env: { VITE_SHARE_BASE_URL: 'http://localhost:5176' },
      port: 5175,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 5176',
      cwd: '../share',
      port: 5176,
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: { baseURL: 'http://localhost:5175' },
});
