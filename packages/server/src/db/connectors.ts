import type { DbClient } from '../db.js';
import type { Attribution } from '@iyulab/u-board/domain';
import type { SourceErrorField } from '@iyulab/u-board/picture';
import { randomUUID } from 'node:crypto';
import type { ClientAuthMethod } from '../oauth-client-credentials.js';
import { recordAuditEvent } from './audit.js';
import { UNSEALED, SecretUnreadableError, isSealed, type SecretBox } from '../secret-box.js';

/** How a connector sends its secret: as `Authorization: Bearer`, as a named header, as a named query
 * parameter (`query`), in place of `{key}` in its base URL (`path`), or as OAuth2 client credentials.
 * The last two URL forms exist for data sources that take a key only in the address, as many public
 * open-data APIs do; the key is put in at request time, so it never appears in a board. */
export type ConnectorAuthType = 'none' | 'bearer' | 'header' | 'query' | 'path' | 'oauth2-client-credentials';


/** Where a `path` connector's base URL takes its key. */
export const PATH_KEY_PLACEHOLDER = '{key}';

/** The non-secret half of an `oauth2-client-credentials` connector's configuration. The client
 * secret lives in `authValue`, like every other connector secret, so it gets the same handling
 * (never listed, kept on edit when omitted). */
export interface ConnectorOAuthSettings {
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthScope?: string;
  oauthClientAuth?: ClientAuthMethod;
}

