import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// `dist/` is what the server serves next to its API, on one origin — no addresses are baked in.
// `VITE_SHARE_BASE_URL` exists for local development only (the share viewer's own dev server, on
// another port), so a build refuses it rather than ship links to a dev address.
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && loadEnv(mode, process.cwd(), 'VITE_').VITE_SHARE_BASE_URL) {
    throw new Error('VITE_SHARE_BASE_URL is for local development: dist/ is served by the server, which serves the share viewer at /share/ itself.');
  }
  return {
    plugins: [react()],
    // One copy of the widget library in the console, however many packages bring one: the editor (through the
    // library) and the chat panel's tools (through the MCP package) each have their own install, and two copies keep
    // two registries — the Korean field names registered in one were read from the other as English.
    resolve: { dedupe: ['@iyulab/u-widgets'] },
    server: {
      proxy: { '/api': 'http://localhost:4000' },
    },
  };
});
