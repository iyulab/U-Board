export type { Localized, SampleConnector, SamplePack, SampleSnapshot } from './sample-pack.js';
export { SnapshotAdapter, snapshotAdapters, valueAtPointer } from './snapshot-adapter.js';
export { gwanghwamun } from './packs/gwanghwamun.js';
export { seoulAir } from './packs/seoul-air.js';

import { gwanghwamun } from './packs/gwanghwamun.js';
import { seoulAir } from './packs/seoul-air.js';
import type { SamplePack } from './sample-pack.js';

/** Every sample, in the gallery's order. */
export const SAMPLE_PACKS: readonly SamplePack[] = [gwanghwamun, seoulAir];
