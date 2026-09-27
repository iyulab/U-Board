import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanText, isScannedPath } from './check-public-text.mjs';

const rules = (path, text) => scanText(path, text).map(v => v.rule);

test('allows reserved example hosts, localhost, and the known public hosts', () => {
  const text = [
    'fetch("https://plant.example.com/api/v2")',
    'const origin = "http://localhost:4000";',
    'http://127.0.0.1:5183/',
    '<svg xmlns="http://www.w3.org/2000/svg">',
    'See https://www.gnu.org/licenses/ and https://www.npmjs.com/package/@iyulab/u-board',
    'owner@x.com / member@test.com',
  ].join('\n');
  assert.deepEqual(scanText('src/a.ts', text), []);
});

test('flags any other host, with or without a scheme', () => {
  assert.deepEqual(rules('src/a.ts', 'const api = "https://api.internal-corp.kr/v1";'), ['host']);
  assert.deepEqual(rules('docs/x.md', 'Deployed at board.somewhere.io behind the proxy.'), ['host']);
});

test('limits GitHub links to the allowed public repositories', () => {
  assert.deepEqual(rules('README.md', 'https://github.com/iyulab/U-Board/issues'), []);
  assert.deepEqual(rules('README.md', 'https://github.com/iyulab/u-widgets'), []);
  assert.deepEqual(rules('README.md', 'https://github.com/iyulab/some-private-app'), ['github-repo']);
});

test('flags internal tracking ids', () => {
  assert.deepEqual(rules('src/a.ts', '// fixes HD-42'), ['tracking-id']);
  assert.deepEqual(rules('src/a.ts', '// from BD-20260827-03'), ['tracking-id']);
  assert.deepEqual(rules('src/a.ts', '// measured in cycle-41'), ['tracking-id']);
  assert.deepEqual(rules('src/a.ts', '// see docket #79'), ['tracking-id']);
  assert.deepEqual(rules('src/a.ts', '// a life-cycle-aware hook, see #79 upstream'), []);
});

test('flags internal document and local machine paths', () => {
  assert.deepEqual(rules('src/a.ts', '// per ~/.claude/CLAUDE.md §2'), ['internal-path']);
  assert.deepEqual(rules('src/a.ts', '// notes in claudedocs/plans/x.md'), ['internal-path']);
  assert.deepEqual(rules('src/a.ts', String.raw`// copied from C:\projects\app\file.ts`), ['local-path']);
  assert.deepEqual(rules('src/a.ts', '// see /Users/someone/work/file.ts'), ['local-path']);
});

test('lets ignore files name the directories they exclude', () => {
  assert.deepEqual(scanText('.gitignore', 'claudedocs/\n'), []);
  assert.deepEqual(scanText('.dockerignore', 'claudedocs\n'), []);
});

test('reports the line number and the matched text', () => {
  assert.deepEqual(scanText('src/a.ts', 'ok\n// HD-7 here'), [
    { path: 'src/a.ts', line: 2, rule: 'tracking-id', match: 'HD-7' },
  ]);
});

test('skips generated and binary files', () => {
  assert.equal(isScannedPath('package-lock.json'), false);
  assert.equal(isScannedPath('packages/core/public/bg.png'), false);
  assert.equal(isScannedPath('packages/core/src/App.tsx'), true);
});

test('reads the repository from a GitHub link that carries a fragment or query', () => {
  assert.deepEqual(rules('package.json', '"homepage": "https://github.com/iyulab/U-Board#readme"'), []);
  assert.deepEqual(rules('README.md', 'https://github.com/iyulab/U-Board?tab=readme'), []);
});
