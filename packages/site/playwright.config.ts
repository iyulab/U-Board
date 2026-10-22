import { defineConfig } from '@playwright/test';

// Draws every board the built gallery shows in a real browser and asks it what `look` asks a drawn board: does any
// element or widget run past its box, does any widget draw its "invalid spec" card. The gallery is the product's first
// impression, and a change in the engine or in a widget library can break an old board without touching it — this is
// the check that notices. It runs against the built site (`npm run build` first; `npm run check` builds before e2e).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  fullyParallel: true,
  // Each worker draws boards in a browser of its own; more than three on one machine starves the boards being measured.
  workers: 3,
  use: {
    // A port of its own, apart from core's (5183), the console's and the preview a person may have open.
    baseURL: 'http://127.0.0.1:4393',
    headless: true,
    viewport: { width: 1400, height: 1000 },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4393',
    url: 'http://127.0.0.1:4393/gallery/',
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
