// Writes check-vectors.json: the boards the check is tried on and, for each, the paths `checkBoard` tells it off at — taken from the
// check as it is built (`npm run build:lib` first). The vectors are smoke tests for a host's JavaScript engine (docs/embedding.md); the
// package's own tests hold the file to what the check says, so a change to a check that moves a path is met there, and is mended here:
//
//   npm run gen:check-vectors

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBoard } from '../dist/lib/check-entry.js';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const good = { data: { d: { from: 'x', path: '/x', fields: { v: { at: '/v' } } } }, parts: { a: { as: 'status-card', of: 'd', show: 'v' } }, layout: { kind: 'grid', items: ['a'] } };
const one = (name, about, board) => ({ name, about, board, paths: [...new Set(checkBoard(board).issues.map(i => i.path))].sort() });
const vectors = [
  one('valid-grid', 'A part that reads a read and is placed: nothing to say.', good),
  one('unknown-data', 'A part reads data the board does not define.', { ...good, parts: { a: { as: 'status-card', of: 'nope', show: 'v' } } }),
  one('unknown-part-kind', 'A part of a kind the board language does not have.', { ...good, parts: { a: { as: 'nope', of: 'd' } } }),
  one('part-not-placed', 'A part the layout never places.', { ...good, layout: { kind: 'grid', items: [] } }),
  one('unknown-tone', 'A status in a tone that is none.', { ...good, statuses: { s: { tone: 'purple' } } }),
  one('unknown-emphasis', 'A status with an emphasis that is none.', { ...good, statuses: { s: { tone: 'ok', emphasis: 'shake' } } }),
  one('unknown-layout-kind', 'A layout of a kind that does not exist.', { ...good, layout: { kind: 'wall', items: ['a'] } }),
  one('link-to-unknown-part', 'A link that ends at a part the board does not have.', { ...good, layout: { kind: 'canvas', size: [200, 100], place: { a: [0, 0, 50, 50] }, links: { l: { from: 'a', to: 'ghost' } } } }),
  one('unknown-key', 'A key the board language does not have, at the top.', { ...good, wat: 1 }),
  one('unknown-frame', 'A skin frame that is none of the frames.', { ...good, board: { skin: { frame: 'wood' } } }),
  one('element-loads-unlisted-address', 'An element that loads an address it was not given.', { ...good, elements: { e: { template: '<img src="https://evil.example/x.png">' } }, parts: { a: { as: 'element', element: 'e' } } }),
  one('script-lists-origins', 'A script element that lists the origins it loads from, each as an origin: nothing to say.', { ...good, elements: { e: { script: 'ub.onProps(() => {})', resources: ['https://cdn.example', 'https://cdn.example:8443'] } }, parts: { a: { as: 'element', element: 'e' } } }),
  one('script-origin-with-a-path', 'A script element that lists an address, not an origin.', { ...good, elements: { e: { script: 'ub.onProps(() => {})', resources: ['https://cdn.example/lib.js'] } }, parts: { a: { as: 'element', element: 'e' } } }),
  one('trigger-opens-plain-http', 'A trigger that opens an address that is not https.', { ...good, triggers: [{ on: { event: 'click', part: 'a' }, do: [{ action: 'open-link', url: 'http://plain.example' }] }] }),
];
writeFileSync(resolve(packageDir, 'check-vectors.json'), JSON.stringify({
  about: 'Smoke vectors for the board check. Each is a board and the paths of the problems `checkBoard` reports for it — the set of paths, in any order; the wording of a message is not part of the vector. A host that runs the check bundle (`check.bundle.js`, global `UBoardCheck`) on its own JavaScript engine reads each `board`, passes it to `UBoardCheck.checkBoard`, and compares the paths of `issues` with `paths`.',
  vectors,
}, null, 2) + '\n');
console.log(vectors.map(v => `${v.name}: ${JSON.stringify(v.paths)}`).join('\n'));
