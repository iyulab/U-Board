import type Database from 'better-sqlite3';
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

export function createInvitation(
  db: Database.Database,
  input: { workspaceId: string; email: string; role: WorkspaceRole; invitedByUserId: string }
): WorkspaceInvitation {
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
  db.prepare(
    `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, invited_by_user_id, expires_at, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    invitation.id, invitation.workspaceId, invitation.email, invitation.role,
    invitation.token, invitation.invitedByUserId, invitation.expiresAt, invitation.acceptedAt
  );
  return invitation;
}

export function findInvitationByToken(db: Database.Database, token: string): WorkspaceInvitation | undefined {
  const row = db.prepare(`SELECT * FROM workspace_invitations WHERE token = ?`).get(token) as InvitationRow | undefined;
  return row ? rowToInvitation(row) : undefined;
}

export function markInvitationAccepted(db: Database.Database, id: string): void {
  db.prepare(`UPDATE workspace_invitations SET accepted_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
}

export function isInvitationUsable(invitation: WorkspaceInvitation): boolean {
  if (invitation.acceptedAt !== null) return false;
  return new Date(invitation.expiresAt).getTime() > Date.now();
}
