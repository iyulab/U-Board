import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { TestProject } from 'vitest/node';
import { openPglite } from '../db.js';

declare module 'vitest' {
  export interface ProvidedContext {
    /** A file holding the data directory of a PGlite engine with the full schema (`createIsolatedTestDb`). */
    pgliteTemplate: string;
  }
}

/** Vitest global setup. Most of a PGlite engine's start-up is `initdb` creating its data directory
 *  (about a second, several while every test file starts one at once); applying the schema takes
 *  tens of milliseconds. So the run initializes one engine here, applies the schema, and saves its
 *  data directory — each test file's engine then starts from that copy instead of running `initdb`. */
export default async function setup(project: TestProject): Promise<() => void> {
  const engine = new PGlite();
  const db = await openPglite(engine);
  const dataDir = await engine.dumpDataDir('none');
  await db.close();

  const dir = mkdtempSync(join(tmpdir(), 'u-board-test-db-'));
  const file = join(dir, 'template.tar');
  writeFileSync(file, Buffer.from(await dataDir.arrayBuffer()));
  project.provide('pgliteTemplate', file);
  return () => rmSync(dir, { recursive: true, force: true });
}
