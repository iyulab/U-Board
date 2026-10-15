import { GRID_COLUMNS, GRID_COLUMNS_MEDIUM } from './view-document.js';
import type { ElementDefinition } from './view-document.js';
import { ELEMENT_NAME, elementNameOf } from './elements/element-type.js';
import { parseTemplate } from './elements/template.js';
import { checkStyle, checkTemplateMarkup, isResourceOrigin } from './elements/markup-policy.js';
import { checkPropsSchema, checkPropsValue } from './elements/props-schema.js';

/** One way a value fails to be a `ViewDocument`: where (an RFC 6901 JSON Pointer into the value,
 * `""` for the value itself) and what was expected there. */
export interface ViewDocumentIssue {
  path: string;
  message: string;
}

/**
 * Checks that `value` has every field the `ViewDocument` type promises, at every level — for a
 * canvas view the nodes, connectors, decorations and the background, for a grid view the items and
 * the room each takes, and in both every widget and binding. Returns every problem found (empty when
 * the value is a valid document), so a caller can say exactly what to fix rather than only that
 * something is wrong.
 *
 * Structure, and the elements the document defines. It does not interpret what the format leaves
 * opaque — a binding's `ref` belongs to its adapter, a prepared widget's `type` and `props` to its
 * widget library — and it does not judge most references between parts of a document (a connector
 * naming a node that is not there is drawn as nothing, not rejected). Two rules reach across parts:
 * every id — node, connector, decoration, grid item — is unique in the document, and a widget of
 * type `element:<name>` names an element the document defines, with props its definition accepts.
 * An element's definition is held to the element contract: a template's markup and CSS to the
 * markup policy, its props schema to the keyword subset. Fields it does not know are ignored, so a
 * document written by a newer version still reads.
 */
export function validateViewDocument(value: unknown): ViewDocumentIssue[] {
  const issues: ViewDocumentIssue[] = [];
  const doc = new Checker(issues);

  if (!isRecord(value)) {
    issues.push({ path: '', message: 'expected a view document object' });
    return issues;
  }

  if (value.appearance !== undefined && value.appearance !== 'light' && value.appearance !== 'dark') {
    doc.fail(['appearance'], 'expected "light" or "dark"');
  }
  if (value.elements !== undefined && doc.record(value, ['elements'])) checkElements(doc, value.elements as Record<string, unknown>);

  if (value.kind === 'canvas') checkCanvasView(doc, value);
  else if (value.kind === 'grid') checkGridView(doc, value);
  else doc.fail(['kind'], 'expected "canvas" or "grid"');

  return issues;
}

function checkCanvasView(doc: Checker, value: Record<string, unknown>): void {
  if (doc.record(value, ['background'])) {
    const background = value.background as Record<string, unknown>;
    if (background.image !== undefined && doc.record(background, ['background', 'image'])) {
      const image = background.image as Record<string, unknown>;
      doc.string(image, ['background', 'image', 'src']);
      doc.number(image, ['background', 'image', 'width']);
      doc.number(image, ['background', 'image', 'height']);
      if (image.referencePoints !== undefined) checkReferencePoints(doc, image.referencePoints, ['background', 'image', 'referencePoints']);
    }
  }

  if (doc.array(value, ['nodes'])) {
    (value.nodes as unknown[]).forEach((node, i) => checkNode(doc, node, ['nodes', String(i)]));
  }
  if (doc.array(value, ['connectors'])) {
    (value.connectors as unknown[]).forEach((connector, i) => {
      const at = ['connectors', String(i)];
      if (!doc.isRecordAt(connector, at)) return;
      doc.id(connector, [...at, 'id']);
      doc.string(connector, [...at, 'fromNodeId']);
      doc.string(connector, [...at, 'toNodeId']);
    });
  }
  if (value.decorations !== undefined && doc.array(value, ['decorations'])) {
    (value.decorations as unknown[]).forEach((shape, i) => checkShape(doc, shape, ['decorations', String(i)]));
  }
}

