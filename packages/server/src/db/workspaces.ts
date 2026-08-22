import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';

export type WorkspaceRole = 'owner' | 'member';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface WorkspaceUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export async function createWorkspace(db: DbClient, name: string): Promise<Workspace> {
  const workspace: Workspace = { id: randomUUID(), name, createdAt: new Date().toISOString() };
  await db.query(`INSERT INTO workspaces (id, name, created_at) VALUES ($1, $2, $3)`, [
    workspace.id, workspace.name, workspace.createdAt,
  ]);
  return workspace;
}

export async function addWorkspaceUser(
  db: DbClient,
  input: { workspaceId: string; userId: string; role: WorkspaceRole }
): Promise<WorkspaceUser> {
  const wu: WorkspaceUser = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    userId: input.userId,
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  await db.query(
    `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [wu.id, wu.workspaceId, wu.userId, wu.role, wu.createdAt]
  );
  return wu;
}

export async function findWorkspaceUser(db: DbClient, workspaceId: string, userId: string): Promise<WorkspaceUser | undefined> {
  const { rows } = await db.query<{ id: string; workspace_id: string; user_id: string; role: WorkspaceRole; created_at: string }>(
    `SELECT * FROM workspace_users WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
  const row = rows[0];
  if (!row) return undefined;
  return { id: row.id, workspaceId: row.workspace_id, userId: row.user_id, role: row.role, createdAt: row.created_at };
}

export async function listWorkspacesForUser(db: DbClient, userId: string): Promise<Workspace[]> {
  const { rows } = await db.query<{ id: string; name: string; created_at: string }>(
    // Ordered so the caller's [0] is stable: login uses it to pick the session's initial
    // activeWorkspaceId, and the console's workspace switcher lists it as-is. `id` breaks
    // ties between workspaces created within the same millisecond.
    `SELECT w.id, w.name, w.created_at FROM workspaces w
     JOIN workspace_users wu ON wu.workspace_id = w.id
     WHERE wu.user_id = $1
     ORDER BY w.created_at ASC, w.id ASC`,
    [userId]
  );
  return rows.map(r => ({ id: r.id, name: r.name, createdAt: r.created_at }));
}

export async function listWorkspaceMembers(
  db: DbClient,
  workspaceId: string
): Promise<Array<{ userId: string; email: string; name: string; role: WorkspaceRole }>> {
  const { rows } = await db.query<{ user_id: string; email: string; name: string; role: WorkspaceRole }>(
    `SELECT u.id as user_id, u.email, u.name, wu.role
     FROM workspace_users wu JOIN users u ON u.id = wu.user_id
     WHERE wu.workspace_id = $1`,
    [workspaceId]
  );
  return rows.map(r => ({ userId: r.user_id, email: r.email, name: r.name, role: r.role }));
}
