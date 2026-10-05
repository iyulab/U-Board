import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import { recordAuditEvent } from './audit.js';

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

export async function findWorkspaceById(db: DbClient, id: string): Promise<Workspace | undefined> {
  const { rows } = await db.query<{ id: string; name: string; created_at: string }>(`SELECT * FROM workspaces WHERE id = $1`, [id]);
  const row = rows[0];
  return row ? { id: row.id, name: row.name, createdAt: row.created_at } : undefined;
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

export type MembershipChange = { kind: 'remove' } | { kind: 'set-role'; role: WorkspaceRole };

/**
 * Removes a member or changes their role while keeping the workspace's one invariant: at least
 * one owner remains. The workspace row is locked first so two concurrent changes (two owners each
 * removing the other) serialize — under READ COMMITTED both would otherwise count two owners and
 * both succeed, leaving none.
 */
export async function changeWorkspaceMembership(
  db: DbClient,
  /** `actorUserId`: who makes the change — the member themselves when leaving. */
  input: { workspaceId: string; userId: string; change: MembershipChange; actorUserId: string }
): Promise<'changed' | 'not-member' | 'last-owner'> {
  return db.withTransaction(async tx => {
    await tx.query(`SELECT id FROM workspaces WHERE id = $1 FOR UPDATE`, [input.workspaceId]);
    const target = await findWorkspaceUser(tx, input.workspaceId, input.userId);
    if (!target) return 'not-member';

    const losesOwner = target.role === 'owner' && (input.change.kind === 'remove' || input.change.role !== 'owner');
    if (losesOwner) {
      const { rows } = await tx.query<{ owners: number }>(
        `SELECT COUNT(*)::int AS owners FROM workspace_users WHERE workspace_id = $1 AND role = 'owner'`,
        [input.workspaceId]
      );
      if ((rows[0]?.owners ?? 0) <= 1) return 'last-owner';
    }

    const recorded = { workspaceId: input.workspaceId, actorUserId: input.actorUserId, subjectUserId: input.userId };
    if (input.change.kind === 'remove') {
      await tx.query(`DELETE FROM workspace_users WHERE id = $1`, [target.id]);
      await recordAuditEvent(tx, { ...recorded, action: input.userId === input.actorUserId ? 'member.left' : 'member.removed' });
    } else if (input.change.role !== target.role) {
      await tx.query(`UPDATE workspace_users SET role = $1 WHERE id = $2`, [input.change.role, target.id]);
      await recordAuditEvent(tx, { ...recorded, action: 'member.role_changed', role: input.change.role });
    }
    return 'changed';
  });
}
