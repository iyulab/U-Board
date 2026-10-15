import { placedIn } from './view-document.js';
import type { Binding, ViewDocument } from './view-document.js';

/**
 * Every binding a document declares, wherever it sits — each placed widget's, and on a canvas board each connector's
 * — with the JSON Pointer of what it fills. The one walk for whatever needs to know what a board reads: which data
 * sources it uses and how they ask to be credited, which reads a share link may make.
 */
export function* bindingsIn(doc: ViewDocument): Generator<{ binding: Binding; at: string }> {
  const placed = placedIn(doc);
  const kind = doc.kind === 'canvas' ? 'nodes' : 'items';
  for (let i = 0; i < placed.length; i++) {
    for (const [path, binding] of Object.entries(placed[i].widget?.bindings ?? {})) yield { binding, at: `/${kind}/${i}/widget/bindings/${path}` };
  }
  if (doc.kind !== 'canvas') return;
  for (let i = 0; i < doc.connectors.length; i++) {
    for (const [path, binding] of Object.entries(doc.connectors[i].bindings ?? {})) yield { binding, at: `/connectors/${i}/bindings/${path}` };
  }
}
