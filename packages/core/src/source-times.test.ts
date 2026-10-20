import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSourceTime } from './http-ref.js';

// The table of date and time text another library reading the same sources keeps an identical copy of
// (`fixtures/source-times.json`), so the same text reads the same there and here.
const { cases } = JSON.parse(readFileSync(resolve(process.cwd(), '../../fixtures/source-times.json'), 'utf8')) as {
  cases: Array<{ text: string; utc: string | null }>;
};

describe('parseSourceTime against the shared table', () => {
  it.each(cases)('reads "$text"', ({ text, utc }) => {
    expect(parseSourceTime(text, 'UTC')).toBe(utc === null ? null : Date.parse(utc));
  });
});
