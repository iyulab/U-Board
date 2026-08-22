import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';

export interface Connector {
  id: string;
  workspaceId: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: 'none' | 'bearer' | 'header';
  authHeaderName?: string;
  authValue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorSummary {
  id: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: 'none' | 'bearer' | 'header';
  authHeaderName?: string;
  updatedAt: string;
}

interface ConnectorRow {
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

interface ConnectorSummaryRow {
  id: string;
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  auth_header_name: string | null;
  updated_at: string;
}

function rowToConnector(row: ConnectorRow): Connector {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    type: row.type as 'http',
    baseUrl: row.base_url,
    authType: row.auth_type as Connector['authType'],
    authHeaderName: row.auth_header_name ?? undefined,
    authValue: row.auth_value ?? undefined,
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
    authType: 'none' | 'bearer' | 'header';
    authHeaderName?: string;
    authValue?: string;
  }
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
    createdAt: now,
    updatedAt: now,
  };
  await db.query(
    `INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_header_name, auth_value, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      connector.id, connector.workspaceId, connector.name, connector.type, connector.baseUrl,
      connector.authType, connector.authHeaderName ?? null, connector.authValue ?? null,
      connector.createdAt, connector.updatedAt,
    ]
  );
  return connector;
}

export async function listConnectorsForWorkspace(db: DbClient, workspaceId: string): Promise<ConnectorSummary[]> {
  const { rows } = await db.query<ConnectorSummaryRow>(
    `SELECT id, name, type, base_url, auth_type, auth_header_name, updated_at FROM connectors WHERE workspace_id = $1`,
    [workspaceId]
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as 'http',
    baseUrl: r.base_url,
    authType: r.auth_type as Connector['authType'],
    authHeaderName: r.auth_header_name ?? undefined,
    updatedAt: r.updated_at,
  }));
}

export async function findConnector(db: DbClient, workspaceId: string, connectorId: string): Promise<Connector | undefined> {
  const { rows } = await db.query<ConnectorRow>(`SELECT * FROM connectors WHERE id = $1 AND workspace_id = $2`, [connectorId, workspaceId]);
  return rows[0] ? rowToConnector(rows[0]) : undefined;
}

export async function updateConnector(
  db: DbClient,
  workspaceId: string,
  connectorId: string,
  input: {
    name?: string;
    baseUrl?: string;
    authType?: 'none' | 'bearer' | 'header';
    authHeaderName?: string | null;
    authValue?: string | null;
  }
): Promise<Connector | undefined> {
  const existing = await findConnector(db, workspaceId, connectorId);
  if (!existing) return undefined;

  const authHeaderName = input.authHeaderName === undefined ? existing.authHeaderName : (input.authHeaderName ?? undefined);
  const authValue = input.authValue === undefined ? existing.authValue : (input.authValue ?? undefined);

  const updated: Connector = {
    ...existing,
    name: input.name ?? existing.name,
    baseUrl: input.baseUrl ?? existing.baseUrl,
    authType: input.authType ?? existing.authType,
    authHeaderName,
    authValue,
    updatedAt: new Date().toISOString(),
  };
  await db.query(
    `UPDATE connectors SET name = $1, base_url = $2, auth_type = $3, auth_header_name = $4, auth_value = $5, updated_at = $6
     WHERE id = $7 AND workspace_id = $8`,
    [updated.name, updated.baseUrl, updated.authType, authHeaderName ?? null, authValue ?? null, updated.updatedAt, connectorId, workspaceId]
  );
  return updated;
}

export async function deleteConnector(db: DbClient, workspaceId: string, connectorId: string): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM connectors WHERE id = $1 AND workspace_id = $2`, [connectorId, workspaceId]);
  return (rowCount ?? 0) > 0;
}
