import { defineConfig } from '@playwright/test';
import gallery from './playwright.config';

// Takes the gallery's thumbnails: each board drawn on its page, as the gallery check draws it, and saved as a picture
// for its card and its link preview (`npm run thumbnails` — after `npm run build`). Only boards whose picture is missing
// or older than the board are taken, unless THUMBNAILS=all (or a comma-separated list of board ids).
export default defineConfig({ ...gallery, testDir: './thumbs', timeout: 60_000 });
