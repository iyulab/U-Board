import { configDefaults, defineConfig } from 'vitest/config';

// `npm test` runs without a browser; the tests that drive one (*.e2e.test.ts) run under `test:e2e`.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '**/*.e2e.test.ts'] },
});
