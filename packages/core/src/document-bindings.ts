import { placedIn } from './view-document.js';
import type { Binding, ViewDocument } from './view-document.js';
import { instanceParts } from './components.js';

/**
 * Every binding a document declares, wherever it sits — each placed widget's, and on a canvas board each connector's
 * and each component instance's — with the JSON Pointer of what it fills. The one walk for whatever needs to know what
 * a board reads: which data sources it uses and how they ask to be credited, which reads a share link may make.
 *
 * An instance's bindings are yielded as it reads them, its parameters filled in, with the pointer of the binding in the
 * component and the instance's id: a share link reads what the definition's instances name, nothing a viewer chooses.
 */
export function* bindingsIn(doc: ViewDocument): Generator<{ binding: Binding; at: string; instance?: string }> {
  const placed = placedIn(doc);
  const kind = doc.kind === 'canvas' ? 'nodes' : 'items';
  for (let i = 0; i < placed.length; i++) {
    for (const [path, binding] of Object.entries(placed[i].widget?.bindings ?? {})) yield { binding, at: `/${kind}/${i}/widget/bindings/${path}` };
  }
  if (doc.kind !== 'canvas') return;
  for (let i = 0; i < doc.connectors.length; i++) {
    for (const [path, binding] of Object.entries(doc.connectors[i].bindings ?? {})) yield { binding, at: `/connectors/${i}/bindings/${path}` };
  }
  for (const instance of doc.instances ?? []) {
    const definition = doc.components?.[instance.component];
    if (!definition) continue;
    const parts = instanceParts(definition, instance);
    const at = `/components/${pointerSegment(instance.component)}`;
    for (let i = 0; i < parts.nodes.length; i++) {
      for (const [path, binding] of Object.entries(parts.nodes[i].widget?.bindings ?? {})) yield { binding, at: `${at}/nodes/${i}/widget/bindings/${path}`, instance: instance.id };
    }
    for (let i = 0; i < parts.connectors.length; i++) {
      for (const [path, binding] of Object.entries(parts.connectors[i].bindings ?? {})) yield { binding, at: `${at}/connectors/${i}/bindings/${path}`, instance: instance.id };
    }
  }
}

function pointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}
