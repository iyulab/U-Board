import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createConnector } from '../db/connectors.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';
import { RULEBOOK_EXAMPLE } from '@iyulab/u-board-designer/check';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let memberCookie: string;
let strangerCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });

  const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const stranger = await createUser(db, { email: 'stranger@x.com', passwordHash: 'h', name: 'Stranger' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  memberCookie = cookieFor(member.id, workspace.id);
  strangerCookie = cookieFor(stranger.id, workspace.id);
});

describe('boards routes', () => {
  it('gives the address its script elements’ frames are served from, when each definition has an origin of its own', async () => {
    const framed = createApp({ db, sessionSecret: SECRET, publicUrl: 'https://board.example.com', elementFrameOrigin: 'https://*.frames.example.com' });
    const create = await request(framed).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'B' });
    const get = await request(framed).get(`/api/workspaces/${workspaceId}/boards/${create.body.id}`).set('Cookie', memberCookie);
    expect(get.body.elementFrames).toBe(`https://{definition}.frames.example.com/api/element-frames/${create.body.id}`);
    const plain = await request(app).get(`/api/workspaces/${workspaceId}/boards/${create.body.id}`).set('Cookie', memberCookie);
    expect(plain.body).not.toHaveProperty('elementFrames');
  });

  it('rejects a non-member with 403', async () => {
    const res = await request(app).get(`/api/workspaces/${workspaceId}/boards`).set('Cookie', strangerCookie);
    expect(res.status).toBe(403);
  });

  it('creates, lists, fetches, updates and deletes a board end to end', async () => {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards`)
      .set('Cookie', memberCookie)
      .send({ name: 'My Board' });
    expect(create.status).toBe(201);
    const boardId = create.body.id;

    const list = await request(app).get(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie);
    expect(list.status).toBe(200);
    expect(list.body.boards).toEqual([{ id: boardId, name: 'My Board', kind: 'canvas', updatedAt: create.body.updatedAt }]);

    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.status).toBe(200);
    expect(get.body.document).toEqual({ parts: {}, layout: { kind: 'canvas', size: [1280, 720], place: {} } });

    const newDoc = { parts: { n1: { as: 'label', title: 'N1' } }, layout: { kind: 'canvas', size: [800, 600], place: { n1: [1, 2] } } };
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ document: newDoc });
    expect(update.status).toBe(200);

    const reget = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(reget.body.document).toEqual(newDoc);

    const del = await request(app).delete(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(del.status).toBe(204);

    const getAfterDelete = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(getAfterDelete.status).toBe(404);
  });

  it('creates a board of the kind asked for, and lists each board with the kind its document is now', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'Grid', kind: 'grid' });
    expect(create.status).toBe(201);
    expect(create.body.kind).toBe('grid');
    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${create.body.id}`).set('Cookie', memberCookie);
    expect(get.body.document).toEqual({ parts: {}, layout: { kind: 'grid', items: [] } });

    const canvas = { parts: {}, layout: { kind: 'canvas', size: [800, 600], place: {} } };
    await request(app).put(`/api/workspaces/${workspaceId}/boards/${create.body.id}`).set('Cookie', memberCookie).send({ document: canvas });
    const list = await request(app).get(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie);
    expect(list.body.boards.find((b: { id: string }) => b.id === create.body.id).kind).toBe('canvas');
  });

  it('refuses a kind it does not know with 400 INVALID_INPUT', async () => {
    const res = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'X', kind: 'table' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_DOCUMENT when the PUT body is not a board', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${create.body.id}`)
      .set('Cookie', memberCookie)
      .send({ document: { not: 'a document' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOCUMENT');
  });

  it('refuses a field the language does not have — it would be stored but never drawn', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const document = {
      parts: { a: { as: 'label', title: 'A' }, b: { as: 'label', title: 'B' } },
      layout: { kind: 'canvas', size: [400, 300], place: { a: [0, 0], b: [200, 0] }, links: { c: { from: 'a', to: 'b', color: 'blue' } } },
    };
    const res = await request(app).put(`/api/workspaces/${workspaceId}/boards/${create.body.id}`).set('Cookie', memberCookie).send({ document });
    expect(res.status).toBe(400);
    expect(res.body.issues.map((i: { path: string }) => i.path)).toEqual(['/layout/links/c/color']);
  });

  it('returns 404 for a board id that belongs to a different workspace', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });

    const otherWorkspace = await createWorkspace(db, 'Other');
    const otherMember = await createUser(db, { email: 'other@x.com', passwordHash: 'h', name: 'Other' });
    await addWorkspaceUser(db, { workspaceId: otherWorkspace.id, userId: otherMember.id, role: 'member' });
    const otherCookie = cookieFor(otherMember.id, otherWorkspace.id);

    const res = await request(app)
      .get(`/api/workspaces/${otherWorkspace.id}/boards/${create.body.id}`)
      .set('Cookie', otherCookie);
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown board id within the caller\'s own workspace', async () => {
    const res = await request(app).get(`/api/workspaces/${workspaceId}/boards/nonexistent-id`).set('Cookie', memberCookie);
    expect(res.status).toBe(404);
  });

  describe('saving against the copy that was read (If-Match)', () => {
    const board = () => `/api/workspaces/${workspaceId}/boards`;
    async function created() {
      const res = await request(app).post(board()).set('Cookie', memberCookie).send({ name: 'B' });
      return res.body.id as string;
    }

    it("tags a read with the board's revision", async () => {
      const id = await created();
      const res = await request(app).get(`${board()}/${id}`).set('Cookie', memberCookie);
      expect(res.headers.etag).toBe('"1"');
      expect(res.body.revision).toBe(1);
    });

    it('saves when If-Match names the current revision, and tags the answer with the next', async () => {
      const id = await created();
      const res = await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', '"1"').send({ name: 'Mine' });
      expect(res.status).toBe(200);
      expect(res.headers.etag).toBe('"2"');
      expect(res.body.revision).toBe(2);
    });

    it('refuses with 412 a save made against a revision someone has saved over, naming the current one', async () => {
      const id = await created();
      await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', '"1"').send({ name: 'Theirs' });
      const res = await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', '"1"').send({ name: 'Mine' });
      expect(res.status).toBe(412);
      expect(res.body).toEqual({ code: 'BOARD_CHANGED', revision: 2 });
      const read = await request(app).get(`${board()}/${id}`).set('Cookie', memberCookie);
      expect(read.body.name).toBe('Theirs');
    });

    it('treats a tag no revision has — weak, foreign, a list — as not matching', async () => {
      const id = await created();
      for (const tag of ['W/"1"', 'abc', '"1", "2"']) {
        const res = await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', tag).send({ name: 'X' });
        expect(res.status).toBe(412);
      }
    });

    it('finds a missing board missing (404), whatever tag the save names', async () => {
      const res = await request(app).put(`${board()}/no-such-board`).set('Cookie', memberCookie).set('If-Match', 'W/"1"').send({ name: 'X' });
      expect(res.status).toBe(404);
    });

    it('refuses a save of nothing, which would still count as one', async () => {
      const id = await created();
      const res = await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', '"1"').send({});
      expect(res.status).toBe(400);
      expect((await request(app).get(`${board()}/${id}`).set('Cookie', memberCookie)).body.revision).toBe(1);
    });

    it('saves unconditionally without If-Match, or with *', async () => {
      const id = await created();
      expect((await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).send({ name: 'A' })).status).toBe(200);
      expect((await request(app).put(`${board()}/${id}`).set('Cookie', memberCookie).set('If-Match', '*').send({ name: 'B' })).status).toBe(200);
    });
  });

  it('returns 400 INVALID_INPUT when PUT has an empty name', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const boardId = create.body.id;
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when PUT has a non-string name', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const boardId = create.body.id;
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: 123 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('allows a name-only PUT and keeps the document unchanged', async () => {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'Original' });
    const boardId = create.body.id;
    const originalDoc = (await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie)).body.document;

    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: 'Updated Name' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Updated Name');

    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('Updated Name');
    expect(get.body.document).toEqual(originalDoc);
  });
});

