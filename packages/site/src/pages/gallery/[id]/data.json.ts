import type { APIRoute, GetStaticPaths } from 'astro';
import { SAMPLE_PACKS, type SamplePack } from '@iyulab/u-board-samples';
import { dataOf } from '../../../gallery';

// A board's data as a file — the sources it reads and what they answered when it was recorded.
export const getStaticPaths: GetStaticPaths = () => SAMPLE_PACKS.map(pack => ({ params: { id: pack.id }, props: { pack } }));

export const GET: APIRoute = ({ props }) =>
  new Response(`${JSON.stringify(dataOf((props as { pack: SamplePack }).pack), null, 2)}\n`, { headers: { 'Content-Type': 'application/json' } });
