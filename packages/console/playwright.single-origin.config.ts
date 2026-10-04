import { defineConfig } from '@playwright/test';

// The product as it ships: the server serving the built console and share viewer from one origin
// (packages/server/Dockerfile), not the Vite dev servers the other specs run against. Catches what
// only that arrangement can break — the console's fallback for its own routes, `/share` → `/share/`,
// the Content-Security-Policy, share links on the console's own origin.
//
// It builds all three apps without any VITE_* variables, exactly as the image does, and owns its
// port outright (`reuseExistingServer: false`): attaching to some other process on that port would
// test the wrong thing.
const PORT = 4391;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'single-origin.spec.ts',
  webServer: {
    command:
      'npm run build --workspace=packages/console && npm run build --workspace=packages/share && ' +
      'npm run build --workspace=packages/server && npm start --workspace=packages/server',
    cwd: '../..',
    env: { UBOARD_DATABASE_URL: ':memory:', UBOARD_SESSION_SECRET: 'e2e-test-secret-32-chars-long', PORT: String(PORT) },
    port: PORT,
    reuseExistingServer: false,
    timeout: 300_000,
  },
  use: { baseURL: `http://localhost:${PORT}` },
});
