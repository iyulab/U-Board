import type { Adapter, Board, ResolvedBinding } from '@iyulab/u-board/domain';
import { pictureOf, readerOf } from '@iyulab/u-board/domain';
import { resolveDocument } from '@iyulab/u-board/picture';

// 1. An Adapter resolves this system's own reference shape to a value + connection quality.
//    Nothing about `ref`'s shape is fixed by the core — each adapter defines and interprets it.
export class ExampleAdapter implements Adapter {
  readonly id = 'demo'; // matches the `from` a data read names to select this Adapter

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    if (key === 'pump-a.state') {
      return { value: 'running', quality: 'live' };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}

// 2. A board: one data read through that adapter, one part that shows it, and where the part is.
export const board: Board = {
  data: { pumpA: { from: 'demo', ref: 'pump-a.state' } },
  parts: { 'pump-a': { as: 'stat', of: 'pumpA', title: 'Pump A' } },
  layout: { kind: 'canvas', size: [400, 200], place: { 'pump-a': [0, 0, 160, 80] } },
};

// 3. pictureOf draws the board as the renderer reads it — every part a widget bound to its read —
//    and resolveDocument runs those bindings against the given adapters: every widget's bound props
//    carry resolved values, and a `quality` map records how current each bound prop is.
const picture = await pictureOf(board, readerOf([new ExampleAdapter()]));
export const resolved = await resolveDocument(picture, [new ExampleAdapter()]);

const [pumpA] = resolved.kind === 'canvas' ? resolved.nodes : [];
console.log(pumpA?.widget.quality); // { 'data.value': 'live' }
