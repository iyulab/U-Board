import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import type { InstanceRole } from './users.js';
import { recordAuditEvent } from './audit.js';

/** What an operator sees of a workspace: enough to run the installation, nothing of its contents. */
export interface InstanceWorkspace {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  owners: Array<{ userId: string; email: string; name: string }>;
}

export interface InstanceUser {
  id: string;
  email: string;
  name: string;
  instanceRole: InstanceRole;
  createdAt: string;
  workspaceCount: number;
}

export async function listInstanceWorkspaces(db: DbClient): Promise<InstanceWorkspace[]> {
  const { rows: workspaces } = await db.query<{ id: string; name: string; created_at: string; member_count: number }>(
    `SELECT w.id, w.name, w.created_at, COUNT(wu.id)::int AS member_count
     FROM workspaces w LEFT JOIN workspace_users wu ON wu.workspace_id = w.id
     GROUP BY w.id ORDER BY w.created_at ASC, w.id ASC`
  );
  const { rows: owners } = await db.query<{ workspace_id: string; user_id: string; email: string; name: string }>(
    `SELECT wu.workspace_id, u.id AS user_id, u.email, u.name
     FROM workspace_users wu JOIN users u ON u.id = wu.user_id
     WHERE wu.role = 'owner' ORDER BY wu.created_at ASC, u.id ASC`
  );
  return workspaces.map(w => ({
    id: w.id,
    name: w.name,
    createdAt: w.created_at,
    memberCount: Number(w.member_count),
    owners: owners.filter(o => o.workspace_id === w.id).map(o => ({ userId: o.user_id, email: o.email, name: o.name })),
  }));
}

export async function listInstanceUsers(db: DbClient): Promise<InstanceUser[]> {
  const { rows } = await db.query<{
    id: string; email: string; name: string; instance_role: InstanceRole; created_at: string; workspace_count: number;
  }>(
    `SELECT u.id, u.email, u.name, u.instance_role, u.created_at, COUNT(wu.id)::int AS workspace_count
     FROM users u LEFT JOIN workspace_users wu ON wu.user_id = u.id
     GROUP BY u.id ORDER BY u.created_at ASC, u.id ASC`
  );
  return rows.map(r => ({
    id: r.id,
    email: r.email,
    name: r.name,
    instanceRole: r.instance_role,
    createdAt: r.created_at,
    workspaceCount: Number(r.workspace_count),
  }));
}

/**
 * Sets an account's instance role while keeping the installation's invariant: at least one
 * operator remains. Every operator row is locked first, so two operators demoting each other at
 * once serialize — the second re-reads the locked rows after the first commits and finds itself
 * the last one.
 */
export async function setInstanceRole(
  db: DbClient,
  userId: string,
  role: InstanceRole,
  actorUserId: string
): Promise<'changed' | 'not-found' | 'last-operator'> {
  return db.withTransaction(async tx => {
    const { rows: operators } = await tx.query<{ id: string }>(
      `SELECT id FROM users WHERE instance_role = 'operator' ORDER BY id FOR UPDATE`
    );
    const { rows: target } = await tx.query<{ instance_role: InstanceRole }>(`SELECT instance_role FROM users WHERE id = $1`, [userId]);
    if (!target[0]) return 'not-found';
    if (target[0].instance_role === 'operator' && role !== 'operator' && operators.length <= 1) return 'last-operator';
    if (target[0].instance_role !== role) {
      await tx.query(`UPDATE users SET instance_role = $1 WHERE id = $2`, [role, userId]);
      await recordAuditEvent(tx, { action: 'instance.role_changed', actorUserId, subjectUserId: userId, role });
    }
    return 'changed';
  });
}

/** Makes an account an owner of a workspace — adding it, or promoting it if it is already a member.
 *  The operator's way back into a workspace whose owners are gone — recorded in that workspace's
 *  history, so its owners see who was let in and by whom. */
export async function makeWorkspaceOwner(
  db: DbClient,
  workspaceId: string,
  userId: string,
  actorUserId: string
): Promise<'changed' | 'no-workspace' | 'no-user'> {
  return db.withTransaction(async tx => {
    const { rows: workspace } = await tx.query(`SELECT 1 FROM workspaces WHERE id = $1`, [workspaceId]);
    if (workspace.length === 0) return 'no-workspace';
    const { rows: user } = await tx.query(`SELECT 1 FROM users WHERE id = $1`, [userId]);
    if (user.length === 0) return 'no-user';
    await tx.query(
      `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ($1, $2, $3, 'owner', $4)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner'`,
      [randomUUID(), workspaceId, userId, new Date().toISOString()]
    );
    await recordAuditEvent(tx, { action: 'workspace.owner_restored', workspaceId, actorUserId, subjectUserId: userId, role: 'owner' });
    return 'changed';
  });
}
