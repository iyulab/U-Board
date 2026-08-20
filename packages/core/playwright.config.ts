import { defineConfig } from '@playwright/test';

// Mirrors upstream/u-widgets' playwright.config.ts (same workspace, same convention) — a
// dedicated e2e/ suite against a real browser, not jsdom. jsdom cannot render canvas-kit's
// <canvas> scene or u-widgets' shadow-DOM custom elements at all, so it renders "success" on a
// case that would actually be blank (see e2e/chart-rendering.spec.ts for the regression class
// this exists to catch).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    // Distinct from u-widgets' own e2e port (5173) and this project's manual dev-server checks
    // (5199) so none of the three collide if run concurrently on this machine.
    baseURL: 'http://127.0.0.1:5183',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npx vite --force --host 127.0.0.1 --port 5183 --strictPort',
    url: 'http://127.0.0.1:5183/',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
