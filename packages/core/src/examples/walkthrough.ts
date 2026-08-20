import type { Adapter, ResolvedBinding, ViewDocument } from '@iyulab/u-board';
import { resolveDocument } from '@iyulab/u-board';

// 1. An Adapter resolves this system's own reference shape to a value + connection quality.
//    Nothing about `ref`'s shape is fixed by the core — each adapter defines and interprets it.
export class DemoAdapter implements Adapter {
  readonly id = 'demo'; // matches the `adapter` field a Binding uses to select this Adapter

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    if (key === 'pump-a.state') {
      return { value: 'running', quality: 'live' };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}

// 2. A ViewDocument node whose widget has one bound prop (`data.value`) and one static prop
//    (`data.label`). `bindings` keys are dotted paths into `props` — resolution overwrites
//    that path's value, everything else in `props` passes through untouched.
export const doc: ViewDocument = {
  kind: 'canvas',
  background: {},
  nodes: [
    {
      id: 'pump-a',
      x: 0,
      y: 0,
      anchored: false,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump A' } },
        bindings: { 'data.value': { adapter: 'demo', ref: 'pump-a.state' } },
      },
    },
  ],
  connectors: [],
};

// 3. resolveDocument runs every node's bindings against the given adapters and returns a
//    ResolvedViewDocument — the same document shape, but every node's `widget` is now a
//    ResolvedWidget: its bound props carry resolved values, and a `quality` map records how
//    current each bound prop is.
export const resolved = await resolveDocument(doc, [new DemoAdapter()]);

resolved.nodes[0].widget.props; //   { data: { label: 'Pump A', value: 'running' } }
resolved.nodes[0].widget.quality; // { 'data.value': 'live' }
