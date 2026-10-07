import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `dist/` is what the server serves at `/share/`, next to its API on one origin.
export default defineConfig({
  // Relative asset URLs: the build works under the server's `/share/` and at a dev server's root.
  base: './',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
});
