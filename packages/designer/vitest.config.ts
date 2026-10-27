import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const core = (file: string) => fileURLToPath(new URL(`../core/src/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "paths" — vitest resolves through Vite, which does not read them. The subpaths come
      // first: a string alias also matches as a prefix.
      '@iyulab/u-board/domain': core('domain-entry.ts'),
      '@iyulab/u-board/picture': core('picture-entry.ts'),
      '@iyulab/u-board/toolkit': core('toolkit-entry.ts'),
      '@iyulab/u-board/viewer': core('viewer-entry.ts'),
      '@iyulab/u-board/examples': core('examples-entry.ts'),
      '@iyulab/u-board': core('index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
