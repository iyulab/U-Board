import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The page `show_board` draws a board in, built to `dist/app-build/`; `scripts/build-app.mjs` then folds it into the one file an MCP App
// is (`dist/app/board.html`). One bundle, its styles and fonts inside it: the host serves the page from a sandbox that fetches nothing.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: {
    outDir: '../dist/app-build',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { codeSplitting: false } },
  },
  logLevel: 'warn',
});