describe('PATCH /boards/:boardId — a JSON Patch', () => {
  async function gridBoard() {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'G', kind: 'grid' });
    await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${create.body.id}`)
      .set('Cookie', memberCookie)
      .send({ document: { parts: { a: { as: 'header', title: 'A' }, b: { as: 'header', title: 'B' } }, layout: { kind: 'grid', items: ['a', 'b'] } } });
    return create.body.id as string;
  }

  it('changes the parts it names, and answers the new revision with advice', async () => {
    const boardId = await gridBoard();
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .set('Content-Type', 'application/json-patch+json')
      .send(JSON.stringify([
        { op: 'replace', path: '/layout/items/1', value: ['b', 6] },
        { op: 'add', path: '/parts/b/title', value: 'Wide' }, // `add` sets a member whether or not it is there
      ]));
    expect(res.status).toBe(200);
    expect(res.body.revision).toBe(3);
    expect(res.get('ETag')).toBe('"3"');
    expect(Array.isArray(res.body.advice)).toBe(true);
    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.body.document.layout.items[1]).toEqual(['b', 6]);
  });

  it('applies nothing when an operation fails, and names it', async () => {
    const boardId = await gridBoard();
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send([{ op: 'replace', path: '/parts/a/title', value: 'First' }, { op: 'remove', path: '/layout/items/9' }]);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'INVALID_PATCH', operation: 1, message: 'operation 1: no item at /layout/items/9 — the list has 2 items (0–1)' });
    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.body.revision).toBe(2);
  });

  it('refuses a patch that leaves an invalid document, with the issues', async () => {
    const boardId = await gridBoard();
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send([{ op: 'add', path: '/layout/items/-', value: 'pump' }]);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOCUMENT');
    expect(res.body.issues.map((i: { path: string }) => i.path)).toEqual(['/layout/items/2']);
  });

  it('refuses a patch made against an older revision', async () => {
    const boardId = await gridBoard();
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .set('If-Match', '"1"')
      .send([{ op: 'replace', path: '/parts/a/title', value: 'First' }]);
    expect(res.status).toBe(412);
    expect(res.body).toEqual({ code: 'BOARD_CHANGED', revision: 2 });
  });
});

describe('a board written in the board language', () => {
  const data = { totals: { from: 'plant', path: '/plant/totals' } };
  const board = (parts: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
    data,
    parts,
    layout: { kind: 'grid', items: Object.keys(parts) },
    ...more,
  });

  async function newBoard(): Promise<string> {
    const create = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'B' });
    return create.body.id as string;
  }
  const put = (boardId: string, document: unknown) =>
    request(app).put(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie).send({ document });

  it('stores it as written, and lists it with the kind its layout has', async () => {
    const boardId = await newBoard();
    const saved = await put(boardId, RULEBOOK_EXAMPLE);
    expect(saved.status).toBe(200);
    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.body.document).toEqual(RULEBOOK_EXAMPLE);

    await put(boardId, board({ t: { as: 'stat', of: 'totals', show: 'count' } }));
    const list = await request(app).get(`/api/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie);
    expect(list.body.boards.find((b: { id: string }) => b.id === boardId).kind).toBe('grid');
  });

  it('is read with the picture its viewers draw it from', async () => {
    const boardId = await newBoard();
    await put(boardId, board({ t: { as: 'stat', of: 'totals', show: 'count' } }));
    const get = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.body.picture.kind).toBe('grid');
    expect(get.body.picture.items.map((i: { id: string }) => i.id)).toEqual(['t']);
  });

  it('refuses what its language does not have, each problem where it is', async () => {
    const boardId = await newBoard();
    const res = await put(boardId, board({ t: { as: 'metric', of: 'totals' } }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOCUMENT');
    expect(res.body.issues).toEqual([{ path: '/parts/t/as', message: expect.stringContaining('stat') }]);
  });

  it('answers a save with the advice its language gives', async () => {
    const boardId = await newBoard();
    const res = await put(
      boardId,
      board({ e: { as: 'element', element: 'tag', props: { name: 'pump' } } }, { elements: { tag: { template: '<b>{{name}}</b>', props: { name: 'string' } } } })
    );
    expect(res.status).toBe(200);
    expect(res.body.advice).toContainEqual({ path: '/elements/tag', message: expect.stringContaining('draws no shape of its own') });
  });

  it('changes by a JSON Patch, and is checked after it', async () => {
    const boardId = await newBoard();
    await put(boardId, board({ t: { as: 'stat', of: 'totals', show: 'count' } }));
    const patched = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send([{ op: 'add', path: '/parts/t/title', value: 'Total' }]);
    expect(patched.status).toBe(200);
    const refused = await request(app)
      .patch(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send([{ op: 'replace', path: '/parts/t/of', value: 'nowhere' }]);
    expect(refused.status).toBe(400);
    expect(refused.body.issues.map((i: { path: string }) => i.path)).toEqual(['/parts/t/of']);
  });

  it('advises on a read whose source is named by its name — with the id it takes', async () => {
    const source = await createConnector(db, { actorUserId: 'test-actor', workspaceId, name: 'Plant', baseUrl: 'https://plant.example.com', authType: 'none' });
    const boardId = await newBoard();
    const res = await put(boardId, { ...board({ t: { as: 'stat', of: 'totals', show: 'count' } }), data: { totals: { from: 'plant', path: '/plant/totals' } } });
    expect(res.status).toBe(200);
    expect(res.body.advice).toEqual([{ path: '/data/totals/from', message: `"plant" is the name of a data source — "from" takes its id: "${source.id}". Nothing is read until it does` }]);
  });
});
