import { createDb } from './db.js';
import { createApp } from './app.js';

const dbPath = process.env.UBOARD_DB_PATH ?? 'u-board.db';
const sessionSecret = process.env.UBOARD_SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
  throw new Error('UBOARD_SESSION_SECRET must be set to a string of at least 16 characters');
}

const db = createDb(dbPath);
const app = createApp({ db, sessionSecret });

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`@iyulab/u-board-server listening on :${port} (db: ${dbPath})`);
});
