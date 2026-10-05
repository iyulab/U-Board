import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';

/** What happened. Workspace actions are read by that workspace's owners; the instance actions are
 *  read by operators, together with the instance-level facts about workspaces (creation, an
 *  operator restoring an owner) — never a workspace's own membership changes. */
export type AuditAction =
  | 'workspace.created'
  | 'workspace.owner_restored'
  | 'member.joined'
  | 'member.left'
  | 'member.removed'
  | 'member.role_changed'
  | 'invitation.created'
  | 'invitation.resent'
  | 'invitation.revoked'
  | 'instance.role_changed'
  | 'account.deleted'
  | 'board.created'
  | 'board.deleted'
  | 'share_link.created'
  | 'share_link.deleted'
  | 'connector.created'
  | 'connector.updated'
  | 'connector.deleted';

const INSTANCE_ACTIONS: readonly AuditAction[] = [
  'workspace.created',
  'workspace.owner_restored',
  'instance.role_changed',
  'account.deleted',
];

/** Actions that are about someone other than (or as well as) the actor. */
const SUBJECT_ACTIONS: readonly AuditAction[] = [
  'workspace.owner_restored',
  'member.left',
  'member.removed',
  'member.role_changed',
  'invitation.created',
  'invitation.resent',
  'invitation.revoked',
  'instance.role_changed',
];

export interface AuditEventInput {
  action: AuditAction;
  workspaceId?: string;
  actorUserId: string;
  subjectUserId?: string;
  /** An invitation's recipient, who may have no account. */
  subjectEmail?: string;
  /** The role granted or set — a workspace role, or an instance role. */
  role?: string;
  /** The board or connector a record is about, named as it is at the time. */
  target?: { id: string; name: string };
  /** A short, non-secret particular — never a credential or a whole token. */
  detail?: string;
}

export interface AuditPerson {
  /** Null once the account has been deleted. */
  userId: string | null;
  name: string | null;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  action: AuditAction;
  workspace: { id: string; name: string } | null;
  actor: AuditPerson;
  subject: (AuditPerson & { email: string | null }) | null;
  role: string | null;
  target: { id: string; name: string } | null;
  detail: string | null;
}

/** Records an event. Call it with the transaction that makes the change, so the record exists
 *  exactly when the change does. */
export async function recordAuditEvent(db: DbClient, event: AuditEventInput): Promise<void> {
  await db.query(
    `INSERT INTO audit_events (id, occurred_at, action, workspace_id, actor_user_id, subject_user_id, subject_email, role, target_id, target_name, detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      randomUUID(),
      new Date().toISOString(),
      event.action,
      event.workspaceId ?? null,
      event.actorUserId,
      event.subjectUserId ?? null,
      event.subjectEmail ?? null,
      event.role ?? null,
      event.target?.id ?? null,
      event.target?.name ?? null,
      event.detail ?? null,
    ]
  );
}

export interface AuditPage {
  /** Only events recorded before this one (exclusive) — the `nextBefore` of the previous page. */
  before?: string;
  limit: number;
}

export interface AuditEventList {
  events: AuditEvent[];
  /** Pass as `before` for the next (older) page; null when there is none. */
  nextBefore: string | null;
}

interface AuditRow {
  id: string;
  seq: string;
  occurred_at: string;
  action: AuditAction;
  workspace_id: string | null;
  workspace_name: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  subject_user_id: string | null;
  subject_name: string | null;
  subject_email: string | null;
  role: string | null;
  target_id: string | null;
  target_name: string | null;
  detail: string | null;
}

const SELECT_EVENTS = `
  SELECT e.id, e.seq::text AS seq, e.occurred_at, e.action, e.workspace_id, w.name AS workspace_name,
         e.actor_user_id, actor.name AS actor_name,
         e.subject_user_id, subject.name AS subject_name, e.subject_email, e.role,
         e.target_id, e.target_name, e.detail
  FROM audit_events e
  LEFT JOIN workspaces w ON w.id = e.workspace_id
  LEFT JOIN users actor ON actor.id = e.actor_user_id
  LEFT JOIN users subject ON subject.id = e.subject_user_id`;

async function listEvents(db: DbClient, where: string, params: unknown[], page: AuditPage): Promise<AuditEventList> {
  const conditions = [where];
  if (page.before !== undefined) {
    params.push(page.before);
    conditions.push(`e.seq < $${params.length}`);
  }
  params.push(page.limit + 1);
  const { rows } = await db.query<AuditRow>(
    `${SELECT_EVENTS} WHERE ${conditions.join(' AND ')} ORDER BY e.seq DESC LIMIT $${params.length}`,
    params
  );
  const pageRows = rows.slice(0, page.limit);
  return {
    events: pageRows.map(rowToEvent),
    // The cursor is the recording order, opaque to clients.
    nextBefore: rows.length > page.limit ? pageRows[pageRows.length - 1].seq : null,
  };
}

function rowToEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    action: row.action,
    workspace: row.workspace_id ? { id: row.workspace_id, name: row.workspace_name ?? '' } : null,
    actor: { userId: row.actor_user_id, name: row.actor_name },
    // A subject whose account was deleted (and whose invitation address was cleared with it) reads
    // as a subject with no name, not as no subject.
    subject:
      row.subject_user_id || row.subject_email || SUBJECT_ACTIONS.includes(row.action)
        ? { userId: row.subject_user_id, name: row.subject_name, email: row.subject_email }
        : null,
    role: row.role,
    target: row.target_id ? { id: row.target_id, name: row.target_name ?? '' } : null,
    detail: row.detail,
  };
}

/** Everything recorded about one workspace, newest first. */
export function listWorkspaceAuditEvents(db: DbClient, workspaceId: string, page: AuditPage): Promise<AuditEventList> {
  return listEvents(db, 'e.workspace_id = $1', [workspaceId], page);
}

/** The installation's own events, newest first: workspaces created, owners restored by an operator,
 *  instance roles changed, accounts deleted. */
export function listInstanceAuditEvents(db: DbClient, page: AuditPage): Promise<AuditEventList> {
  return listEvents(db, 'e.action = ANY($1)', [INSTANCE_ACTIONS], page);
}

/** Deletes events recorded before `cutoff`; returns how many. */
export async function purgeAuditEventsBefore(db: DbClient, cutoff: Date): Promise<number> {
  const { rowCount } = await db.query(`DELETE FROM audit_events WHERE occurred_at < $1`, [cutoff.toISOString()]);
  return rowCount ?? 0;
}
