import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: [
    {
      // Env vars are passed via the `env` option (not inline `VAR=value` shell syntax in
      // `command`) so this works under both POSIX shells and Windows cmd.exe — Playwright sets
      // them directly on the spawned process's environment rather than relying on shell parsing.
      command: 'npm run build && npm start',
      cwd: '../server',
      env: { UBOARD_DB_PATH: ':memory:', UBOARD_SESSION_SECRET: 'e2e-test-secret-32-chars-long' },
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 5175',
      port: 5175,
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: { baseURL: 'http://localhost:5175' },
});
