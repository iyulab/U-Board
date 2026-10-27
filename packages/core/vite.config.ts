import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The dev server transforms a module when it is first asked for; transformed at start-up, the first visit does not
  // wait on the chain of modules the page asks for one after another (the end-to-end suite visits a cold server).
  server: { warmup: { clientFiles: ['./src/main.tsx', './src/App.tsx'] } },
  // Kept out of plain `dist/` so it doesn't collide with `build:lib`'s `dist/lib` output —
  // `vite build`'s emptyOutDir would otherwise wipe the library build (and vice versa).
  build: {
    outDir: 'dist/app',
  },
});
