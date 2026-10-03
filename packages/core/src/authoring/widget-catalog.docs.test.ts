/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPrimaryDataField } from '@iyulab/u-widgets';
import { WIDGET_TYPES } from './widget-catalog';

// The package README's "Widgets" table describes this catalog to consumers. Keep the two from
// drifting: every type offered here has a row, and each row's headline field is what u-widgets
// actually reports (the field the renderer frames on).
describe('package README widget table', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf-8');
  const section = readme.match(/## Widgets\n([\s\S]*?)\n## /)?.[1] ?? '';

  it.each(WIDGET_TYPES)('lists %s with its headline field', type => {
    const row = section.split('\n').find(line => line.startsWith(`| \`${type}\` |`));
    expect(row, `no README row for ${type}`).toBeDefined();
    const field = getPrimaryDataField(type);
    expect(row!.trim().endsWith(field === undefined ? '| none |' : `| \`data.${field}\` |`)).toBe(true);
  });
});
