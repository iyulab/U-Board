// Records what each sample's sources answer now, keeping only the fields its bindings read, into
// src/snapshots/<sample>.ts — what a page with no server replays (SnapshotAdapter). Run it when a sample
// changes what it binds to, or to refresh the recording: `npm run capture --workspace=packages/samples`, or with
// sample ids after `--` to record only those.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dataReadOf } from '@iyulab/u-board/domain';
import { findHttpRefItem, requestPath, sourceErrorIn, type HttpRef } from '@iyulab/u-board/picture';
import { SAMPLE_PACKS } from '../src/index.js';
import { keepPointers } from '../src/prune.js';
import { isInstallable, isLiveConnector, type LiveSampleConnector, type SamplePack } from '../src/sample-pack.js';

/** The key `connector` is asked with: the one its source publishes to try with, or — for a source that asks each
 *  user to register — the recorder's own, from the environment. Never written into the recording. */
function keyOf(connector: LiveSampleConnector): string | undefined {
  return connector.ownKey ? process.env[connector.ownKey.env] : connector.authValue;
}

function requestUrl(connector: LiveSampleConnector, path: string, key: string): URL {
  const base = connector.authType === 'path' ? connector.baseUrl.replace('{key}', encodeURIComponent(key)) : connector.baseUrl;
  const url = new URL(base.replace(/\/+$/, '') + path);
  if (connector.authType === 'query' && connector.authParamName) url.searchParams.set(connector.authParamName, key);
  return url;
}

/** The references each request of `pack` is read with, per connector key: each of its board's data read whole — a
 *  list kept whole, whichever of its items the board shows. */
function requests(pack: SamplePack): Map<string, Map<string, HttpRef[]>> {
  const byConnector = new Map<string, Map<string, HttpRef[]>>();
  for (const name of Object.keys(pack.board.data ?? {})) {
    const { adapter, ref: read } = dataReadOf(pack.board, name);
    const ref = read as HttpRef;
    const paths = byConnector.get(adapter) ?? new Map<string, HttpRef[]>();
    byConnector.set(adapter, paths);
    paths.set(ref.path, [...(paths.get(ref.path) ?? []), ref]);
  }
  return byConnector;
}

/** The pointers into `body` that `ref` reads — the value and the time the source observed it, and for a list
 *  item, the item's place in this answer with the fields it is matched by, so the recording still finds it. */
function pointersOf(body: unknown, ref: HttpRef): string[] {
  // Every item a list keeps is read whole, and which ones match can change between reads: keep the list.
  if (ref.items) return [ref.items.list];
  const inScope = [ref.valuePath ?? '', ...(ref.observedAtPath !== undefined ? [ref.observedAtPath] : [])];
  if (!ref.item) return inScope;
  const found = findHttpRefItem(body, ref.item);
  if (!found.found) throw new Error(`no item of ${ref.item.list} where ${JSON.stringify(ref.item.where)} in the answer to ${ref.path}`);
  const at = `${ref.item.list}/${found.index}`;
  return [...inScope.map(pointer => `${at}${pointer}`), ...Object.keys(ref.item.where).map(field => `${at}/${field.replace(/~/g, '~0').replace(/\//g, '~1')}`)];
}

// Example data is written by hand in its snapshot; there is no source to record it from.
const only = new Set(process.argv.slice(2));
const unknown = [...only].filter(id => !SAMPLE_PACKS.some(pack => pack.id === id));
if (unknown.length > 0) throw new Error(`no sample ${unknown.join(', ')}`);

for (const pack of SAMPLE_PACKS.filter(pack => isInstallable(pack) && (only.size === 0 || only.has(pack.id)))) {
  const missing = pack.connectors.filter(c => isLiveConnector(c) && c.ownKey && !process.env[c.ownKey.env]) as LiveSampleConnector[];
  if (missing.length > 0) {
    console.log(`${pack.id}: skipped — set ${missing.map(c => `${c.ownKey!.env} (a key from ${c.ownKey!.signUpUrl})`).join(', ')} to record it`);
    continue;
  }
  const responses: Record<string, Record<string, unknown>> = {};
  for (const [key, paths] of requests(pack)) {
    const connector = pack.connectors.find(c => c.key === key) as LiveSampleConnector | undefined;
    if (!connector) throw new Error(`${pack.id}: a binding names "${key}", which is not one of its connectors`);
    responses[key] = {};
    for (const [path, refs] of paths) {
      // A failed request is reported by its path alone: the address carries the key.
      // A path with time places is sent with them filled in, and recorded under the path as written — the binding's.
      const res = await fetch(requestUrl(connector, requestPath(refs[0], Date.now()), keyOf(connector) ?? '')).catch((error: unknown) => {
        throw new Error(`${pack.id}: ${path} could not be read (${error instanceof Error ? error.name : 'error'})`);
      });
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) {
        throw new Error(`${pack.id}: ${path} answered ${res.status} ${res.headers.get('content-type')}`);
      }
      const body = await res.json();
      const said = connector.sourceError ? sourceErrorIn(body, connector.sourceError) : undefined;
      if (said !== undefined) throw new Error(`${pack.id}: ${path} — the source reported an error: ${said}`);
      responses[key][path] = keepPointers(body, refs.flatMap(ref => pointersOf(body, ref)));
    }
  }
  const file = fileURLToPath(new URL(`../src/snapshots/${pack.id}.ts`, import.meta.url));
  const recorded = JSON.stringify({ capturedAt: new Date().toISOString(), responses }, null, 2);
  writeFileSync(
    file,
    `// Recorded by scripts/capture-snapshots.ts — do not edit by hand.\nimport type { SampleSnapshot } from '../sample-pack.js';\n\nexport const snapshot: SampleSnapshot = ${recorded};\n`
  );
  console.log(`${pack.id}: recorded ${Object.values(responses).reduce((n, r) => n + Object.keys(r).length, 0)} answer(s) → ${file}`);
}
