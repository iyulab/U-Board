import type Database from 'better-sqlite3';
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

export function createConnector(
  db: Database.Database,
  input: {
    workspaceId: string;
    name: string;
    baseUrl: string;
    authType: 'none' | 'bearer' | 'header';
    authHeaderName?: string;
    authValue?: string;
  }
): Connector {
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
  db.prepare(
    `INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_header_name, auth_value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    connector.id,
    connector.workspaceId,
    connector.name,
    connector.type,
    connector.baseUrl,
    connector.authType,
    connector.authHeaderName ?? null,
    connector.authValue ?? null,
    connector.createdAt,
    connector.updatedAt
  );
  return connector;
}

export function listConnectorsForWorkspace(db: Database.Database, workspaceId: string): ConnectorSummary[] {
  const rows = db
    .prepare(
      `SELECT id, name, type, base_url, auth_type, auth_header_name, updated_at FROM connectors WHERE workspace_id = ?`
    )
    .all(workspaceId) as ConnectorSummaryRow[];
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

export function findConnector(db: Database.Database, workspaceId: string, connectorId: string): Connector | undefined {
  const row = db
    .prepare(`SELECT * FROM connectors WHERE id = ? AND workspace_id = ?`)
    .get(connectorId, workspaceId) as ConnectorRow | undefined;
  return row ? rowToConnector(row) : undefined;
}

export function updateConnector(
  db: Database.Database,
  workspaceId: string,
  connectorId: string,
  input: {
    name?: string;
    baseUrl?: string;
    authType?: 'none' | 'bearer' | 'header';
    authHeaderName?: string;
    authValue?: string;
  }
): Connector | undefined {
  const existing = findConnector(db, workspaceId, connectorId);
  if (!existing) return undefined;

  const updated: Connector = {
    ...existing,
    name: input.name ?? existing.name,
    baseUrl: input.baseUrl ?? existing.baseUrl,
    authType: input.authType ?? existing.authType,
    authHeaderName: input.authHeaderName ?? existing.authHeaderName,
    authValue: input.authValue ?? existing.authValue,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    `UPDATE connectors SET name = ?, base_url = ?, auth_type = ?, auth_header_name = ?, auth_value = ?, updated_at = ?
     WHERE id = ? AND workspace_id = ?`
  ).run(
    updated.name,
    updated.baseUrl,
    updated.authType,
    updated.authHeaderName ?? null,
    updated.authValue ?? null,
    updated.updatedAt,
    connectorId,
    workspaceId
  );
  return updated;
}

export function deleteConnector(db: Database.Database, workspaceId: string, connectorId: string): boolean {
  const result = db.prepare(`DELETE FROM connectors WHERE id = ? AND workspace_id = ?`).run(connectorId, workspaceId);
  return result.changes > 0;
}
