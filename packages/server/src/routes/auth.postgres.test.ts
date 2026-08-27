import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { hashPassword } from '../auth/password.js';

const SECRET = 'test-secret-at-least-16-chars';

function dockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * `auth.test.ts` already has these same three scenarios, but PGlite is a single connection that
 * serializes every query internally — it can't exercise a genuine multi-connection race, so
 * those tests would still pass even if the advisory-lock/atomic-UPDATE concurrency control in
 * `routes/auth.ts` were silently broken (`ROADMAP.md` "회원가입 동시성의 실 Postgres 검증
 * 공백"). This file re-runs the same scenarios against a real Postgres instance via
 * testcontainers, with real concurrent connections, to actually prove it.
 *
 * Skipped automatically when Docker isn't reachable, so `npm test` still passes on a machine
 * without Docker running — CI's `ubuntu-latest` runners have Docker preinstalled.
 */
describe.skipIf(!dockerAvailable())('POST /auth/signup — real Postgres concurrency (testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let db: DbClient;
  let app: import('express').Express;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();
    db = await createDb(container.getConnectionUri());
    app = createApp({ db, sessionSecret: SECRET });
  }, 120_000); // image pull + container start can take a while on a cold Docker cache

  afterAll(async () => {
    await container?.stop();
  });

  afterEach(async () => {
    // One schema for the whole file (container startup is the expensive part) — reset data
    // between tests instead of restarting the container. All tables in one TRUNCATE so Postgres
    // doesn't need an explicit dependency order.
    await db.query(
      'TRUNCATE password_reset_tokens, workspace_invitations, board_share_tokens, connectors, boards, workspace_users, workspaces, users'
    );
  });

  it('serializes two concurrent open bootstrap signups — only one becomes owner', async () => {
    // Both requests have no invitation token, so both race the "am I the first user" bootstrap
    // gate guarded by pg_advisory_xact_lock. The loser is rejected by that gate (403) before it
    // ever reaches the users.email UNIQUE constraint — a separate scenario below races on the
    // constraint itself.
    const attempt = () => request(app).post('/auth/signup').send({ email: 'race@x.com', password: 'p4ssword!', name: 'Racer' });
    const [a, b] = await Promise.all([attempt(), attempt()]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 403]);
    expect(Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM users')).rows[0].c)).toBe(1);
  });

  it('rejects one of two concurrent invited signups with the same email — the users.email UNIQUE constraint wins', async () => {
    // Two distinct, independently-valid invitations for the same email. Both skip the bootstrap
    // gate (an invitation is present) and both successfully claim their own distinct invitation
    // row via markInvitationAcceptedIfUnused — so this is the scenario that actually reaches two
    // concurrent createUser() calls for the same email and exercises the 23505 catch.
    const owner = await createUser(db, { email: 'owner5@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W5');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitationA = await createInvitation(db, { workspaceId: workspace.id, email: 'race2@x.com', role: 'member', invitedByUserId: owner.id });
    const invitationB = await createInvitation(db, { workspaceId: workspace.id, email: 'race2@x.com', role: 'member', invitedByUserId: owner.id });

    const attempt = (token: string) => request(app).post('/auth/signup').send({
      email: 'race2@x.com', password: 'p4ssword!', name: 'Racer2', invitationToken: token,
    });
    const [a, b] = await Promise.all([attempt(invitationA.token), attempt(invitationB.token)]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);
    expect(
      Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM users WHERE email = $1', ['race2@x.com'])).rows[0].c)
    ).toBe(1);
  });

  it('rejects one of two concurrent signups redeeming the same invitation token', async () => {
    const owner = await createUser(db, { email: 'owner4@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W4');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'shared@x.com', role: 'member', invitedByUserId: owner.id });

    const attempt = () => request(app).post('/auth/signup').send({
      email: 'shared@x.com', password: 'p4ssword!', name: 'Shared', invitationToken: invitation.token,
    });
    const [a, b] = await Promise.all([attempt(), attempt()]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 410]);
  });
});