function checkGridView(doc: Checker, value: Record<string, unknown>): void {
  if (value.columns !== undefined && value.columns !== GRID_COLUMNS) doc.fail(['columns'], `expected ${GRID_COLUMNS}`);
  if (!doc.array(value, ['items'])) return;
  (value.items as unknown[]).forEach((item, i) => {
    const at = ['items', String(i)];
    if (!doc.isRecordAt(item, at)) return;
    doc.id(item, [...at, 'id']);
    doc.optionalSpan(item, [...at, 'span'], GRID_COLUMNS);
    doc.optionalSpan(item, [...at, 'spanMedium'], GRID_COLUMNS_MEDIUM);
    if (item.height !== undefined && !(Number.isFinite(item.height) && (item.height as number) > 0)) {
      doc.fail([...at, 'height'], 'expected a number greater than 0');
    }
    checkWidget(doc, item, at);
  });
}

/** Two points, each a place on the image and its coordinate, apart on both axes in both — a mapping from
 *  two points that share an axis value cannot say how that axis scales. */
function checkReferencePoints(doc: Checker, value: unknown, at: string[]): void {
  if (!Array.isArray(value) || value.length !== 2) {
    doc.fail(at, 'expected two reference points');
    return;
  }
  const points = value.map((point, i) => {
    const pointAt = [...at, String(i)];
    if (!doc.isRecordAt(point, pointAt)) return null;
    doc.number(point, [...pointAt, 'x']);
    doc.number(point, [...pointAt, 'y']);
    if (!doc.record(point, [...pointAt, 'coordinate'])) return null;
    const coordinate = point.coordinate as Record<string, unknown>;
    doc.number(coordinate, [...pointAt, 'coordinate', 'x']);
    doc.number(coordinate, [...pointAt, 'coordinate', 'y']);
    return point as { x: unknown; y: unknown; coordinate: { x: unknown; y: unknown } };
  });
  const [a, b] = points;
  if (a && b && (a.x === b.x || a.y === b.y || a.coordinate.x === b.coordinate.x || a.coordinate.y === b.coordinate.y)) {
    doc.fail(at, 'expected two points apart on both axes, in the image and in their coordinates');
  }
}

function checkNode(doc: Checker, node: unknown, at: string[]): void {
  if (!doc.isRecordAt(node, at)) return;
  doc.id(node, [...at, 'id']);
  doc.number(node, [...at, 'x']);
  doc.number(node, [...at, 'y']);
  doc.optionalNumber(node, [...at, 'width']);
  doc.optionalNumber(node, [...at, 'height']);
  if (typeof node.anchored !== 'boolean') doc.fail([...at, 'anchored'], 'expected true or false');
  checkWidget(doc, node, at);
}

/** The widget of a node or grid item — `at` is the path of the one that carries it. */
function checkWidget(doc: Checker, placed: Record<string, unknown>, at: string[]): void {
  if (!doc.record(placed, [...at, 'widget'])) return;
  const widget = placed.widget as Record<string, unknown>;
  doc.string(widget, [...at, 'widget', 'type']);
  const propsAreRecord = widget.props === undefined || doc.record(widget, [...at, 'widget', 'props']);
  const bindingsAreRecord = widget.bindings === undefined || doc.record(widget, [...at, 'widget', 'bindings']);
  if (typeof widget.type === 'string' && propsAreRecord && bindingsAreRecord) checkElementUse(doc, widget, at);
  if (widget.bindings === undefined || !bindingsAreRecord) return;

  for (const [key, binding] of Object.entries(widget.bindings as Record<string, unknown>)) {
    const bindingAt = [...at, 'widget', 'bindings', key];
    if (!isRecord(binding)) {
      doc.fail(bindingAt, 'expected a binding object ({ adapter, ref })');
      continue;
    }
    doc.string(binding, [...bindingAt, 'adapter']);
    if (!('ref' in binding)) doc.fail([...bindingAt, 'ref'], 'expected a ref (its shape is up to the adapter)');
    if (binding.map !== undefined && doc.record(binding, [...bindingAt, 'map'])) {
      checkValueMap(doc, binding.map as Record<string, unknown>, [...bindingAt, 'map']);
    }
  }
}

/** The elements a document defines, each held to the element contract. A definition that holds is kept for
 *  checking the widgets that place it; one that does not is still known by name, so its widgets are not also
 *  reported as naming nothing. */
