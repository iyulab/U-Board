import type { Adapter, Attribution, ResolvedBinding } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from './sample-pack.js';

/** The value at an RFC 6901 JSON Pointer (`/a/0/b`), or `found: false`. */
export function valueAtPointer(body: unknown, pointer: string): { found: true; value: unknown } | { found: false } {
  if (pointer === '') return { found: true, value: body };
  if (!pointer.startsWith('/')) return { found: false };
  let current: unknown = body;
  for (const raw of pointer.slice(1).split('/')) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) return { found: false };
    current = (current as Record<string, unknown>)[key];
  }
  return { found: true, value: current };
}

/** The HTTP connector's reference: the request, optionally the list item it reads (by its fields), and a
 *  JSON Pointer into that item or the whole answer. */
export interface HttpRef {
  path: string;
  valuePath?: string;
  item?: { list: string; where: Record<string, string | number | boolean> };
}

/** The element of the list at `item.list` whose fields all read as `item.where` says — as the server's HTTP
 *  connector finds it. */
export function findItem(body: unknown, item: NonNullable<HttpRef['item']>): { found: true; value: unknown; index: number } | { found: false } {
  const list = valueAtPointer(body, item.list);
  if (!list.found || !Array.isArray(list.value)) return { found: false };
  const index = list.value.findIndex(
    element =>
      element !== null &&
      typeof element === 'object' &&
      Object.entries(item.where).every(([field, expected]) => {
        const actual = (element as Record<string, unknown>)[field];
        return actual !== undefined && actual !== null && String(actual) === String(expected);
      })
  );
  return index < 0 ? { found: false } : { found: true, value: list.value[index], index };
}

/**
 * Answers a sample's bindings from what its source said when the sample was recorded — for a page with no
 * server to read the live source through. A binding's `ref` is the HTTP connector's (`{ path, valuePath }`),
 * so the same document reads the live source once an installation creates the connector. Each value is
 * `live` with the time it was recorded: it is what the source reported then, and the page shows that time.
 */
export class SnapshotAdapter implements Adapter {
  readonly id: string;
  readonly attribution: Attribution;

  constructor(
    connector: SampleConnector,
    private readonly responses: Record<string, unknown>,
    private readonly capturedAt: string
  ) {
    this.id = connector.key;
    this.attribution = connector.attribution;
  }

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const { path, valuePath, item } = (ref ?? {}) as Partial<HttpRef>;
    if (typeof path !== 'string' || !Object.hasOwn(this.responses, path)) return { value: undefined, quality: 'disconnected', reason: 'address' };
    let body = this.responses[path];
    if (item) {
      const found = findItem(body, item);
      if (!found.found) return { value: undefined, quality: 'disconnected', reason: 'address' };
      body = found.value;
    }
    const read = valueAtPointer(body, typeof valuePath === 'string' ? valuePath : '');
    return read.found
      ? { value: read.value, quality: 'live', observedAt: this.capturedAt }
      : { value: undefined, quality: 'disconnected', reason: 'address' };
  }
}

/** The adapters that replay `pack`'s snapshot, one per connector. */
export function snapshotAdapters(pack: SamplePack): SnapshotAdapter[] {
  return pack.connectors.map(c => new SnapshotAdapter(c, pack.snapshot.responses[c.key] ?? {}, pack.snapshot.capturedAt));
}
