import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Two builds, two folders. `dist/` is what the server serves next to its API (same origin — no
// API address baked in). A viewer hosted apart from the server is built with `npm run build:pages`
// (mode `pages`) into `dist-pages/`, with `VITE_API_BASE_URL` naming the server. Kept apart so a
// build made for another host can never end up being what a server serves.
export default defineConfig(({ command, mode }) => {
  const pages = mode === 'pages';
  if (command === 'build') {
    const { VITE_API_BASE_URL } = loadEnv(mode, process.cwd(), 'VITE_');
    if (pages && !VITE_API_BASE_URL) {
      throw new Error('build:pages needs VITE_API_BASE_URL — the origin of the server this viewer calls.');
    }
    if (!pages && VITE_API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL is for a viewer hosted apart from the server: build it with `npm run build:pages` (into dist-pages/). dist/ is what the server serves.');
    }
  }
  return {
    // Relative asset URLs: the same build works at a host's root and under the server's `/share/`.
    base: './',
    plugins: [react()],
    build: { outDir: pages ? 'dist-pages' : 'dist' },
    server: {
      proxy: { '/api': 'http://localhost:4000' },
    },
  };
});