function checkElements(doc: Checker, elements: Record<string, unknown>): void {
  for (const [name, definition] of Object.entries(elements)) {
    const at = ['elements', name];
    if (!ELEMENT_NAME.test(name)) doc.fail(at, 'expected a name of lowercase letters, digits and hyphens, starting with a letter (at most 40)');
    if (!doc.isRecordAt(definition, at)) {
      doc.elements.set(name, null);
      continue;
    }
    const before = doc.issueCount;
    checkElementDefinition(doc, definition, at);
    doc.elements.set(name, doc.issueCount === before ? (definition as unknown as ElementDefinition) : null);
  }
}

function checkElementDefinition(doc: Checker, definition: Record<string, unknown>, at: string[]): void {
  const resources: string[] = [];
  if (definition.resources !== undefined && doc.array(definition, [...at, 'resources'])) {
    (definition.resources as unknown[]).forEach((origin, i) => {
      if (isResourceOrigin(origin)) resources.push(origin);
      else doc.fail([...at, 'resources', String(i)], 'expected an https origin with nothing after it, such as "https://cdn.example.com"');
    });
  }

  const { render } = definition;
  if (render !== 'template' && render !== 'script') {
    doc.fail([...at, 'render'], 'expected "template" or "script"');
  } else if (render === 'template') {
    if (definition.script !== undefined) doc.fail([...at, 'script'], 'a template element runs no script — remove it, or use render: "script"');
    if (typeof definition.template !== 'string') {
      doc.fail([...at, 'template'], 'expected the markup a template element draws');
    } else {
      const parsed = parseTemplate(definition.template);
      if (!parsed.ok) doc.fail([...at, 'template'], `${parsed.error} (at character ${parsed.offset})`);
      for (const issue of checkTemplateMarkup(definition.template, resources)) doc.fail([...at, 'template'], issue.message);
    }
  } else {
    if (definition.template !== undefined) doc.fail([...at, 'template'], 'a script element draws with its script — remove the template, or use render: "template"');
    if (typeof definition.script !== 'string') doc.fail([...at, 'script'], 'expected the code a script element runs');
  }

  if (definition.style !== undefined) {
    if (typeof definition.style !== 'string') doc.fail([...at, 'style'], 'expected a string of CSS');
    else for (const issue of checkStyle(definition.style, resources)) doc.fail([...at, 'style'], issue.message);
  }
  if (definition.size !== undefined && doc.record(definition, [...at, 'size'])) {
    const size = definition.size as Record<string, unknown>;
    for (const side of ['width', 'height']) {
      if (!(Number.isFinite(size[side]) && (size[side] as number) > 0)) doc.fail([...at, 'size', side], 'expected a number greater than 0');
    }
  }
  if (definition.props !== undefined) {
    for (const issue of checkPropsSchema(definition.props)) doc.fail([...at, 'props', ...issue.at], issue.message);
  }
}

/** A widget that places an element: the element is defined, and its props are ones the definition accepts. A prop a
 *  binding fills is taken as given — its value arrives at render time. */
function checkElementUse(doc: Checker, widget: Record<string, unknown>, at: string[]): void {
  const name = elementNameOf(widget.type as string);
  if (name === undefined) return;
  const typeAt = [...at, 'widget', 'type'];
  if (!doc.elements.has(name)) {
    doc.fail(typeAt, ELEMENT_NAME.test(name) ? `no element "${name}" is defined — add it under /elements` : 'expected "element:" followed by an element name');
    return;
  }
  const definition = doc.elements.get(name);
  if (!definition?.props) return;
  const filled = new Set(Object.keys((widget.bindings as Record<string, unknown> | undefined) ?? {}).map(key => key.split('.')[0]));
  for (const issue of checkPropsValue(definition.props, widget.props ?? {}, filled)) doc.fail([...at, 'widget', 'props', ...issue.at], issue.message);
}

/** A value map's own shape. Its mapped values are the values the prop takes — the widget library's
 * business, like props — so they are not inspected. */
