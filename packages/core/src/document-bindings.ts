import { isCanvasItem, placedAt } from './view-document.js';
import type { Binding, ViewDocument } from './view-document.js';
import { instanceParts } from './components.js';

/**
 * Every binding a document declares, wherever it sits — each placed widget's, each connector's (of a canvas board or of
 * a grid's canvas cell), and on a canvas board each component instance's — with the JSON Pointer of what it fills. The one walk for whatever needs to know what
 * a board reads: which data sources it uses and how they ask to be credited, which reads a share link may make.
 *
 * An instance's bindings are yielded as it reads them, its parameters filled in, with the pointer of the binding in the
 * component and the instance's id: a share link reads what the definition's instances name, nothing a viewer chooses.
 */
export function* bindingsIn(doc: ViewDocument): Generator<{ binding: Binding; at: string; instance?: string }> {
  for (const { placed, at } of placedAt(doc)) {
    for (const [path, binding] of Object.entries(placed.widget?.bindings ?? {})) yield { binding, at: `${at}/widget/bindings/${path}` };
  }
  if (doc.kind !== 'canvas') {
    for (let i = 0; i < doc.items.length; i++) {
      const item = doc.items[i];
      if (!isCanvasItem(item)) continue;
      for (let j = 0; j < item.canvas.connectors.length; j++) {
        for (const [path, binding] of Object.entries(item.canvas.connectors[j].bindings ?? {})) yield { binding, at: `/items/${i}/canvas/connectors/${j}/bindings/${path}` };
      }
    }
    return;
  }
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
