import { isHttpRef, readHttpRef, type Adapter, type Attribution, type ResolvedBinding } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from './sample-pack.js';

/**
 * Answers a sample's bindings from what its source said when the sample was recorded — for a page with no
 * server to read the live source through. A binding's `ref` is the HTTP connector's (`HttpRef`), read the way
 * the server reads it, so the same document reads the live source once an installation creates the
 * connector. Each value is `live` with the time the source says it observed it, or else the time it was
 * recorded: it is what the source reported then, and the page shows that time.
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
    if (!isHttpRef(ref) || !Object.hasOwn(this.responses, ref.path)) return { value: undefined, quality: 'disconnected', reason: 'address' };
    const reading = readHttpRef(this.responses[ref.path], ref, Date.parse(this.capturedAt));
    return reading.ok
      ? { value: reading.value, quality: 'live', observedAt: new Date(reading.observedAt).toISOString() }
      : { value: undefined, quality: 'disconnected', reason: reading.reason };
  }
}

/** The adapters that replay `pack`'s snapshot, one per connector. */
export function snapshotAdapters(pack: SamplePack): SnapshotAdapter[] {
  return pack.connectors.map(c => new SnapshotAdapter(c, pack.snapshot.responses[c.key] ?? {}, pack.snapshot.capturedAt));
}
