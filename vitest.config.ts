import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // matches upstream/canvas-kit's designer & viewer packages — required for
    // `@testing-library/jest-dom`'s plain (non-jest-globals) entry point to find `expect`.
    globals: true,
  },
});
