import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Two builds, two folders. `dist/` is what the server serves next to its API (same origin — no
// addresses baked in). A console hosted apart from the server is built with `npm run build:pages`
// (mode `pages`) into `dist-pages/`, with `VITE_API_BASE_URL` naming the server and, when the share
// viewer is hosted apart too, `VITE_SHARE_BASE_URL` naming it. Kept apart so a build made for
// another host can never end up being what a server serves.
export default defineConfig(({ command, mode }) => {
  const pages = mode === 'pages';
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    if (pages && !env.VITE_API_BASE_URL) {
      throw new Error('build:pages needs VITE_API_BASE_URL — the origin of the server this console calls.');
    }
    const elsewhere = ['VITE_API_BASE_URL', 'VITE_SHARE_BASE_URL'].filter(name => env[name]);
    if (!pages && elsewhere.length > 0) {
      throw new Error(`${elsewhere.join(', ')} is for a console hosted apart from the server: build it with \`npm run build:pages\` (into dist-pages/). dist/ is what the server serves.`);
    }
  }
  return {
    plugins: [react()],
    build: { outDir: pages ? 'dist-pages' : 'dist' },
    server: {
      proxy: { '/api': 'http://localhost:4000' },
    },
  };
});
