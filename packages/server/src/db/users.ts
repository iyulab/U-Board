import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import { normalizeEmail } from './email.js';
import { recordAuditEvent } from './audit.js';

/** `operator` runs the installation; every other account is a `user`. Distinct from a workspace
 *  role — owning a workspace does not make anyone an operator. */
export type InstanceRole = 'operator' | 'user';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  instanceRole: InstanceRole;
  /** Sessions issued before this moment (ISO 8601) are refused; undefined when none are. */
  sessionsValidAfter?: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  instance_role: InstanceRole;
  sessions_valid_after: string | null;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    instanceRole: row.instance_role,
    ...(row.sessions_valid_after ? { sessionsValidAfter: row.sessions_valid_after } : {}),
    createdAt: row.created_at,
  };
}

export async function createUser(
  db: DbClient,
  input: { email: string; passwordHash: string; name: string; instanceRole?: InstanceRole }
): Promise<User> {
  const user: User = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name,
    instanceRole: input.instanceRole ?? 'user',
    createdAt: new Date().toISOString(),
  };
  await db.query(
    `INSERT INTO users (id, email, password_hash, name, instance_role, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, user.email, user.passwordHash, user.name, user.instanceRole, user.createdAt]
  );
  return user;
}

export async function findUserByEmail(db: DbClient, email: string): Promise<User | undefined> {
  const { rows } = await db.query<UserRow>(`SELECT * FROM users WHERE email = $1`, [normalizeEmail(email)]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function findUserById(db: DbClient, id: string): Promise<User | undefined> {
  const { rows } = await db.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

/** Replaces the password, signs out every session issued until now — they were opened with the old
 *  one — and voids every outstanding reset token, so an older reset email cannot undo the change.
 *  Returns that moment, so the caller can issue the one session it means to keep after it. */
export async function updateUserPassword(db: DbClient, userId: string, passwordHash: string): Promise<number> {
  const now = Date.now();
  const at = new Date(now).toISOString();
  await db.withTransaction(async tx => {
    await tx.query(`UPDATE users SET password_hash = $1, sessions_valid_after = $2 WHERE id = $3`, [passwordHash, at, userId]);
    await tx.query(`UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL`, [at, userId]);
  });
  return now;
}

export async function updateUserName(db: DbClient, userId: string, name: string): Promise<void> {
  await db.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);
}

export async function countUsers(db: DbClient): Promise<number> {
  // Postgres COUNT(*) returns bigint, which node-postgres/PGlite surface as a string to avoid
  // precision loss beyond Number.MAX_SAFE_INTEGER — Number(...) is safe here (user counts never
  // approach that range).
  const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM users`);
  return Number(rows[0].count);
}

export type AccountDeletion =
  | { kind: 'deleted' }
  | { kind: 'not-found' }
  | { kind: 'last-operator' }
  /** Workspaces (by name) the account is the only owner of — hand them over first. */
  | { kind: 'last-owner'; workspaces: string[] };

/**
 * Deletes an account and with it the personal data the installation holds about that person (email,
 * name, password hash, memberships, reset tokens). Refused while the account is the last operator or
 * the only owner of a workspace, so deleting it never strands the installation or a workspace.
 * Locks the operator rows and then each workspace the account owns — the same rows
 * `setInstanceRole` and `changeWorkspaceMembership` lock, in an order neither reverses — so a
 * concurrent demotion, removal or second deletion cannot slip past the checks.
 */
export async function deleteAccount(db: DbClient, userId: string): Promise<AccountDeletion> {
  return db.withTransaction(async tx => {
    const { rows: operators } = await tx.query<{ id: string }>(
      `SELECT id FROM users WHERE instance_role = 'operator' ORDER BY id FOR UPDATE`
    );
    // The account's own row too: a membership being added for it right now (it creating a workspace,
    // an operator making it an owner) waits for this deletion instead of racing past the checks below.
    const { rows: target } = await tx.query<{ instance_role: InstanceRole; email: string }>(
      `SELECT instance_role, email FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    if (!target[0]) return { kind: 'not-found' };
    if (target[0].instance_role === 'operator' && operators.length <= 1) return { kind: 'last-operator' };

    const { rows: owned } = await tx.query<{ id: string; name: string }>(
      `SELECT w.id, w.name FROM workspaces w JOIN workspace_users wu ON wu.workspace_id = w.id
       WHERE wu.user_id = $1 AND wu.role = 'owner' ORDER BY w.id FOR UPDATE OF w`,
      [userId]
    );
    const soleOwned: string[] = [];
    for (const workspace of owned) {
      const { rows } = await tx.query<{ owners: number }>(
        `SELECT COUNT(*)::int AS owners FROM workspace_users WHERE workspace_id = $1 AND role = 'owner'`,
        [workspace.id]
      );
      if ((rows[0]?.owners ?? 0) <= 1) soleOwned.push(workspace.name);
    }
    if (soleOwned.length > 0) return { kind: 'last-owner', workspaces: soleOwned };

    // Accepted invitations addressed to the person are a record about them; pending ones stay with the
    // workspace that sent them.
    await tx.query(`DELETE FROM workspace_invitations WHERE email = $1 AND accepted_at IS NOT NULL`, [target[0].email]);
    // Records keep what happened but no longer say who: the account's id and address are cleared
    // from every record, the one about this deletion included.
    await recordAuditEvent(tx, { action: 'account.deleted', actorUserId: userId });
    await tx.query(
      `UPDATE audit_events SET
         actor_user_id = CASE WHEN actor_user_id = $1 THEN NULL ELSE actor_user_id END,
         subject_user_id = CASE WHEN subject_user_id = $1 THEN NULL ELSE subject_user_id END,
         subject_email = CASE WHEN subject_email = $2 THEN NULL ELSE subject_email END
       WHERE actor_user_id = $1 OR subject_user_id = $1 OR subject_email = $2`,
      [userId, target[0].email]
    );
    await tx.query(`DELETE FROM users WHERE id = $1`, [userId]);
    return { kind: 'deleted' };
  });
}
