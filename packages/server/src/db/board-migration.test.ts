import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createWorkspace } from './workspaces.js';
import { createBoard, findBoard, listBoardsForWorkspace, updateBoard } from './boards.js';
import { migrateFirstVersionBoards } from './board-migration.js';

// The boards stored before the board language's second version move to it once, at start: each that it carries whole,
// with what it replaced kept to put back; one it does not carry stays as it is, named, and is not tried again until it is
// saved anew.

/** A first-version canvas the second version carries: a metric node bound to a source. */
const carried = {
  kind: 'canvas',
  background: {},
  nodes: [
    { id: 'pump', x: 40, y: 40, anchored: false, width: 160, height: 100, widget: { type: 'metric', props: { label: 'Flow' }, bindings: { 'data.value': { adapter: 'plant', ref: { path: '/pump', valuePath: '/flow' } } } } },
  ],
  connectors: [],
};

/** One it does not: a node whose own states the second version has no place for yet. */
const notCarried = {
  ...carried,
  nodes: [{ ...carried.nodes[0], states: [{ when: { field: 'data.value', equals: 'down' }, props: { label: 'Pump down' } }] }],
};

let db: DbClient;
let workspaceId: string;

beforeEach(async () => {
  db = await createTestDb();
  workspaceId = (await createWorkspace(db, 'W1')).id;
});

async function storedV1(document: unknown, name = 'Board') {
  const board = await createBoard(db, { workspaceId, name, actorUserId: 'test-actor' });
  await updateBoard(db, workspaceId, board.id, { document: document as never });
  return (await findBoard(db, workspaceId, board.id))!;
}

describe('moving stored boards to the board language’s second version', () => {
  it('moves a board it carries, once — keeping what it replaced in the record', async () => {
    const before = await storedV1(carried);
    const report = await migrateFirstVersionBoards(db);
    expect(report).toEqual({ migrated: 1, kept: [] });

    const after = (await findBoard(db, workspaceId, before.id))!;
    expect((after.document as { version?: number }).version).toBe(2);
    expect(after.revision).toBe(before.revision + 1);
    const { rows } = await db.query<{ outcome: string; revision: number; before_document: string }>(`SELECT outcome, revision, before_document FROM board_migrations WHERE board_id = $1`, [before.id]);
    expect(rows).toEqual([{ outcome: 'migrated', revision: before.revision, before_document: JSON.stringify(before.document) }]);

    // Again: nothing left to move, nothing recorded twice.
    expect(await migrateFirstVersionBoards(db)).toEqual({ migrated: 0, kept: [] });
    expect((await db.query(`SELECT 1 FROM board_migrations`)).rows).toHaveLength(1);
  });

  it('leaves a board it does not carry whole as it is, names it with what it uses, and tries it again at every start', async () => {
    const kept = await storedV1(notCarried, 'Line 1');
    const report = await migrateFirstVersionBoards(db);
    expect(report.migrated).toBe(0);
    expect(report.kept).toEqual([{ boardId: kept.id, workspaceId, name: 'Line 1', unsupported: [expect.stringContaining('states')] }]);
    expect((await findBoard(db, workspaceId, kept.id))!.document).toEqual(notCarried);

    // Tried again, kept again for the same reasons — recorded once.
    expect((await migrateFirstVersionBoards(db)).kept).toHaveLength(1);
    expect((await db.query(`SELECT 1 FROM board_migrations WHERE board_id = $1`, [kept.id])).rows).toHaveLength(1);
    // The board list says it stays, with what keeps it.
    expect((await listBoardsForWorkspace(db, workspaceId)).find(b => b.id === kept.id)!.firstVersion).toEqual([expect.stringContaining('states')]);

    // Once the conversion carries it — here, what kept it gone from the stored board at the same revision, as a
    // conversion grown since would — it is moved on the next start, with no save between.
    await db.query(`UPDATE boards SET document = $1 WHERE id = $2`, [JSON.stringify(carried), kept.id]);
    expect((await migrateFirstVersionBoards(db)).migrated).toBe(1);
    expect((await listBoardsForWorkspace(db, workspaceId)).find(b => b.id === kept.id)!.firstVersion).toBeUndefined();
  });

  it('leaves a board in the second version — a new one — alone', async () => {
    const board = await createBoard(db, { workspaceId, name: 'New', actorUserId: 'test-actor' });
    expect(await migrateFirstVersionBoards(db)).toEqual({ migrated: 0, kept: [] });
    expect((await findBoard(db, workspaceId, board.id))!.revision).toBe(board.revision);
  });
});
