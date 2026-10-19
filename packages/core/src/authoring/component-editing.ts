import type { CanvasView, ComponentDefinition, ComponentNode, Connector, PropsSchema, Shape, Trigger } from '../view-document.js';
import { ELEMENT_NAME } from '../elements/element-type.js';
import { fillParameters, instancePartId, instanceParts, placeholdersIn } from '../components.js';
import { triggersWithout, withTriggers } from './trigger-editing.js';
import { removeParts } from './part-removal.js';

/** A name no component of `doc` has yet: `component-1`, `component-2`, … */
export function newComponentName(doc: CanvasView): string {
  const taken = new Set(Object.keys(doc.components ?? {}));
  for (let i = 1; ; i++) if (!taken.has(`component-${i}`)) return `component-${i}`;
}

/** An id no part or instance of `doc` has yet: `<prefix>-1`, `<prefix>-2`, … */
export function newInstanceId(doc: CanvasView, prefix = 'instance'): string {
  const taken = partIds(doc);
  for (let i = 1; ; i++) if (!taken.has(`${prefix}-${i}`)) return `${prefix}-${i}`;
}

/**
 * Whether the parts `ids` names can be made a component (`makeComponent`): at least one of the board's own nodes or
 * decorations, ids a component's part can take (no "/" or `{{`), and nodes all anchored or all free — an instance
 * gives its nodes one `anchored`.
 */
export function canMakeComponent(doc: CanvasView, ids: readonly string[]): boolean {
  const { nodes, decorations } = picked(doc, ids);
  if (nodes.length + decorations.length === 0) return false;
  if ([...nodes, ...decorations].some(part => part.id.includes('/') || part.id.includes('{{'))) return false;
  return nodes.every(node => node.anchored === nodes[0].anchored);
}

/**
 * `doc` with the board's own nodes and decorations `ids` names — and the lines between those nodes — made component
 * `name` and drawn by instance `instanceId` where they were: the component's origin is their top-left, and each part
 * keeps its id. A line or trigger of the board that named a part now names it as the instance draws it
 * (`<instanceId>/<part id>`). Unchanged when they cannot be made one (`canMakeComponent`).
 */
export function makeComponent(doc: CanvasView, ids: readonly string[], name: string, instanceId: string): CanvasView {
  if (!canMakeComponent(doc, ids) || !ELEMENT_NAME.test(name) || Object.hasOwn(doc.components ?? {}, name) || partIds(doc).has(instanceId)) return doc;
  const { nodes, decorations } = picked(doc, ids);
  const moved = new Set(nodes.map(node => node.id));
  const inside = doc.connectors.filter(c => moved.has(c.fromNodeId) && moved.has(c.toNodeId));
  const x = Math.min(...[...nodes, ...decorations].map(part => part.x));
  const y = Math.min(...[...nodes, ...decorations].map(part => part.y));
  const component: ComponentDefinition = {
    nodes: nodes.map((placed): ComponentNode => {
      const { anchored: _anchored, ...node } = placed;
      return { ...node, x: node.x - x, y: node.y - y };
    }),
    ...(inside.length > 0 && { connectors: inside }),
    ...(decorations.length > 0 && { decorations: decorations.map(shape => ({ ...shape, x: shape.x - x, y: shape.y - y })) }),
  };
  const renamed = new Map([...moved].map(id => [id, instancePartId(instanceId, id)]));
  const gone = new Set([...moved, ...decorations.map(d => d.id), ...inside.map(c => c.id)]);
  const kept = (parts: readonly { id: string }[] | undefined) => parts?.filter(part => !gone.has(part.id));
  const board: CanvasView = {
    ...doc,
    nodes: kept(doc.nodes) as CanvasView['nodes'],
    connectors: (kept(doc.connectors) as Connector[]).map(c => withEnds(c, renamed)),
    ...(doc.decorations && { decorations: kept(doc.decorations) as Shape[] }),
    components: { ...doc.components, [name]: component },
    instances: [...(doc.instances ?? []), { id: instanceId, component: name, x, y, anchored: nodes[0]?.anchored ?? false }],
  };
  return withTriggers(board, renameTriggerParts(doc.triggers, renamed));
}

/**
 * `doc` with instance `id` drawn as parts of the board's own — its parts as it draws them, each named
 * `<instance id>-<part id>` (or with a number after it, when that is taken) — and the instance gone. A line or trigger
 * that named one of its parts names the board's part instead. The component stays, for its other instances.
 */
