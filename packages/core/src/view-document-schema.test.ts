import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GRID_COLUMNS, GRID_COLUMNS_MEDIUM } from './view-document';

// The published JSON Schema says the same rules as `validateViewDocument` for readers that only have the schema — an AI
// writing a board, another language's validator. These checks hold the two to the same constants and the same openness.
// TODO(schema conformance): judge one set of documents with both and require the same verdict — needs a JSON Schema
// evaluator, a new development dependency.
const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'schema/view-document.schema.json'), 'utf8'));

function* walk(value: unknown, at = ''): Generator<[string, Record<string, unknown>]> {
  if (typeof value !== 'object' || value === null) return;
  if (!Array.isArray(value)) yield [at, value as Record<string, unknown>];
  for (const [key, child] of Object.entries(value)) yield* walk(child, `${at}/${key}`);
}

describe('view-document.schema.json', () => {
  it('is a 2020-12 schema of the two kinds', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    const kinds = schema.oneOf.map((ref: { $ref: string }) => schema.$defs[ref.$ref.replace('#/$defs/', '')].properties.kind.const);
    expect(kinds).toEqual(['canvas', 'grid']);
  });

  it('bounds a grid the way the validator does', () => {
    const { gridView, gridItem } = schema.$defs;
    expect(gridView.properties.columns.const).toBe(GRID_COLUMNS);
    expect(gridItem.properties.span).toMatchObject({ type: 'integer', minimum: 1, maximum: GRID_COLUMNS });
    expect(gridItem.properties.spanMedium).toMatchObject({ type: 'integer', minimum: 1, maximum: GRID_COLUMNS_MEDIUM });
    expect(schema.$defs.appearance.enum).toEqual(['light', 'dark']);
  });

  it('allows fields it does not name anywhere, as the validator ignores them', () => {
    const closed = [...walk(schema)].filter(([, node]) => node.additionalProperties === false || node.unevaluatedProperties === false);
    expect(closed.map(([at]) => at)).toEqual([]);
  });

  it('refers only to definitions it has', () => {
    const refs = [...walk(schema)].flatMap(([, node]) => (typeof node.$ref === 'string' ? [node.$ref] : []));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(schema.$defs[ref.replace('#/$defs/', '')], ref).toBeDefined();
  });
});
