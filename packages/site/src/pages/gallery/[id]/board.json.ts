import type { APIRoute, GetStaticPaths } from 'astro';
import { SAMPLE_PACKS, type SamplePack } from '@iyulab/u-board-samples';

// A board's definition as a file — the board whole, drawing included: what the gallery page shows and what
// the playground and an installed U-Board's import read.
export const getStaticPaths: GetStaticPaths = () => SAMPLE_PACKS.map(pack => ({ params: { id: pack.id }, props: { pack } }));

export const GET: APIRoute = ({ props }) =>
  new Response(`${JSON.stringify((props as { pack: SamplePack }).pack.board, null, 2)}\n`, { headers: { 'Content-Type': 'application/json' } });
