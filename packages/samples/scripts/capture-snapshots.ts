// Records what each sample's sources answer now, keeping only the fields its bindings read, into
// src/snapshots/<sample>.ts — what a page with no server replays (SnapshotAdapter). Run it when a sample
// changes what it binds to, or to refresh the recording: `npm run capture --workspace=packages/samples`.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SAMPLE_PACKS } from '../src/index.js';
import { keepPointers } from '../src/prune.js';
import type { SampleConnector, SamplePack } from '../src/sample-pack.js';

function requestUrl(connector: SampleConnector, path: string): URL {
  const base = connector.authType === 'path' ? connector.baseUrl.replace('{key}', encodeURIComponent(connector.authValue ?? '')) : connector.baseUrl;
  const url = new URL(base.replace(/\/+$/, '') + path);
  if (connector.authType === 'query' && connector.authParamName) url.searchParams.set(connector.authParamName, connector.authValue ?? '');
  return url;
}

/** The value paths each request of `pack` is read at, per connector key. */
function requests(pack: SamplePack): Map<string, Map<string, Set<string>>> {
  const byConnector = new Map<string, Map<string, Set<string>>>();
  for (const node of pack.document.nodes) {
    for (const binding of Object.values(node.widget.bindings ?? {})) {
      const { path, valuePath } = binding.ref as { path: string; valuePath?: string };
      const paths = byConnector.get(binding.adapter) ?? new Map<string, Set<string>>();
      byConnector.set(binding.adapter, paths);
      const pointers = paths.get(path) ?? new Set<string>();
      paths.set(path, pointers);
      pointers.add(valuePath ?? '');
    }
  }
  return byConnector;
}

for (const pack of SAMPLE_PACKS) {
  const responses: Record<string, Record<string, unknown>> = {};
  for (const [key, paths] of requests(pack)) {
    const connector = pack.connectors.find(c => c.key === key);
    if (!connector) throw new Error(`${pack.id}: a binding names "${key}", which is not one of its connectors`);
    responses[key] = {};
    for (const [path, pointers] of paths) {
      const res = await fetch(requestUrl(connector, path));
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) {
        throw new Error(`${pack.id}: ${path} answered ${res.status} ${res.headers.get('content-type')}`);
      }
      responses[key][path] = keepPointers(await res.json(), [...pointers]);
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
