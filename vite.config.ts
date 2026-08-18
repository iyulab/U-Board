import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Kept out of plain `dist/` so it doesn't collide with `build:lib`'s `dist/lib` output —
  // `vite build`'s emptyOutDir would otherwise wipe the library build (and vice versa).
  build: {
    outDir: 'dist/app',
  },
});