function checkValueMap(doc: Checker, map: Record<string, unknown>, at: string[]): void {
  if (map.values === undefined && map.ranges === undefined) {
    doc.fail(at, 'expected values, ranges or both');
    return;
  }
  if (map.values !== undefined) doc.record(map, [...at, 'values']);
  if (map.ranges === undefined || !doc.array(map, [...at, 'ranges'])) return;
  (map.ranges as unknown[]).forEach((range, i) => {
    const rangeAt = [...at, 'ranges', String(i)];
    if (!doc.isRecordAt(range, rangeAt)) return;
    doc.optionalNumber(range, [...rangeAt, 'min']);
    doc.optionalNumber(range, [...rangeAt, 'max']);
    if (range.min === undefined && range.max === undefined) doc.fail(rangeAt, 'expected min, max or both');
    else if (typeof range.min === 'number' && typeof range.max === 'number' && !(range.min < range.max)) {
      doc.fail([...rangeAt, 'max'], 'expected a number greater than min');
    }
    if (!('value' in range)) doc.fail([...rangeAt, 'value'], 'expected the value this range is shown as');
  });
}

function checkShape(doc: Checker, shape: unknown, at: string[]): void {
  if (!doc.isRecordAt(shape, at)) return;
  doc.id(shape, [...at, 'id']);
  if (shape.type !== 'rect' && shape.type !== 'text') {
    doc.fail([...at, 'type'], 'expected "rect" or "text"');
    return;
  }
  doc.number(shape, [...at, 'x']);
  doc.number(shape, [...at, 'y']);
  if (shape.type === 'rect') {
    doc.number(shape, [...at, 'width']);
    doc.number(shape, [...at, 'height']);
    doc.optionalString(shape, [...at, 'stroke']);
    doc.optionalNumber(shape, [...at, 'strokeWidth']);
  } else {
    doc.string(shape, [...at, 'text']);
    doc.optionalNumber(shape, [...at, 'fontSize']);
  }
  doc.optionalString(shape, [...at, 'fill']);
}

/** Field checks that record an issue at a path and report whether the field passed. The last
 * path segment names the field read from the given object. */
class Checker {
  /** Where each id was first seen — ids are unique across the whole document. */
  private readonly ids = new Map<string, string>();
  /** The elements the document defines: the definition when it holds, `null` when it is defined but does not. */
  readonly elements = new Map<string, ElementDefinition | null>();

  constructor(private readonly issues: ViewDocumentIssue[]) {}

  get issueCount(): number {
    return this.issues.length;
  }

  id(owner: Record<string, unknown>, at: string[]): void {
    const id = owner[at[at.length - 1]];
    if (typeof id !== 'string') {
      this.fail(at, 'expected a string');
      return;
    }
    const first = this.ids.get(id);
    if (first === undefined) this.ids.set(id, pointer(at.slice(0, -1)));
    else this.fail(at, `expected an id not used elsewhere in the document — ${first} has it`);
  }

  /** An optional whole number of columns, from 1 up to `columns`. */
  optionalSpan(owner: Record<string, unknown>, at: string[], columns: number): void {
    const value = owner[at[at.length - 1]];
    if (value !== undefined && !(Number.isInteger(value) && (value as number) >= 1 && (value as number) <= columns)) {
      this.fail(at, `expected a whole number from 1 to ${columns}`);
    }
  }

  fail(at: string[], message: string): void {
    this.issues.push({ path: pointer(at), message });
  }

  isRecordAt(value: unknown, at: string[]): value is Record<string, unknown> {
    if (isRecord(value)) return true;
    this.fail(at, 'expected an object');
    return false;
  }

  record(owner: Record<string, unknown>, at: string[]): boolean {
    return this.isRecordAt(owner[at[at.length - 1]], at);
  }

  array(owner: Record<string, unknown>, at: string[]): boolean {
    if (Array.isArray(owner[at[at.length - 1]])) return true;
    this.fail(at, 'expected an array');
    return false;
  }

  string(owner: Record<string, unknown>, at: string[]): void {
    if (typeof owner[at[at.length - 1]] !== 'string') this.fail(at, 'expected a string');
  }

  optionalString(owner: Record<string, unknown>, at: string[]): void {
    if (owner[at[at.length - 1]] !== undefined) this.string(owner, at);
  }

  number(owner: Record<string, unknown>, at: string[]): void {
    if (!Number.isFinite(owner[at[at.length - 1]])) this.fail(at, 'expected a finite number');
  }

  optionalNumber(owner: Record<string, unknown>, at: string[]): void {
    if (owner[at[at.length - 1]] !== undefined) this.number(owner, at);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pointer(segments: string[]): string {
  return segments.map(s => '/' + s.replace(/~/g, '~0').replace(/\//g, '~1')).join('');
}
