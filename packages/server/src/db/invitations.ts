import type { DbClient } from '../db.js';
import { randomUUID, randomBytes } from 'node:crypto';
import type { WorkspaceRole } from './workspaces.js';
import { normalizeEmail } from './email.js';

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedByUserId: string;
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
  invited_by_user_id: string;
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
  await db.query(
    `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, invited_by_user_id, expires_at, accepted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [invitation.id, invitation.workspaceId, invitation.email, invitation.role, invitation.token, invitation.invitedByUserId, invitation.expiresAt, invitation.acceptedAt]
  );
  return invitation;
}

export async function findInvitationByToken(db: DbClient, token: string): Promise<WorkspaceInvitation | undefined> {
  const { rows } = await db.query<InvitationRow>(`SELECT * FROM workspace_invitations WHERE token = $1`, [token]);
  return rows[0] ? rowToInvitation(rows[0]) : undefined;
}

export async function markInvitationAccepted(db: DbClient, id: string): Promise<void> {
  await db.query(`UPDATE workspace_invitations SET accepted_at = $1 WHERE id = $2`, [new Date().toISOString(), id]);
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
