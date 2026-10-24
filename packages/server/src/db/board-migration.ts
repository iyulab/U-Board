import { randomUUID } from 'node:crypto';
import { fromV1, isBoardV2 } from '@iyulab/u-board/board-v2';
import type { ViewDocument } from '@iyulab/u-board/domain';
import type { DbClient } from '../db.js';
import { documentIssues } from '../board-document.js';

// Distinct from every other advisory lock key in this app (727100 signup, 727101 schema bootstrap): the keys share one
// keyspace per database. This one keeps two replicas starting at once from moving the same boards twice.
const BOARD_MIGRATION_LOCK_KEY = 727102;

/** A board left in the board language's first version, and why: what the second does not carry yet. */
export interface KeptBoard {
  boardId: string;
  workspaceId: string;
  name: string;
  unsupported: string[];
}

/** What moving the stored boards came to: how many moved, and those that stayed in the first version. */
export interface BoardMigrationReport {
  migrated: number;
  kept: KeptBoard[];
}

interface BoardRow {
  id: string;
  workspace_id: string;
  name: string;
  document: string;
  revision: number;
}

/**
 * Moves every board stored in the board language's first version to the second (`fromV1`) — once: a board moved is in
 * the second version and is not read again. A board the second version does not carry whole (`unsupported`, or a
 * conversion that does not pass the language's check) is left as it is and reported — and tried again at every start,
 * since a first-version board is no longer saved (its revision does not change) while the conversion grows. Each
 * outcome is recorded once in `board_migrations` (a board kept for the same reasons at the same revision is not
 * recorded again), a moved board's first-version document with it, so a move is put back from the record. A board saved while it is being moved keeps that save: the
 * move is written only over the revision it read, and counts as the board's next save.
 */
export async function migrateFirstVersionBoards(db: DbClient, now: () => string = () => new Date().toISOString()): Promise<BoardMigrationReport> {
  return db.withTransaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock($1)', [BOARD_MIGRATION_LOCK_KEY]);
    // Only the boards still to look at leave the database — a second-version board's document (a background image may be
    // megabytes) stays where it is.
    const { rows } = await tx.query<BoardRow>(
      `SELECT b.id, b.workspace_id, b.name, b.document, b.revision FROM boards b
       WHERE (b.document::jsonb ->> 'version') IS DISTINCT FROM '2'`
    );
    const report: BoardMigrationReport = { migrated: 0, kept: [] };
    for (const row of rows) {
      const document: unknown = JSON.parse(row.document);
      if (isBoardV2(document)) continue;
      const revision = Number(row.revision);
      const conversion = fromV1(document as ViewDocument);
      const unsupported = conversion.unsupported.length > 0 ? conversion.unsupported : documentIssues(conversion.board).map(issue => `${issue.path}: ${issue.message}`);
      if (unsupported.length > 0) {
        const known = await tx.query(`SELECT 1 FROM board_migrations WHERE board_id = $1 AND revision = $2 AND outcome = 'kept' AND notes = $3`, [
          row.id,
          revision,
          JSON.stringify(unsupported),
        ]);
        if (known.rows.length === 0) await record(tx, row.id, revision, 'kept', null, unsupported, now());
        report.kept.push({ boardId: row.id, workspaceId: row.workspace_id, name: row.name, unsupported });
        continue;
      }
      const moved = await tx.query(`UPDATE boards SET document = $1, revision = revision + 1 WHERE id = $2 AND revision = $3`, [
        JSON.stringify(conversion.board),
        row.id,
        revision,
      ]);
      if ((moved.rowCount ?? 0) === 0) continue; // saved meanwhile: moved on a later start
      await record(tx, row.id, revision, 'migrated', row.document, conversion.notes, now());
      report.migrated++;
    }
    return report;
  });
}

async function record(tx: DbClient, boardId: string, revision: number, outcome: 'migrated' | 'kept', before: string | null, notes: string[], at: string) {
  await tx.query(
    `INSERT INTO board_migrations (id, board_id, revision, outcome, before_document, notes, migrated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [randomUUID(), boardId, revision, outcome, before, JSON.stringify(notes), at]
  );
}
