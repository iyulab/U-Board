import { createDb } from './db.js';
import { createApp } from './app.js';
import { createSendwayPasswordResetEmailSender, sendwayConfigFromEnv } from './email/sendway-email-sender.js';

const databaseUrl = process.env.UBOARD_DATABASE_URL ?? './u-board-data';
const sessionSecret = process.env.UBOARD_SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
  throw new Error('UBOARD_SESSION_SECRET must be set to a string of at least 16 characters');
}

// Without Sendway settings, `createApp` falls back to its dev-mode log-the-token default.
const sendwayConfig = sendwayConfigFromEnv(process.env);
const sendPasswordResetEmail = sendwayConfig ? createSendwayPasswordResetEmailSender(sendwayConfig) : undefined;

function redactDatabaseUrl(url: string): string {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    try {
      return `postgres://${new URL(url).host}`;
    } catch {
      return 'postgres://(unparseable)';
    }
  }
  return url; // ':memory:' or a local PGlite path — nothing sensitive to redact
}

const corsOrigins = process.env.UBOARD_CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
const trustCloudflareProxy = process.env.UBOARD_TRUST_CF_PROXY === 'true';

// Seconds a last-known value may still be served as stale when a connector read fails. Unset: no limit.
const staleMaxAge = process.env.UBOARD_STALE_MAX_AGE_SECONDS;
if (staleMaxAge !== undefined && staleMaxAge !== '' && !(Number(staleMaxAge) > 0)) {
  throw new Error('UBOARD_STALE_MAX_AGE_SECONDS must be a positive number of seconds');
}
const staleMaxAgeMs = staleMaxAge ? Number(staleMaxAge) * 1000 : undefined;

const db = await createDb(databaseUrl);
const app = createApp({ db, sessionSecret, corsOrigins, trustCloudflareProxy, sendPasswordResetEmail, staleMaxAgeMs });

const port = Number(process.env.PORT ?? 4000);
// Express 5 hands a startup failure (e.g. the port is taken) to this callback instead of throwing.
app.listen(port, (err?: Error) => {
  if (err) throw err;
  console.log(`@iyulab/u-board-server listening on :${port} (db: ${redactDatabaseUrl(databaseUrl)})`);
});
