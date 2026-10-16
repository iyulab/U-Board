import type { CanvasView, ComponentDefinition, ComponentInstance, Connector, Node, Shape, ViewDocument, Widget } from './view-document.js';

/** A `{{name}}` in a component's text — a parameter's value goes there. */
const PLACEHOLDER = /\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g;
/** A text that is a single placeholder and nothing else — it takes the value itself, not its text. */
const WHOLE_PLACEHOLDER = /^\{\{([A-Za-z][A-Za-z0-9_]*)\}\}$/;

/** The id a part of an instance is drawn with: `<instance id>/<part id>`. */
export function instancePartId(instance: string, part: string): string {
  return `${instance}/${part}`;
}

/** A view with every component instance drawn as the parts it places — what a board looks like. */
export type ExpandedView<D extends ViewDocument> = D extends CanvasView ? Omit<D, 'components' | 'instances'> : D;

/**
 * The board as it is drawn: each component instance replaced by its parts — nodes, connectors and decorations moved to
 * the instance's origin, ids made `<instance id>/<part id>`, nodes taking the instance's `anchored`, every `{{name}}` in
 * their text filled with the instance's value (or the parameter's default). The parts follow the board's own, in
 * instance order. The result has no components left, so expanding it again changes nothing.
 *
 * An instance of a component the board does not define draws nothing; `validateViewDocument` reports it.
 */
export function expandComponents<D extends ViewDocument>(doc: D): ExpandedView<D> {
  if (doc.kind !== 'canvas') return doc as ExpandedView<D>;
  const { components, instances, ...view } = doc as CanvasView;
  if (!instances?.length && components === undefined) return view as ExpandedView<D>;
  const nodes: Node[] = [...view.nodes];
  const connectors: Connector[] = [...view.connectors];
  const decorations: Shape[] = [...(view.decorations ?? [])];
  for (const instance of instances ?? []) {
    const definition = components?.[instance.component];
    if (!definition) continue;
    const parts = instanceParts(definition, instance);
    nodes.push(...parts.nodes);
    connectors.push(...parts.connectors);
    decorations.push(...parts.decorations);
  }
  return {
    ...view,
    nodes,
    connectors,
    ...((decorations.length > 0 || view.decorations !== undefined) && { decorations }),
  } as ExpandedView<D>;
}

/** The parts one instance draws, as board parts. */
export function instanceParts(definition: ComponentDefinition, instance: ComponentInstance): { nodes: Node[]; connectors: Connector[]; decorations: Shape[] } {
  const values = parameterValues(definition, instance);
  const fill = <T>(part: T): T => fillParameters(part, values) as T;
  const id = (part: string) => instancePartId(instance.id, part);
  return {
    nodes: (definition.nodes ?? []).map(node => ({ ...fill(node), id: id(node.id), x: instance.x + node.x, y: instance.y + node.y, anchored: instance.anchored })),
    connectors: (definition.connectors ?? []).map(connector => ({ ...fill(connector), id: id(connector.id), fromNodeId: id(connector.fromNodeId), toNodeId: id(connector.toNodeId) })),
    decorations: (definition.decorations ?? []).map(shape => ({ ...fill(shape), id: id(shape.id), x: instance.x + shape.x, y: instance.y + shape.y })),
  };
}

/** The widget of every node of every component `doc` defines, in definition order — each once, whatever its instances. */
export function componentWidgets(doc: ViewDocument): Widget[] {
  if (doc.kind !== 'canvas') return [];
  return Object.values(doc.components ?? {}).flatMap(component => (Array.isArray(component.nodes) ? component.nodes.map(node => node.widget) : []));
}

/** Each parameter's value for an instance: the instance's, else the parameter's default. */
export function parameterValues(definition: ComponentDefinition, instance: Pick<ComponentInstance, 'params'>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(definition.params?.properties ?? {})) {
    if (schema.default !== undefined) values[name] = schema.default;
  }
  return { ...values, ...instance.params };
}

/** `value` with every `{{name}}` in its text filled from `values`, at any depth. A text that is only a placeholder
 *  takes the value as it is; inside a longer text the value is written as text. A name with no value is left out of
 *  a longer text and makes a whole-placeholder text absent. */
export function fillParameters(value: unknown, values: Readonly<Record<string, unknown>>): unknown {
  if (typeof value === 'string') {
    const whole = WHOLE_PLACEHOLDER.exec(value);
    if (whole) return values[whole[1]];
    return value.includes('{{') ? value.replace(PLACEHOLDER, (_, name: string) => asText(values[name])) : value;
  }
  if (Array.isArray(value)) return value.map(item => fillParameters(item, values));
  if (typeof value === 'object' && value !== null) {
    const filled: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const result = fillParameters(item, values);
      if (result !== undefined) filled[key] = result;
    }
    return filled;
  }
  return value;
}

/** Every `{{name}}` in `value`'s text, at any depth, with the path (segments) of the text it is in and whether it is
 *  the whole text. */
export function* placeholdersIn(value: unknown, at: string[] = []): Generator<{ name: string; at: string[]; whole: boolean }> {
  if (typeof value === 'string') {
    if (!value.includes('{{')) return;
    const whole = WHOLE_PLACEHOLDER.test(value);
    for (const match of value.matchAll(PLACEHOLDER)) yield { name: match[1], at, whole };
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* placeholdersIn(value[i], [...at, String(i)]);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) yield* placeholdersIn(item, [...at, key]);
  }
}

function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
