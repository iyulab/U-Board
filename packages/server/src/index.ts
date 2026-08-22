import { createDb } from './db.js';
import { createApp } from './app.js';

const databaseUrl = process.env.UBOARD_DATABASE_URL ?? './u-board-data';
const sessionSecret = process.env.UBOARD_SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
  throw new Error('UBOARD_SESSION_SECRET must be set to a string of at least 16 characters');
}

const db = await createDb(databaseUrl);
const app = createApp({ db, sessionSecret });

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`@iyulab/u-board-server listening on :${port} (db: ${databaseUrl})`);
});
