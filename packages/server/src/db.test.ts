import { describe, it, expect } from 'vitest';
import { createDb } from './db.js';

describe('createDb', () => {
  it('creates all seven tables on an in-memory database', () => {
    const db = createDb(':memory:');
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .all()
      .map((row: any) => row.name);
    expect(tables).toEqual([
      'board_share_tokens',
      'boards',
      'connectors',
      'users',
      'workspace_invitations',
      'workspace_users',
      'workspaces',
    ]);
  });

  it('enforces unique (workspace_id, user_id) on workspace_users', () => {
    const db = createDb(':memory:');
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, created_at) VALUES ('u1','a@x.com','h','A',datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO workspaces (id, name, created_at) VALUES ('w1','W',datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ('wu1','w1','u1','owner',datetime('now'))`
    ).run();
    expect(() =>
      db
        .prepare(
          `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ('wu2','w1','u1','member',datetime('now'))`
        )
        .run()
    ).toThrow();
  });
});
