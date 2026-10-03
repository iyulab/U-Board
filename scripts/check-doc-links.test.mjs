import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingAnchors, relativeLinks, brokenLinks } from './check-doc-links.mjs';

const repo = {
  'README.md': '# U-Board\n\n## Domain layer\n\nSee [api](docs/api-reference.md#types).\n',
  'docs/api-reference.md': '# API Reference\n\n## Types\n\n### `Adapter`\n\n### `Node`, `Connector`\n',
  'docs/concepts.md': '# Concepts\n',
};
const readText = path => repo[path];
const isDirectory = path => path === 'docs' || path === 'packages/core';
const problems = (path, text) => brokenLinks(path, text, readText, isDirectory).map(b => `${b.line}:${b.target}:${b.problem}`);

test('heading anchors follow GitHub slugs', () => {
  assert.deepEqual([...headingAnchors(repo['docs/api-reference.md'])], ['api-reference', 'types', 'adapter', 'node-connector']);
  assert.deepEqual([...headingAnchors('## Setup\n## Setup\n## Reading and checking documents\n')], ['setup', 'setup-1', 'reading-and-checking-documents']);
  assert.deepEqual([...headingAnchors('```md\n# not a heading\n```\n# Real\n')], ['real']);
});

test('finds relative links only, outside code', () => {
  const text = 'a [x](docs/a.md) b [y](https://example.com) [z](#here)\n`[no](code.md)`\n```\n[no](fenced.md)\n```\n';
  assert.deepEqual(relativeLinks(text), [{ line: 1, target: 'docs/a.md' }, { line: 1, target: '#here' }]);
});

test('accepts links to existing files, headings and directories', () => {
  assert.deepEqual(problems('README.md', repo['README.md']), []);
  assert.deepEqual(problems('docs/api-reference.md', '[c](concepts.md) [r](../README.md#domain-layer) [p](../packages/core) [s](#types)\n## Types\n'), []);
});

test('reports a missing file, a missing heading and a link that leaves the repository', () => {
  assert.deepEqual(problems('docs/api-reference.md', '[w](../src/examples/walkthrough.ts)\n[b](concepts.md#binding)\n[o](../../elsewhere.md)\n'), [
    '1:../src/examples/walkthrough.ts:no such file',
    '2:concepts.md#binding:no such heading',
    '3:../../elsewhere.md:points outside the repository',
  ]);
});
