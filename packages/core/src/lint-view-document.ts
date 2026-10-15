import { placedIn } from './view-document.js';
import type { ViewDocument } from './view-document.js';
import { ELEMENT_SIZE_BUDGET, SCRIPT_ELEMENT_BUDGET, elementNameOf } from './elements/element-type.js';
import { lintGeometry } from './lint-geometry.js';

/** Advice on a valid view document: where (an RFC 6901 JSON Pointer) and what would make it better. */
export interface ViewDocumentAdvice {
  path: string;
  message: string;
}

/**
 * What a valid document (`validateViewDocument` found nothing) could do better — none of it stops the
 * document being saved or drawn. First, on a canvas board, where parts would be drawn over one another
 * (`lintGeometry`: overlapping nodes, a text under a node or crossed by a connector, texts running together);
 * then an element defined but placed nowhere, more `script` elements than a board draws lightly, an element
 * heavier than one should be. For whoever writes the document — an author, a tool, an AI — to act on.
 */
export function lintViewDocument(doc: ViewDocument): ViewDocumentAdvice[] {
  const advice: ViewDocumentAdvice[] = doc.kind === 'canvas' ? lintGeometry(doc) : [];
  const elements = doc.elements ?? {};
  const placed = new Map<string, number>();
  for (const { widget } of placedIn(doc)) {
    const name = elementNameOf(widget.type);
    if (name !== undefined) placed.set(name, (placed.get(name) ?? 0) + 1);
  }

  let scripts = 0;
  for (const [name, definition] of Object.entries(elements)) {
    const path = `/elements/${name}`;
    const count = placed.get(name) ?? 0;
    if (count === 0) advice.push({ path, message: 'no node or grid item places this element — remove it, or place it' });
    if (definition.render === 'script') scripts += count;
    const size = (definition.template?.length ?? 0) + (definition.script?.length ?? 0) + (definition.style?.length ?? 0);
    if (size > ELEMENT_SIZE_BUDGET) {
      advice.push({ path, message: `its markup, script and CSS come to ${size} characters — over ${ELEMENT_SIZE_BUDGET}, every viewer loads it; draw the repeated parts once (<symbol>/<use>, a section) or move a library to resources` });
    }
  }
  if (scripts > SCRIPT_ELEMENT_BUDGET) {
    advice.push({ path: '', message: `${scripts} script elements are placed — over ${SCRIPT_ELEMENT_BUDGET}, each a frame of its own; draw what needs no code as template elements` });
  }
  return advice;
}
