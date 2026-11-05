import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The page `renderBoard` draws in, built to `dist/render-page/` (the package ships it; nothing is fetched at run time).
// Assets are addressed relative to the page, so it can be served from any origin.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: { outDir: '../dist/render-page', emptyOutDir: true, target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 2000 },
  logLevel: 'warn',
});
