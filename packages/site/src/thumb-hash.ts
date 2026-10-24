import { createHash } from 'node:crypto';
import type { SamplePack } from '@iyulab/u-board-samples';

/** What a board's thumbnail was taken from — its definition and its data. A board whose hash no longer matches the one
 *  recorded beside its thumbnail has changed since the picture was taken (`npm run thumbnails` takes it again). */
export function packHash(pack: SamplePack): string {
  return createHash('sha256').update(JSON.stringify([pack.board, pack.snapshot])).digest('hex').slice(0, 16);
}
