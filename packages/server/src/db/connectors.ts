import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import type { ClientAuthMethod } from '../oauth-client-credentials.js';
import { recordAuditEvent } from './audit.js';

export type ConnectorAuthType = 'none' | 'bearer' | 'header' | 'oauth2-client-credentials';

/** The non-secret half of an `oauth2-client-credentials` connector's configuration. The client
 * secret lives in `authValue`, like every other connector secret, so it gets the same handling
 * (never listed, kept on edit when omitted). */
export interface ConnectorOAuthSettings {
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthScope?: string;
  oauthClientAuth?: ClientAuthMethod;
}

export interface Connector extends ConnectorOAuthSettings {
  id: string;
  workspaceId: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: ConnectorAuthType;
  authHeaderName?: string;
  authValue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorSummary extends ConnectorOAuthSettings {
  id: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: ConnectorAuthType;
  authHeaderName?: string;
  updatedAt: string;
}

interface OAuthColumns {
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
  base_url: string;
  auth_type: string;
  auth_header_name: string | null;
  auth_value: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectorSummaryRow extends OAuthColumns {
  id: string;
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  auth_header_name: string | null;
  updated_at: string;
}

function oauthSettingsFromRow(row: OAuthColumns): ConnectorOAuthSettings {
  return {
    oauthTokenUrl: row.oauth_token_url ?? undefined,
    oauthClientId: row.oauth_client_id ?? undefined,
    oauthScope: row.oauth_scope ?? undefined,
    oauthClientAuth: (row.oauth_client_auth as ClientAuthMethod | null) ?? undefined,
  };
}

function rowToConnector(row: ConnectorRow): Connector {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    type: row.type as 'http',
    baseUrl: row.base_url,
    authType: row.auth_type as ConnectorAuthType,
    authHeaderName: row.auth_header_name ?? undefined,
    authValue: row.auth_value ?? undefined,
    ...oauthSettingsFromRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createConnector(
  db: DbClient,
  input: {
    workspaceId: string;
    name: string;
    baseUrl: string;
    authType: ConnectorAuthType;
    authHeaderName?: string;
    authValue?: string;
    actorUserId: string;
  } & ConnectorOAuthSettings
): Promise<Connector> {
  const now = new Date().toISOString();
  const connector: Connector = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    type: 'http',
    baseUrl: input.baseUrl,
    authType: input.authType,
    authHeaderName: input.authHeaderName,
    authValue: input.authValue,
    oauthTokenUrl: input.oauthTokenUrl,
    oauthClientId: input.oauthClientId,
    oauthScope: input.oauthScope,
    oauthClientAuth: input.oauthClientAuth,
    createdAt: now,
    updatedAt: now,
  };
  await db.withTransaction(async tx => {
    await tx.query(
      `INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_header_name, auth_value,
         oauth_token_url, oauth_client_id, oauth_scope, oauth_client_auth, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        connector.id, connector.workspaceId, connector.name, connector.type, connector.baseUrl,
        connector.authType, connector.authHeaderName ?? null, connector.authValue ?? null,
        connector.oauthTokenUrl ?? null, connector.oauthClientId ?? null, connector.oauthScope ?? null,
        connector.oauthClientAuth ?? null, connector.createdAt, connector.updatedAt,
      ]
    );
    await recordAuditEvent(tx, {
      action: 'connector.created',
      workspaceId: connector.workspaceId,
      actorUserId: input.actorUserId,
      target: { id: connector.id, name: connector.name },
    });
  });
  return connector;
}

export async function listConnectorsForWorkspace(db: DbClient, workspaceId: string): Promise<ConnectorSummary[]> {
  const { rows } = await db.query<ConnectorSummaryRow>(
    `SELECT id, name, type, base_url, auth_type, auth_header_name,
            oauth_token_url, oauth_client_id, oauth_scope, oauth_client_auth, updated_at
     FROM connectors WHERE workspace_id = $1`,
    [workspaceId]
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as 'http',
    baseUrl: r.base_url,
    authType: r.auth_type as ConnectorAuthType,
    authHeaderName: r.auth_header_name ?? undefined,
    ...oauthSettingsFromRow(r),
    updatedAt: r.updated_at,
  }));
}

export async function findConnector(db: DbClient, workspaceId: string, connectorId: string): Promise<Connector | undefined> {
  const { rows } = await db.query<ConnectorRow>(`SELECT * FROM connectors WHERE id = $1 AND workspace_id = $2`, [connectorId, workspaceId]);
  return rows[0] ? rowToConnector(rows[0]) : undefined;
}

/** A change to a connector's settings. For each field `undefined` leaves the stored value alone and
 *  `null` clears it. */
export interface ConnectorChanges {
  name?: string;
  baseUrl?: string;
  authType?: ConnectorAuthType;
  authHeaderName?: string | null;
  authValue?: string | null;
  /** `undefined` leaves the stored OAuth settings alone; `null` clears them (the connector is
   * leaving OAuth); an object replaces them as a set. */
  oauth?: ConnectorOAuthSettings | null;
}

/** The connector `existing` becomes with `changes` applied — what an update stores, and what a
 *  connection test tries before anything is stored. */
export function applyConnectorChanges(existing: Connector, changes: ConnectorChanges): Connector {
  const oauthSource = changes.oauth === undefined ? existing : (changes.oauth ?? {});
  return {
    ...existing,
    name: changes.name ?? existing.name,
    baseUrl: changes.baseUrl ?? existing.baseUrl,
    authType: changes.authType ?? existing.authType,
    authHeaderName: changes.authHeaderName === undefined ? existing.authHeaderName : (changes.authHeaderName ?? undefined),
    authValue: changes.authValue === undefined ? existing.authValue : (changes.authValue ?? undefined),
    oauthTokenUrl: oauthSource.oauthTokenUrl,
    oauthClientId: oauthSource.oauthClientId,
    oauthScope: oauthSource.oauthScope,
    oauthClientAuth: oauthSource.oauthClientAuth,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateConnector(
  db: DbClient,
  workspaceId: string,
  connectorId: string,
  changes: ConnectorChanges,
  actorUserId: string
): Promise<Connector | undefined> {
  return db.withTransaction(tx => updateConnectorIn(tx, workspaceId, connectorId, changes, actorUserId));
}

/** Which settings an update changed, for the record — by group, never by value. */
function changedSettings(before: Connector, after: Connector): string {
  const changed: string[] = [];
  if (after.name !== before.name) changed.push('name');
  if (after.baseUrl !== before.baseUrl) changed.push('base_url');
  const auth = (c: Connector) =>
    [c.authType, c.authHeaderName, c.authValue, c.oauthTokenUrl, c.oauthClientId, c.oauthScope, c.oauthClientAuth].join('\u0000');
  if (auth(after) !== auth(before)) changed.push('auth');
  return changed.join(',');
}

async function updateConnectorIn(
  db: DbClient,
  workspaceId: string,
  connectorId: string,
  changes: ConnectorChanges,
  actorUserId: string
): Promise<Connector | undefined> {
  const { rows: locked } = await db.query<ConnectorRow>(
    `SELECT * FROM connectors WHERE id = $1 AND workspace_id = $2 FOR UPDATE`,
    [connectorId, workspaceId]
  );
  if (!locked[0]) return undefined;
  const existing = rowToConnector(locked[0]);
  const updated = applyConnectorChanges(existing, changes);
  await db.query(
    `UPDATE connectors SET name = $1, base_url = $2, auth_type = $3, auth_header_name = $4, auth_value = $5,
       oauth_token_url = $6, oauth_client_id = $7, oauth_scope = $8, oauth_client_auth = $9, updated_at = $10
     WHERE id = $11 AND workspace_id = $12`,
    [
      updated.name, updated.baseUrl, updated.authType, updated.authHeaderName ?? null, updated.authValue ?? null,
      updated.oauthTokenUrl ?? null, updated.oauthClientId ?? null, updated.oauthScope ?? null, updated.oauthClientAuth ?? null,
      updated.updatedAt, connectorId, workspaceId,
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
