import type Database from 'better-sqlite3';
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

export function createWorkspace(db: Database.Database, name: string): Workspace {
  const workspace: Workspace = { id: randomUUID(), name, createdAt: new Date().toISOString() };
  db.prepare(`INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)`).run(
    workspace.id, workspace.name, workspace.createdAt
  );
  return workspace;
}

export function addWorkspaceUser(
  db: Database.Database,
  input: { workspaceId: string; userId: string; role: WorkspaceRole }
): WorkspaceUser {
  const wu: WorkspaceUser = { id: randomUUID(), workspaceId: input.workspaceId, userId: input.userId, role: input.role, createdAt: new Date().toISOString() };
  db.prepare(
    `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(wu.id, wu.workspaceId, wu.userId, wu.role, wu.createdAt);
  return wu;
}

export function findWorkspaceUser(db: Database.Database, workspaceId: string, userId: string): WorkspaceUser | undefined {
  const row = db
    .prepare(`SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?`)
    .get(workspaceId, userId) as
    | { id: string; workspace_id: string; user_id: string; role: WorkspaceRole; created_at: string }
    | undefined;
  if (!row) return undefined;
  return { id: row.id, workspaceId: row.workspace_id, userId: row.user_id, role: row.role, createdAt: row.created_at };
}

export function listWorkspacesForUser(db: Database.Database, userId: string): Workspace[] {
  const rows = db
    .prepare(
      // Ordered so the caller's [0] is stable: login uses it to pick the session's initial
      // activeWorkspaceId, and the console's workspace switcher lists it as-is. `id` breaks
      // ties between workspaces created within the same millisecond.
      `SELECT w.id, w.name, w.created_at FROM workspaces w
       JOIN workspace_users wu ON wu.workspace_id = w.id
       WHERE wu.user_id = ?
       ORDER BY w.created_at ASC, w.id ASC`
    )
    .all(userId) as { id: string; name: string; created_at: string }[];
  return rows.map(r => ({ id: r.id, name: r.name, createdAt: r.created_at }));
}

export function listWorkspaceMembers(
  db: Database.Database,
  workspaceId: string
): Array<{ userId: string; email: string; name: string; role: WorkspaceRole }> {
  const rows = db
    .prepare(
      `SELECT u.id as user_id, u.email, u.name, wu.role
       FROM workspace_users wu JOIN users u ON u.id = wu.user_id
       WHERE wu.workspace_id = ?`
    )
    .all(workspaceId) as { user_id: string; email: string; name: string; role: WorkspaceRole }[];
  return rows.map(r => ({ userId: r.user_id, email: r.email, name: r.name, role: r.role }));
}
