import type { CanvasView, ComponentDefinition, ComponentNode, Connector, Shape, Trigger } from '../view-document.js';
import { ELEMENT_NAME } from '../elements/element-type.js';
import { instancePartId, instanceParts } from '../components.js';
import { withTriggers } from './trigger-editing.js';

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

/** The board's own nodes and decorations among `ids`, in the board's order. */
function picked(doc: CanvasView, ids: readonly string[]) {
  const chosen = new Set(ids);
  return { nodes: doc.nodes.filter(n => chosen.has(n.id)), decorations: (doc.decorations ?? []).filter(d => chosen.has(d.id)) };
}

/** Every id the board's parts — its own and those its instances draw — and its instances have. */
function partIds(doc: CanvasView): Set<string> {
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
