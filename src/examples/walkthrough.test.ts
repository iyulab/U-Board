import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolved } from './walkthrough.js';

// Guards docs/api-reference.md's "Walkthrough" section against two independent kinds of drift:
// the values it claims resolveDocument returns (this file re-runs the same example and asserts
// on them), and the code itself silently diverging from what's actually printed in the doc
// (the byte-identity check below). Neither is caught by `tsc`/`npm test` on the markdown file
// alone — a fenced code block isn't compiled or executed on its own.
describe('docs/api-reference.md walkthrough example', () => {
  it('produces exactly the values the doc says it does', () => {
    expect(resolved.nodes[0].widget.props).toEqual({ data: { label: 'Pump A', value: 'running' } });
    expect(resolved.nodes[0].widget.quality).toEqual({ 'data.value': 'live' });
  });

  it('is embedded in the doc byte-for-byte (catches copy-paste drift the type check cannot)', () => {
    // vitest runs from the package root, so resolve relative to process.cwd() rather than
    // import.meta.url — under this project's jsdom test environment, import.meta.url isn't a
    // usable file: URL.
    const sourcePath = resolve(process.cwd(), 'src/examples/walkthrough.ts');
    const docPath = resolve(process.cwd(), 'docs/api-reference.md');
    const source = readFileSync(sourcePath, 'utf-8');
    const docText = readFileSync(docPath, 'utf-8');

    const match = docText.match(/## Walkthrough\n[\s\S]*?```ts\n([\s\S]*?)```/);
    expect(match, 'expected a ```ts fenced code block under "## Walkthrough" in docs/api-reference.md').not.toBeNull();
    expect(match![1]).toBe(source);
  });
});
