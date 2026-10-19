import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// What a data source answers and where, written by its owner — so whoever binds to it, a person or an assistant that
// cannot guess a path, reads its paths instead of trying them.

const SECRET = 'test-secret-at-least-16-chars';
const PATHS = 'GET /line-1.json — the line’s figures; its stations under /stations, one per station by "id".';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
});

const base = () => `/api/workspaces/${workspaceId}/connectors`;
const create = (body: Record<string, unknown>) =>
  request(app).post(base()).set('Cookie', ownerCookie).send({ name: 'Line', baseUrl: 'https://mes.example.com', authType: 'none', ...body });

describe('a connector’s description', () => {
  it('is stored trimmed, listed, kept on a rename, replaced, and cleared with null or blank', async () => {
    const { body: created } = await create({ description: `  ${PATHS}\n` });
    expect(created.description).toBe(PATHS);
    expect((await request(app).get(base()).set('Cookie', ownerCookie)).body.connectors[0].description).toBe(PATHS);

    const renamed = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ name: 'Line 1' });
    expect(renamed.body.description).toBe(PATHS);

    const replaced = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ description: 'GET /v2/line' });
    expect(replaced.body.description).toBe('GET /v2/line');
    const { events } = (await request(app).get(`/api/workspaces/${workspaceId}/audit`).set('Cookie', ownerCookie)).body;
    expect(events[0]).toMatchObject({ action: 'connector.updated', detail: 'description' });

    for (const cleared of [null, '   ']) {
      const answer = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ description: cleared });
      expect(answer.body.description).toBeUndefined();
    }
  });

  it('is text of at most 2000 characters', async () => {
    for (const description of [42, { text: 'x' }, 'x'.repeat(2001)]) {
      expect((await create({ description })).status, JSON.stringify(description).slice(0, 20)).toBe(400);
    }
    expect((await create({ description: 'x'.repeat(2000) })).status).toBe(201);
  });
});
