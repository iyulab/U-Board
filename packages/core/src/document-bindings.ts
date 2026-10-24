import { isCanvasItem, placedAt } from './view-document.js';
import type { Binding, ViewDocument } from './view-document.js';

/**
 * Every binding a document declares, wherever it sits — each placed widget's and each connector's (of a canvas board or
 * of a grid's canvas cell) — with the JSON Pointer of what it fills. The one walk for whatever needs to know what a
 * board reads: which data sources it uses and how they ask to be credited, which reads a share link may make.
 */
export function* bindingsIn(doc: ViewDocument): Generator<{ binding: Binding; at: string }> {
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
}
