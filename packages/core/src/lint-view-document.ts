import { placedIn } from './view-document.js';
import { componentWidgets, expandComponents, instancePartId } from './components.js';
import type { StateRule, ViewDocument } from './view-document.js';
import { ELEMENT_SIZE_BUDGET, SCRIPT_ELEMENT_BUDGET, elementNameOf } from './elements/element-type.js';
import { lintGeometry } from './lint-geometry.js';

/** Advice on a valid view document: where (an RFC 6901 JSON Pointer) and what would make it better. */
export interface ViewDocumentAdvice {
  path: string;
  message: string;
  /** How many findings this one line stands for, when it folds several — the layout findings past the limit, counted
   *  rather than listed. Absent: one. */
  count?: number;
}

export interface LintOptions {
  /** How many layout findings (`lintGeometry`) are given one by one before the rest are folded into one counted line.
   *  Defaults to `GEOMETRY_ADVICE_LIMIT`; `Infinity` lists them all — for a reader that keeps only some of them
   *  (one part's) and must not lose any to the fold. */
  geometryLimit?: number;
}

/**
 * What a valid document (`validateViewDocument` found nothing) could do better — none of it stops the
 * document being saved or drawn. First, on a canvas board, where parts would be drawn over one another
 * (`lintGeometry`: overlapping nodes, a text under a node or crossed by a connector, texts running together);
 * then an element defined but placed nowhere, more `script` elements than a board draws lightly, an element
 * heavier than one should be, a look for a state its map never names, a trigger waiting for a state a part never
 * enters. For whoever writes the document — an author, a tool, an AI — to act on.
 */
export function lintViewDocument(doc: ViewDocument, options: LintOptions = {}): ViewDocumentAdvice[] {
  const advice: ViewDocumentAdvice[] = doc.kind === 'canvas' ? lintGeometry(doc, options.geometryLimit) : [];
  const elements = doc.elements ?? {};
  const placed = new Map<string, number>();
  // A component's node places its element once for each instance that draws it.
  for (const { widget } of placedIn(expandComponents(doc))) {
    const name = elementNameOf(widget.type);
    if (name !== undefined) placed.set(name, (placed.get(name) ?? 0) + 1);
  }
  const inComponents = new Set(componentWidgets(doc).flatMap(widget => elementNameOf(widget.type) ?? []));

  let scripts = 0;
  for (const [name, definition] of Object.entries(elements)) {
    const path = `/elements/${name}`;
    const count = placed.get(name) ?? 0;
    if (count === 0 && !inComponents.has(name)) advice.push({ path, message: 'no node or grid item places this element — remove it, or place it' });
    if (definition.render === 'script') scripts += count;
    const size = (definition.template?.length ?? 0) + (definition.script?.length ?? 0) + (definition.style?.length ?? 0);
    if (size > ELEMENT_SIZE_BUDGET) {
      advice.push({ path, message: `its markup, script and CSS come to ${size} characters — over ${ELEMENT_SIZE_BUDGET}, every viewer loads it; draw the repeated parts once (<symbol>/<use>, a section) or move a library to resources` });
    }
  }
  if (scripts > SCRIPT_ELEMENT_BUDGET) {
    advice.push({ path: '', message: `${scripts} script elements are placed — over ${SCRIPT_ELEMENT_BUDGET}, each a frame of its own; draw what needs no code as template elements` });
  }

  const parts = doc.kind === 'canvas' ? 'nodes' : 'items';
  // The states a part's map names, and advice for a look of one it never names — at the part's path, or at the
  // component node's for a part an instance draws (each node once).
  const namedStates = (rule: StateRule | undefined, at: string) => {
    const named = new Set<string>(
      rule
        ? [
            ...Object.values(rule.map.values ?? {}),
            ...(rule.map.ranges ?? []).map(range => range.value),
            ...(rule.map.otherwise !== undefined ? [rule.map.otherwise] : []),
          ]
        : []
    );
    for (const name of Object.keys(rule?.looks ?? {})) {
      if (!named.has(name)) {
        advice.push({ path: `${at}/states/looks/${name}`, message: `its map never names "${name}" — it names: ${[...named].join(', ')}; rename the look or add the state to the map` });
      }
    }
    return named;
  };
  const statesOf = new Map<string, Set<string>>();
  placedIn(doc).forEach((placed, i) => statesOf.set(placed.id, namedStates(placed.states, `/${parts}/${i}`)));
  if (doc.kind === 'canvas') {
    const byComponent = new Map<string, Set<string>[]>();
    for (const [name, component] of Object.entries(doc.components ?? {})) {
      byComponent.set(name, component.nodes.map((node, j) => namedStates(node.states, `/components/${name}/nodes/${j}`)));
    }
    for (const instance of doc.instances ?? []) {
      const named = byComponent.get(instance.component);
      doc.components?.[instance.component]?.nodes.forEach((node, j) => statesOf.set(instancePartId(instance.id, node.id), named![j]));
    }
  }

  // A trigger waiting for a state its part is never in never fires.
  const never = (node: string, state: string, path: string) => {
    const named = statesOf.get(node);
    if (!named || named.has(state)) return;
    advice.push({
      path,
      message: named.size > 0 ? `"${node}" is never in "${state}" — its map names: ${[...named].join(', ')}` : `"${node}" has no states — give it a states rule, or this never fires`,
    });
  };
  (doc.triggers ?? []).forEach((trigger, i) => {
    if (trigger.on.event === 'enter' || trigger.on.event === 'leave') never(trigger.on.node, trigger.on.state, `/triggers/${i}/on/state`);
    if (trigger.when) {
      const states = Array.isArray(trigger.when.state) ? trigger.when.state : [trigger.when.state];
      states.forEach((state, j) => never(trigger.when!.node, state, Array.isArray(trigger.when!.state) ? `/triggers/${i}/when/state/${j}` : `/triggers/${i}/when/state`));
    }
  });
  return advice;
}