/** What every data source has: its name, how it is credited, and what it answers. */
interface ConnectorBase {
  id: string;
  workspaceId: string;
  name: string;
  /** How the source is credited under a board that shows its data. */
  attribution?: Attribution;
  /** What the source answers and where — its paths and what each holds, written by its owner for whoever binds to it
   *  (a person, or an assistant that cannot guess a path). */
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** The answers a static data source gives, by request path (`/equipment`) — what an HTTP source would answer there. */
export type StaticAnswers = Record<string, unknown>;

/** A data source of the workspace that answers what its owner stored, by path — example data, or a reference table that
 *  lives nowhere else. A board reads it as it reads an HTTP source (`from` + `path`), so it is changed for a live one by
 *  `from` alone. `sample` says its answers are example data, which a board says where it shows them. */
export interface StaticConnector extends ConnectorBase {
  type: 'static';
  answers: StaticAnswers;
  sample: boolean;
}

export interface HttpConnector extends ConnectorBase, ConnectorOAuthSettings {
  type: 'http';
  baseUrl: string;
  authType: ConnectorAuthType;
  authHeaderName?: string;
  /** The query parameter a `query` connector sends its secret as. */
  authParamName?: string;
  authValue?: string;
  /** Where the source says, in an answer it gives with success, that it failed. */
  sourceError?: SourceErrorField;
}

/** A data source of a workspace: one called over HTTP, or one that answers what it stores. */
export type Connector = HttpConnector | StaticConnector;

/** A static source as it is listed: everything, its answers included — they are not a secret. */
export type StaticConnectorSummary = Omit<StaticConnector, 'workspaceId' | 'createdAt'>;

export interface HttpConnectorSummary extends ConnectorOAuthSettings {
  id: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: ConnectorAuthType;
  authHeaderName?: string;
  authParamName?: string;
  attribution?: Attribution;
  description?: string;
  sourceError?: SourceErrorField;
  updatedAt: string;
}

export type ConnectorSummary = HttpConnectorSummary | StaticConnectorSummary;

interface OAuthColumns {
  answers: StaticAnswers | null;
  sample: boolean;
  description: string | null;
  source_error: SourceErrorField | null;
  attribution_text: string | null;
  attribution_url: string | null;
  oauth_token_url: string | null;
  oauth_client_id: string | null;
  oauth_scope: string | null;
  oauth_client_auth: string | null;
}

interface ConnectorRow extends OAuthColumns {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  base_url: string | null;
  auth_type: string;
  auth_header_name: string | null;
  auth_param_name: string | null;
  auth_value: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectorSummaryRow extends OAuthColumns {
  id: string;
  name: string;
  type: string;
  base_url: string | null;
  auth_type: string;
  auth_header_name: string | null;
  auth_param_name: string | null;
  updated_at: string;
}

function attributionFromRow(row: OAuthColumns): Attribution | undefined {
  return row.attribution_text === null ? undefined : { text: row.attribution_text, url: row.attribution_url ?? undefined };
}

function oauthSettingsFromRow(row: OAuthColumns): ConnectorOAuthSettings {
  return {
    oauthTokenUrl: row.oauth_token_url ?? undefined,
    oauthClientId: row.oauth_client_id ?? undefined,
    oauthScope: row.oauth_scope ?? undefined,
    oauthClientAuth: (row.oauth_client_auth as ClientAuthMethod | null) ?? undefined,
  };
}

/** A static source from its row — what it has besides what every source has. */
function staticFromRow(row: OAuthColumns): Pick<StaticConnector, 'type' | 'answers' | 'sample'> {
  return { type: 'static', answers: row.answers ?? {}, sample: row.sample };
}

function rowToConnector(row: ConnectorRow, secrets: SecretBox): Connector {
  const base = {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    attribution: attributionFromRow(row),
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.type === 'static') return { ...base, ...staticFromRow(row) };
  return {
    ...base,
    type: 'http',
    baseUrl: row.base_url ?? '',
    authType: row.auth_type as ConnectorAuthType,
    authHeaderName: row.auth_header_name ?? undefined,
    authParamName: row.auth_param_name ?? undefined,
    authValue: row.auth_value === null ? undefined : secrets.open(row.auth_value),
    sourceError: row.source_error ?? undefined,
    ...oauthSettingsFromRow(row),
  };
}

/** A new connector, as it is created — everything but what the store gives it (its id and times). An HTTP one need not
 *  say its type. */
export type NewConnector = NewHttpConnector | NewStaticConnector;
export type NewHttpConnector = Omit<HttpConnector, 'id' | 'type' | 'createdAt' | 'updatedAt'> & { type?: 'http' };
export type NewStaticConnector = Omit<StaticConnector, 'id' | 'createdAt' | 'updatedAt'>;

export async function createConnector(db: DbClient, input: NewConnector & { actorUserId: string }, secrets: SecretBox = UNSEALED): Promise<Connector> {
  const now = new Date().toISOString();
  const { actorUserId, ...settings } = input;
  const connector: Connector =
    settings.type === 'static' ? { ...settings, id: randomUUID(), createdAt: now, updatedAt: now } : { ...settings, type: 'http', id: randomUUID(), createdAt: now, updatedAt: now };
  const http = connector.type === 'http' ? connector : undefined;
  await db.withTransaction(async tx => {
    await tx.query(
      `INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_header_name, auth_value,
         oauth_token_url, oauth_client_id, oauth_scope, oauth_client_auth, created_at, updated_at, auth_param_name,
         attribution_text, attribution_url, description, source_error, answers, sample)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        connector.id, connector.workspaceId, connector.name, connector.type, http?.baseUrl ?? null,
        http?.authType ?? 'none', http?.authHeaderName ?? null, http?.authValue === undefined ? null : secrets.seal(http.authValue),
        http?.oauthTokenUrl ?? null, http?.oauthClientId ?? null, http?.oauthScope ?? null,
        http?.oauthClientAuth ?? null, connector.createdAt, connector.updatedAt, http?.authParamName ?? null,
        connector.attribution?.text ?? null, connector.attribution?.url ?? null, connector.description ?? null,
        http?.sourceError === undefined ? null : JSON.stringify(http.sourceError),
        connector.type === 'static' ? JSON.stringify(connector.answers) : null, connector.type === 'static' && connector.sample,
      ]
    );
    await recordAuditEvent(tx, {
      action: 'connector.created',
      workspaceId: connector.workspaceId,
      actorUserId,
      target: { id: connector.id, name: connector.name },
    });
  });
  return connector;
}

export async function listConnectorsForWorkspace(db: DbClient, workspaceId: string): Promise<ConnectorSummary[]> {
  const { rows } = await db.query<ConnectorSummaryRow>(
    `SELECT id, name, type, base_url, auth_type, auth_header_name, auth_param_name, attribution_text, attribution_url, description, source_error,
            oauth_token_url, oauth_client_id, oauth_scope, oauth_client_auth, answers, sample, updated_at
     FROM connectors WHERE workspace_id = $1`,
    [workspaceId]
  );
  return rows.map((r): ConnectorSummary => r.type === 'static' ? {
    id: r.id,
    name: r.name,
    ...staticFromRow(r),
    attribution: attributionFromRow(r),
    description: r.description ?? undefined,
    updatedAt: r.updated_at,
  } : {
    id: r.id,
    name: r.name,
    type: 'http',
    baseUrl: r.base_url ?? '',
    authType: r.auth_type as ConnectorAuthType,
    authHeaderName: r.auth_header_name ?? undefined,
    authParamName: r.auth_param_name ?? undefined,
    attribution: attributionFromRow(r),
    description: r.description ?? undefined,
    sourceError: r.source_error ?? undefined,
    ...oauthSettingsFromRow(r),
    updatedAt: r.updated_at,
  });
}

export async function findConnector(db: DbClient, workspaceId: string, connectorId: string, secrets: SecretBox = UNSEALED): Promise<Connector | undefined> {
  const { rows } = await db.query<ConnectorRow>(`SELECT * FROM connectors WHERE id = $1 AND workspace_id = $2`, [connectorId, workspaceId]);
  return rows[0] ? rowToConnector(rows[0], secrets) : undefined;
}

/** What `sealStoredConnectorSecrets` changed: values stored as given that it sealed, and values sealed
 *  under the previous key that it sealed again under the current one. */
export interface SealedSecretsCount {
  sealed: number;
  resealed: number;
}

/** Seals every connector secret still stored as given — run when the server starts, so values from
 *  before sealing existed are sealed too — and checks that each sealed one opens with this key.
 *
 *  With `previous` (the key being replaced), a value that does not open with `secrets` but opens with
 *  `previous` is sealed again under `secrets`, so a key is replaced by starting once with both. All or
 *  nothing: throws `SecretUnreadableError`, changing no value, when one opens with neither key — the
 *  installation was started with another key than its credentials were sealed under, which would
 *  otherwise surface later as failing reads. */
export async function sealStoredConnectorSecrets(db: DbClient, secrets: SecretBox, previous?: SecretBox): Promise<SealedSecretsCount> {
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<{ id: string; auth_value: string }>(
      `SELECT id, auth_value FROM connectors WHERE auth_value IS NOT NULL FOR UPDATE`
    );
    const count: SealedSecretsCount = { sealed: 0, resealed: 0 };
    for (const row of rows) {
      if (!isSealed(row.auth_value)) {
        await tx.query(`UPDATE connectors SET auth_value = $1 WHERE id = $2`, [secrets.seal(row.auth_value), row.id]);
        count.sealed++;
        continue;
      }
      try {
        secrets.open(row.auth_value);
        continue;
      } catch (err) {
        if (!(err instanceof SecretUnreadableError) || !previous) throw err;
      }
      const plain = previous.open(row.auth_value);
      await tx.query(`UPDATE connectors SET auth_value = $1 WHERE id = $2`, [secrets.seal(plain), row.id]);
      count.resealed++;
    }
    return count;
  });
}

/** A change to a connector's settings. For each field `undefined` leaves the stored value alone and
 *  `null` clears it. */
export interface ConnectorChanges {
  name?: string;
  baseUrl?: string;
  authType?: ConnectorAuthType;
  authHeaderName?: string | null;
  authParamName?: string | null;
  authValue?: string | null;
  /** `undefined` leaves it alone; `null` clears it. */
  attribution?: Attribution | null;
  /** `undefined` leaves it alone; `null` clears it. */
  description?: string | null;
  /** `undefined` leaves it alone; `null` clears it. */
  sourceError?: SourceErrorField | null;
  /** `undefined` leaves the stored OAuth settings alone; `null` clears them (the connector is
   * leaving OAuth); an object replaces them as a set. */
  oauth?: ConnectorOAuthSettings | null;
  /** A static source's: `undefined` leaves them alone. */
  answers?: StaticAnswers;
  sample?: boolean;
}

/** The connector `existing` becomes with `changes` applied — what an update stores, and what a
 *  connection test tries before anything is stored. */
export function applyConnectorChanges(existing: Connector, changes: ConnectorChanges): Connector {
  const common = {
    name: changes.name ?? existing.name,
    attribution: changes.attribution === undefined ? existing.attribution : (changes.attribution ?? undefined),
    description: changes.description === undefined ? existing.description : (changes.description ?? undefined),
    updatedAt: new Date().toISOString(),
  };
  if (existing.type === 'static') {
    return { ...existing, ...common, answers: changes.answers ?? existing.answers, sample: changes.sample ?? existing.sample };
  }
  const oauthSource = changes.oauth === undefined ? existing : (changes.oauth ?? {});
  return {
    ...existing,
    ...common,
    baseUrl: changes.baseUrl ?? existing.baseUrl,
    authType: changes.authType ?? existing.authType,
    authHeaderName: changes.authHeaderName === undefined ? existing.authHeaderName : (changes.authHeaderName ?? undefined),
    authParamName: changes.authParamName === undefined ? existing.authParamName : (changes.authParamName ?? undefined),
    sourceError: changes.sourceError === undefined ? existing.sourceError : (changes.sourceError ?? undefined),
    authValue: changes.authValue === undefined ? existing.authValue : (changes.authValue ?? undefined),
    oauthTokenUrl: oauthSource.oauthTokenUrl,
    oauthClientId: oauthSource.oauthClientId,
    oauthScope: oauthSource.oauthScope,
    oauthClientAuth: oauthSource.oauthClientAuth,
  };
}

export async function updateConnector(
  db: DbClient,
  workspaceId: string,
  connectorId: string,
  changes: ConnectorChanges,
  actorUserId: string,
  secrets: SecretBox = UNSEALED
): Promise<Connector | undefined> {
  return db.withTransaction(tx => updateConnectorIn(tx, workspaceId, connectorId, changes, actorUserId, secrets));
}

/** Which settings an update changed, for the record — by group, never by value. */
function changedSettings(before: Connector, after: Connector): string {
  const changed: string[] = [];
  if (after.name !== before.name) changed.push('name');
  if (before.type === 'http' && after.type === 'http' && after.baseUrl !== before.baseUrl) changed.push('base_url');
  if (JSON.stringify(after.attribution) !== JSON.stringify(before.attribution)) changed.push('attribution');
  if (after.description !== before.description) changed.push('description');
  if (before.type === 'static' || after.type === 'static') {
    if (before.type === 'static' && after.type === 'static') {
      if (JSON.stringify(after.answers) !== JSON.stringify(before.answers)) changed.push('answers');
      if (after.sample !== before.sample) changed.push('sample');
    }
    return changed.join(',');
  }
  if (JSON.stringify(after.sourceError) !== JSON.stringify(before.sourceError)) changed.push('source_error');
  const auth = (c: HttpConnector) =>
    [c.authType, c.authHeaderName, c.authParamName, c.authValue, c.oauthTokenUrl, c.oauthClientId, c.oauthScope, c.oauthClientAuth].join('\u0000');
  if (auth(after) !== auth(before)) changed.push('auth');
  return changed.join(',');
}

async function updateConnectorIn(
  db: DbClient,
  workspaceId: string,
  connectorId: string,
  changes: ConnectorChanges,
  actorUserId: string,
  secrets: SecretBox
): Promise<Connector | undefined> {
  const { rows: locked } = await db.query<ConnectorRow>(
    `SELECT * FROM connectors WHERE id = $1 AND workspace_id = $2 FOR UPDATE`,
    [connectorId, workspaceId]
  );
  if (!locked[0]) return undefined;
  const existing = rowToConnector(locked[0], secrets);
  const updated = applyConnectorChanges(existing, changes);
  const http = updated.type === 'http' ? updated : undefined;
  await db.query(
    `UPDATE connectors SET name = $1, base_url = $2, auth_type = $3, auth_header_name = $4, auth_value = $5,
       oauth_token_url = $6, oauth_client_id = $7, oauth_scope = $8, oauth_client_auth = $9, updated_at = $10,
       auth_param_name = $13, attribution_text = $14, attribution_url = $15, description = $16, source_error = $17,
       answers = $18, sample = $19
     WHERE id = $11 AND workspace_id = $12`,
    [
      updated.name, http?.baseUrl ?? null, http?.authType ?? 'none', http?.authHeaderName ?? null, http?.authValue === undefined ? null : secrets.seal(http.authValue),
      http?.oauthTokenUrl ?? null, http?.oauthClientId ?? null, http?.oauthScope ?? null, http?.oauthClientAuth ?? null,
      updated.updatedAt, connectorId, workspaceId, http?.authParamName ?? null,
      updated.attribution?.text ?? null, updated.attribution?.url ?? null, updated.description ?? null,
      http?.sourceError === undefined ? null : JSON.stringify(http.sourceError),
      updated.type === 'static' ? JSON.stringify(updated.answers) : null, updated.type === 'static' && updated.sample,
    ]
  );
  const detail = changedSettings(existing, updated);
  if (detail) {
    await recordAuditEvent(db, { action: 'connector.updated', workspaceId, actorUserId, target: { id: connectorId, name: updated.name }, detail });
  }
  return updated;
}

export async function deleteConnector(db: DbClient, workspaceId: string, connectorId: string, actorUserId: string): Promise<boolean> {
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<{ name: string }>(
      `DELETE FROM connectors WHERE id = $1 AND workspace_id = $2 RETURNING name`,
      [connectorId, workspaceId]
    );
    if (!rows[0]) return false;
    await recordAuditEvent(tx, { action: 'connector.deleted', workspaceId, actorUserId, target: { id: connectorId, name: rows[0].name } });
    return true;
  });
}