export function detachInstance(doc: CanvasView, id: string): CanvasView {
  const instance = doc.instances?.find(i => i.id === id);
  const definition = instance && doc.components?.[instance.component];
  if (!instance || !definition) return doc;
  const parts = instanceParts(definition, instance);
  const taken = partIds(doc);
  const renamed = new Map<string, string>();
  for (const part of [...parts.nodes, ...parts.connectors, ...parts.decorations]) {
    const base = part.id.replace('/', '-');
    let next = base;
    for (let n = 2; taken.has(next); n++) next = `${base}-${n}`;
    taken.add(next);
    renamed.set(part.id, next);
  }
  const rename = <P extends { id: string }>(part: P): P => ({ ...part, id: renamed.get(part.id)! });
  const board: CanvasView = {
    ...doc,
    nodes: [...doc.nodes, ...parts.nodes.map(rename)],
    connectors: [...doc.connectors.map(c => withEnds(c, renamed)), ...parts.connectors.map(c => withEnds(rename(c), renamed))],
    ...((doc.decorations || parts.decorations.length > 0) && { decorations: [...(doc.decorations ?? []), ...parts.decorations.map(rename)] }),
    instances: doc.instances!.filter(i => i.id !== id),
  };
  return withTriggers(board, renameTriggerParts(doc.triggers, renamed));
}

/**
 * Component `name` of `doc` as a board of its own, to edit with the board's editor: its parts placed from its origin,
 * its nodes free, with the board's elements, symbols, tone and accent. `null` when `doc` has no such component.
 */
export function componentBoard(doc: CanvasView, name: string): CanvasView | null {
  const definition = doc.components?.[name];
  if (!definition) return null;
  return {
    kind: 'canvas',
    background: {},
    nodes: definition.nodes.map(node => ({ ...node, anchored: false })),
    connectors: definition.connectors ?? [],
    ...(definition.decorations && { decorations: definition.decorations }),
    ...(doc.elements && { elements: doc.elements }),
    ...(doc.symbols && { symbols: doc.symbols }),
    ...(doc.appearance && { appearance: doc.appearance }),
    ...(doc.accent && { accent: doc.accent }),
  };
}

/**
 * `doc` with component `name` made what `board` (a `componentBoard` of it, edited) holds — its parts. The elements
 * and symbols stay the board's: they are edited on the board, where every use of them is. A part it no longer has
 * goes from every instance, and so do the board's lines and triggers that named it there.
 */
export function withComponentBoard(doc: CanvasView, name: string, board: CanvasView): CanvasView {
  const definition = doc.components?.[name];
  if (!definition) return doc;
  const component: ComponentDefinition = {
    ...(definition.params && { params: definition.params }),
    nodes: board.nodes.map(placed => {
      const { anchored: _anchored, ...node } = placed;
      return node;
    }),
    ...(board.connectors.length > 0 && { connectors: board.connectors }),
    ...(board.decorations && board.decorations.length > 0 && { decorations: board.decorations }),
  };
  const left = new Set(component.nodes.map(node => node.id));
  const gone = new Set(
    (doc.instances ?? [])
      .filter(instance => instance.component === name)
      .flatMap(instance => definition.nodes.filter(node => !left.has(node.id)).map(node => instancePartId(instance.id, node.id)))
  );
  const next: CanvasView = {
    ...doc,
    components: { ...doc.components, [name]: component },
    connectors: gone.size > 0 ? doc.connectors.filter(c => !gone.has(c.fromNodeId) && !gone.has(c.toNodeId)) : doc.connectors,
  };
  return gone.size > 0 ? withTriggers(next, triggersWithout(doc.triggers, gone)) : next;
}

/**
 * The values a component board shows while component `name` is edited: each parameter's default, else the first
 * instance's value — so its parts look as they will on the board, not as `{{param}}` text a widget cannot draw.
 */
export function componentPreviewValues(doc: CanvasView, name: string): Record<string, unknown> {
  const definition = doc.components?.[name];
  if (!definition) return {};
  const first = doc.instances?.find(instance => instance.component === name);
  const values: Record<string, unknown> = { ...first?.params };
  for (const [param, schema] of Object.entries(definition.params?.properties ?? {})) {
    if (schema.default !== undefined) values[param] = schema.default;
  }
  return values;
}

/**
 * `board` (a `componentBoard`) as it is drawn while edited: its parts' text filled from `values`, ids and line ends
 * as they are. Display only — edits go to `board` itself, placeholders and all. A placeholder `values` has nothing
 * for stays as it is written.
 */
