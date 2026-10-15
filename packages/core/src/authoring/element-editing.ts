import { placedIn, type ElementDefinition, type ViewDocument, type Widget } from '../view-document.js';
import { ELEMENT_NAME, ELEMENT_TYPE_PREFIX, elementNameOf } from '../elements/element-type.js';
import { validateViewDocument, type ViewDocumentIssue } from '../validate-view-document.js';

/** What a new element starts as: a template with one text prop, drawn in the board's theme. */
export const NEW_ELEMENT: ElementDefinition = {
  render: 'template',
  template: '<div class="box">{{label}}</div>',
  style: '.box { padding: 8px; border: 1px solid var(--u-widget-border); border-radius: 6px; }',
  props: { type: 'object', properties: { label: { type: 'string', default: 'Label' } } },
};

/** How many of the document's widgets place each element it defines (0 for one placed nowhere), and the elements it
 *  places that it does not define. */
export function elementUses(doc: ViewDocument): Map<string, number> {
  const uses = new Map<string, number>(Object.keys(doc.elements ?? {}).map(name => [name, 0]));
  for (const placed of placedIn(doc)) {
    const name = elementNameOf(placed.widget.type);
    if (name !== undefined) uses.set(name, (uses.get(name) ?? 0) + 1);
  }
  return uses;
}

/** A name no element of the document has yet: `element-1`, `element-2`, … */
export function newElementName(doc: ViewDocument): string {
  const taken = new Set(Object.keys(doc.elements ?? {}));
  for (let i = 1; ; i++) if (!taken.has(`element-${i}`)) return `element-${i}`;
}

/** `doc` with element `name` defined as `definition` — added, or replacing what it was. */
export function setElement<D extends ViewDocument>(doc: D, name: string, definition: ElementDefinition): D {
  return { ...doc, elements: { ...doc.elements, [name]: definition } };
}

/** Why `name` cannot be what an element of `doc` is renamed to (or a new one is called), or `undefined` when it can.
 *  `current` is the element's own name, which it may keep. */
export function elementNameProblem(doc: ViewDocument, name: string, current?: string): 'invalid' | 'taken' | undefined {
  if (!ELEMENT_NAME.test(name)) return 'invalid';
  if (name !== current && Object.hasOwn(doc.elements ?? {}, name)) return 'taken';
  return undefined;
}

/** Every placed widget of `doc`, changed by `change` — a canvas view's nodes or a grid view's items. */
function mapWidgets<D extends ViewDocument>(doc: D, change: (widget: Widget) => Widget): D {
  if (doc.kind === 'canvas') return { ...doc, nodes: doc.nodes.map(node => ({ ...node, widget: change(node.widget) })) };
  return { ...doc, items: doc.items.map(item => ({ ...item, widget: change(item.widget) })) };
}

/** `doc` with element `from` called `to`, and every widget that places it placing it by the new name. Unchanged when
 *  `to` is not a name it can take (`elementNameProblem`). */
export function renameElement<D extends ViewDocument>(doc: D, from: string, to: string): D {
  if (from === to || !Object.hasOwn(doc.elements ?? {}, from) || elementNameProblem(doc, to, from)) return doc;
  // The registry keeps its order, the renamed entry in its place.
  const elements = Object.fromEntries(Object.entries(doc.elements!).map(([name, definition]) => [name === from ? to : name, definition]));
  const placed = mapWidgets(doc, widget => (elementNameOf(widget.type) === from ? { ...widget, type: `${ELEMENT_TYPE_PREFIX}${to}` } : widget));
  return { ...placed, elements };
}

/** `doc` without element `name` — only while no widget places it; unchanged otherwise. */
export function removeElement<D extends ViewDocument>(doc: D, name: string): D {
  if ((elementUses(doc).get(name) ?? 0) > 0 || !Object.hasOwn(doc.elements ?? {}, name)) return doc;
  const { [name]: _removed, ...elements } = doc.elements!;
  if (Object.keys(elements).length > 0) return { ...doc, elements };
  const { elements: _empty, ...rest } = doc;
  return rest as D;
}

/** What is wrong with `definition` as element `name` of `doc` — the document's own checks, the paths below the
 *  definition's (`/props/properties/level/maximum`), not the paths of other parts of the document. */
export function elementIssues(doc: ViewDocument, name: string, definition: ElementDefinition): ViewDocumentIssue[] {
  const prefix = `/elements/${name}`;
  return validateViewDocument(setElement(doc, name, definition), { strict: true })
    .filter(issue => issue.path === prefix || issue.path.startsWith(`${prefix}/`))
    .map(issue => ({ ...issue, path: issue.path.slice(prefix.length) }));
}

/** Props to preview element `name` with: the first placement's own props, over the defaults its schema gives. */
export function previewProps(doc: ViewDocument, name: string, definition: ElementDefinition): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(definition.props?.properties ?? {})) {
    if (schema.default !== undefined) props[key] = schema.default;
  }
  const first = placedIn(doc).find(placed => elementNameOf(placed.widget.type) === name);
  const own = first?.widget.props;
  return typeof own === 'object' && own !== null && !Array.isArray(own) ? { ...props, ...(own as Record<string, unknown>) } : props;
}
