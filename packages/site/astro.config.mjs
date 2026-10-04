// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://board.u-platform.kr',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