export function componentPreview(board: CanvasView, values: Readonly<Record<string, unknown>>): CanvasView {
  const known: Record<string, unknown> = {};
  for (const { name } of placeholdersIn([board.nodes, board.connectors, board.decorations ?? []])) known[name] = `{{${name}}}`;
  Object.assign(known, values);
  const fill = <T extends { id: string }>(part: T): T => ({ ...(fillParameters(part, known) as T), id: part.id });
  return {
    ...board,
    nodes: board.nodes.map(fill),
    connectors: board.connectors.map(connector => ({ ...fill(connector), fromNodeId: connector.fromNodeId, toNodeId: connector.toNodeId })),
    ...(board.decorations && { decorations: board.decorations.map(fill) }),
  };
}

/** `doc` with component `from` called `to`, and every instance of it drawing it by the new name — its place among the
 *  components kept. The instances' parts keep their ids (`<instance>/<part>`), so nothing that names them changes. */
export function renameComponent(doc: CanvasView, from: string, to: string): CanvasView {
  if (from === to || !doc.components?.[from] || doc.components[to]) return doc;
  const components = Object.fromEntries(Object.entries(doc.components).map(([name, definition]) => [name === from ? to : name, definition]));
  const instances = doc.instances?.map(instance => (instance.component === from ? { ...instance, component: to } : instance));
  return { ...doc, components, ...(instances && { instances }) };
}

/** `doc` without component `name` — and without its instances, which take their parts, and the lines and triggers
 *  that name those parts, with them (`removeParts`). */
export function removeComponent(doc: CanvasView, name: string): CanvasView {
  if (!doc.components?.[name]) return doc;
  const withoutInstances = removeParts(doc, (doc.instances ?? []).filter(instance => instance.component === name).map(instance => instance.id));
  const { [name]: _removed, ...components } = withoutInstances.components!;
  if (Object.keys(components).length > 0) return { ...withoutInstances, components };
  const { components: _empty, ...rest } = withoutInstances;
  return rest;
}

/** `doc` with component `name` taking the parameters `params` declares — none when `undefined`. */
export function setComponentParams(doc: CanvasView, name: string, params: PropsSchema | undefined): CanvasView {
  const definition = doc.components?.[name];
  if (!definition) return doc;
  const { params: _old, ...rest } = definition;
  return { ...doc, components: { ...doc.components, [name]: params ? { ...rest, params } : rest } };
}

/** The board's own nodes and decorations among `ids`, in the board's order. */
function picked(doc: CanvasView, ids: readonly string[]) {
  const chosen = new Set(ids);
  return { nodes: doc.nodes.filter(n => chosen.has(n.id)), decorations: (doc.decorations ?? []).filter(d => chosen.has(d.id)) };
}

/** Every id the board's parts — its own and those its instances draw — and its instances have. */
export function partIds(doc: CanvasView): Set<string> {
  const ids = new Set([...doc.nodes, ...doc.connectors, ...(doc.decorations ?? []), ...(doc.instances ?? [])].map(part => part.id));
  for (const instance of doc.instances ?? []) {
    const definition = doc.components?.[instance.component];
    if (!definition) continue;
    const parts = instanceParts(definition, instance);
    for (const part of [...parts.nodes, ...parts.connectors, ...parts.decorations]) ids.add(part.id);
  }
  return ids;
}

function withEnds(connector: Connector, renamed: ReadonlyMap<string, string>): Connector {
  const from = renamed.get(connector.fromNodeId);
  const to = renamed.get(connector.toNodeId);
  return from || to ? { ...connector, ...(from && { fromNodeId: from }), ...(to && { toNodeId: to }) } : connector;
}

/** `triggers` with every part they name — on, when, a focus — named as `renamed` says. */
function renameTriggerParts(triggers: readonly Trigger[] | undefined, renamed: ReadonlyMap<string, string>): Trigger[] | undefined {
  if (!triggers) return undefined;
  const name = (part: string) => renamed.get(part) ?? part;
  return triggers.map(trigger => ({
    ...trigger,
    on: 'node' in trigger.on ? { ...trigger.on, node: name(trigger.on.node) } : trigger.on,
    ...(trigger.when && { when: { ...trigger.when, node: name(trigger.when.node) } }),
    do: trigger.do.map(action => (action.action === 'focus' ? { ...action, node: name(action.node) } : action)),
  }));
}
