import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from './db.js';
import { createApp } from './app.js';
import {
  createSendwayInvitationEmailSender,
  createSendwayPasswordResetEmailSender,
  sendwayConfigFromEnv,
} from './email/sendway-email-sender.js';
import { publicUrlFromEnv } from './public-url.js';
import { workspaceCreationFromEnv } from './workspace-creation.js';
import { auditRetentionDaysFromEnv, scheduleAuditPurge } from './audit-retention.js';
import { connectorAddressesFromEnv, createConnectorFetch } from './connector-network.js';
import { exitOnStopSignal } from './shutdown.js';
import { secretBox, SecretUnreadableError } from './secret-box.js';
import { sealStoredConnectorSecrets } from './db/connectors.js';

const databaseUrl = process.env.UBOARD_DATABASE_URL ?? './u-board-data';
const sessionSecret = process.env.UBOARD_SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
  throw new Error('UBOARD_SESSION_SECRET must be set to a string of at least 16 characters');
}
// Seals connector credentials in the database — a key of its own, so changing the session secret
// (which signs everyone out) never makes stored credentials unreadable.
const secretsKey = process.env.UBOARD_SECRETS_KEY;
if (!secretsKey) {
  throw new Error('UBOARD_SECRETS_KEY must be set (at least 32 characters, e.g. `openssl rand -base64 32`)');
}
const secrets = secretBox(secretsKey);

// Without Sendway settings, `createApp` falls back to its dev-mode log-the-token default.
const sendwayConfig = sendwayConfigFromEnv(process.env);
const sendPasswordResetEmail = sendwayConfig ? createSendwayPasswordResetEmailSender(sendwayConfig) : undefined;
const sendInvitationEmail = sendwayConfig ? createSendwayInvitationEmailSender(sendwayConfig) : undefined;

// Where people open the console — links in email point here. Unset: invitations are not emailed.
const publicUrl = publicUrlFromEnv(process.env.UBOARD_PUBLIC_URL);

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

const trustCloudflareProxy = process.env.UBOARD_TRUST_CF_PROXY === 'true';

// Seconds a last-known value may still be served as stale when a connector read fails. Unset: no limit.
const staleMaxAge = process.env.UBOARD_STALE_MAX_AGE_SECONDS;
if (staleMaxAge !== undefined && staleMaxAge !== '' && !(Number(staleMaxAge) > 0)) {
  throw new Error('UBOARD_STALE_MAX_AGE_SECONDS must be a positive number of seconds');
}
const staleMaxAgeMs = staleMaxAge ? Number(staleMaxAge) * 1000 : undefined;

// Who may create workspaces: instance operators only unless set to `anyone`.
const workspaceCreation = workspaceCreationFromEnv(process.env.UBOARD_WORKSPACE_CREATION);

// Which addresses connectors may reach: by default the installation's private networks, never the
// server's own loopback or link-local addresses.
const connectorFetch = createConnectorFetch(connectorAddressesFromEnv(process.env.UBOARD_CONNECTOR_ADDRESSES));

// Days membership, role and invitation records are kept.
const auditRetentionDays = auditRetentionDaysFromEnv(process.env.UBOARD_AUDIT_RETENTION_DAYS);

// The console and share viewer builds sit next to this package in the workspace (and in the
// container image, which keeps that layout). Serve them when they have been built; otherwise the
// server is the API alone, and the two apps run from their own dev servers or hosts.
const packagesDir = fileURLToPath(new URL('../../', import.meta.url));
const consoleDir = path.join(packagesDir, 'console', 'dist');
const shareDir = path.join(packagesDir, 'share', 'dist');
const webApps =
  existsSync(path.join(consoleDir, 'index.html')) && existsSync(path.join(shareDir, 'index.html'))
    ? { consoleDir, shareDir, shareFrameAncestors: process.env.UBOARD_SHARE_FRAME_ANCESTORS || undefined }
    : undefined;
// The installed version — the one a release and its image are tagged with — so a log says which one is running.
const version: string = JSON.parse(readFileSync(path.join(packagesDir, 'server', 'package.json'), 'utf8')).version;

const db = await createDb(databaseUrl);
try {
  const sealed = await sealStoredConnectorSecrets(db, secrets);
  if (sealed > 0) console.log(`[server] sealed ${sealed} connector credential(s) stored before sealing existed`);
} catch (err) {
  if (!(err instanceof SecretUnreadableError)) throw err;
  throw new Error(
    'UBOARD_SECRETS_KEY is not the key the stored connector credentials were sealed with — start with that key, ' +
      'or (if it is lost) clear the credentials so owners can enter them again: UPDATE connectors SET auth_value = NULL'
  );
}
scheduleAuditPurge(db, auditRetentionDays);
const app = createApp({
  db,
  sessionSecret,
  trustCloudflareProxy,
  sendPasswordResetEmail,
  publicUrl,
  sendInvitationEmail,
  staleMaxAgeMs,
  workspaceCreation,
  connectorFetch,
  secrets,
  webApps,
});

const port = Number(process.env.PORT ?? 4000);
// Express 5 hands a startup failure (e.g. the port is taken) to this callback instead of throwing.
const server = app.listen(port, (err?: Error) => {
  if (err) throw err;
  console.log(
    `U-Board ${version} listening on :${port} (db: ${redactDatabaseUrl(databaseUrl)}; ${webApps ? 'serving the console and share viewer' : 'API only'})`
  );
});
// In a container the server is process 1, which Node gives no default handling of `SIGTERM` — without
// this, `docker stop` waits out its timeout and kills the process, database open and requests cut.
exitOnStopSignal(server, db);
