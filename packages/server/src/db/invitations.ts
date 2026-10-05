import type { DbClient } from '../db.js';
import { randomUUID, randomBytes } from 'node:crypto';
import type { WorkspaceRole } from './workspaces.js';
import { normalizeEmail } from './email.js';
import { recordAuditEvent } from './audit.js';

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  /** Null once the account that sent it has been deleted. */
  invitedByUserId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface InvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by_user_id: string | null;
  expires_at: string;
  accepted_at: string | null;
}

function rowToInvitation(row: InvitationRow): WorkspaceInvitation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedByUserId: row.invited_by_user_id,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

export async function createInvitation(
  db: DbClient,
  input: { workspaceId: string; email: string; role: WorkspaceRole; invitedByUserId: string }
): Promise<WorkspaceInvitation> {
  const invitation: WorkspaceInvitation = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    email: normalizeEmail(input.email),
    role: input.role,
    token: randomBytes(24).toString('hex'),
    invitedByUserId: input.invitedByUserId,
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
    acceptedAt: null,
  };
  await db.withTransaction(async tx => {
    await tx.query(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, invited_by_user_id, expires_at, accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [invitation.id, invitation.workspaceId, invitation.email, invitation.role, invitation.token, invitation.invitedByUserId, invitation.expiresAt, invitation.acceptedAt]
    );
    await recordAuditEvent(tx, {
      action: 'invitation.created',
      workspaceId: invitation.workspaceId,
      actorUserId: input.invitedByUserId,
      subjectEmail: invitation.email,
      role: invitation.role,
    });
  });
  return invitation;
}

export async function findInvitationByToken(db: DbClient, token: string): Promise<WorkspaceInvitation | undefined> {
  const { rows } = await db.query<InvitationRow>(`SELECT * FROM workspace_invitations WHERE token = $1`, [token]);
  return rows[0] ? rowToInvitation(rows[0]) : undefined;
}

/** Atomically claims an invitation only if nobody has accepted it yet — the WHERE clause and the
 * write happen as one statement, so two concurrent redemptions of the same token can't both
 * succeed (the loser gets zero rows back). This is what actually makes concurrent signup safe
 * under Postgres with multiple server instances; a separate read-then-write from the caller
 * would not be. */
export async function markInvitationAcceptedIfUnused(db: DbClient, id: string): Promise<WorkspaceInvitation | undefined> {
  const { rows } = await db.query<InvitationRow>(
    `UPDATE workspace_invitations SET accepted_at = $1 WHERE id = $2 AND accepted_at IS NULL RETURNING *`,
    [new Date().toISOString(), id]
  );
  return rows[0] ? rowToInvitation(rows[0]) : undefined;
}

export function isInvitationUsable(invitation: WorkspaceInvitation): boolean {
  if (invitation.acceptedAt !== null) return false;
  return new Date(invitation.expiresAt).getTime() > Date.now();
}

/** Invitations that can still be redeemed — not accepted, not expired. Tokens stay out of the
 * result: the link is shown once when it is created, like a share token. */
export async function listPendingInvitations(
  db: DbClient,
  workspaceId: string
): Promise<Array<Omit<WorkspaceInvitation, 'token' | 'acceptedAt'>>> {
  const { rows } = await db.query<InvitationRow>(
    `SELECT * FROM workspace_invitations
     WHERE workspace_id = $1 AND accepted_at IS NULL AND expires_at > $2
     ORDER BY expires_at ASC, id ASC`,
    [workspaceId, new Date().toISOString()]
  );
  return rows.map(row => {
    const { token: _token, acceptedAt: _acceptedAt, ...rest } = rowToInvitation(row);
    return rest;
  });
}

/** Deletes an unaccepted invitation of this workspace; `false` when there is none to revoke. */
export async function revokeInvitation(db: DbClient, workspaceId: string, invitationId: string, actorUserId: string): Promise<boolean> {
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<{ email: string; role: WorkspaceRole }>(
      `DELETE FROM workspace_invitations WHERE id = $1 AND workspace_id = $2 AND accepted_at IS NULL RETURNING email, role`,
      [invitationId, workspaceId]
    );
    if (!rows[0]) return false;
    await recordAuditEvent(tx, { action: 'invitation.revoked', workspaceId, actorUserId, subjectEmail: rows[0].email, role: rows[0].role });
    return true;
  });
}

/** Gives a pending invitation of this workspace a fresh expiry — same token, so a link already sent
 *  keeps working. `undefined` when there is no such pending invitation (accepted, expired, revoked). */
export async function renewPendingInvitation(
  db: DbClient,
  workspaceId: string,
  invitationId: string,
  actorUserId: string
): Promise<WorkspaceInvitation | undefined> {
  const now = Date.now();
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<InvitationRow>(
      `UPDATE workspace_invitations SET expires_at = $1
       WHERE id = $2 AND workspace_id = $3 AND accepted_at IS NULL AND expires_at > $4
       RETURNING *`,
      [new Date(now + INVITATION_TTL_MS).toISOString(), invitationId, workspaceId, new Date(now).toISOString()]
    );
    if (!rows[0]) return undefined;
    const invitation = rowToInvitation(rows[0]);
    await recordAuditEvent(tx, { action: 'invitation.resent', workspaceId, actorUserId, subjectEmail: invitation.email, role: invitation.role });
    return invitation;
  });
}
