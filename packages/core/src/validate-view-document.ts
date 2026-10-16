import { CONNECTOR_ARROWS, CONNECTOR_BINDABLE, PLACEMENTS, STROKE_DASHES, GRID_COLUMNS, GRID_COLUMNS_MEDIUM, type ConnectorArrow, type Placement, type StrokeDash } from './view-document.js';
import type { ElementDefinition } from './view-document.js';
import { ELEMENT_NAME, elementNameOf } from './elements/element-type.js';
import { parseTemplate } from './elements/template.js';
import { checkStyle, checkTemplateMarkup, isResourceOrigin } from './elements/markup-policy.js';
import { checkPropsSchema, checkPropsValue } from './elements/props-schema.js';
import { DRAWING_COLOR_FORMS, isDrawingColor } from './css-color.js';

/** One way a value fails to be a `ViewDocument`: where (an RFC 6901 JSON Pointer into the value,
 * `""` for the value itself) and what was expected there. */
export interface ViewDocumentIssue {
  path: string;
  message: string;
}

/** How a document is checked. */
export interface ValidateOptions {
  /**
   * For a document about to be written — saved, or checked before saving. Also refuses what this version would keep
   * but never draw: a field the format does not have (each issue names the fields that place does have) and a
   * decoration colour outside the forms every canvas reads (`DRAWING_COLOR_FORMS`). Leave it off to read a document,
   * so one written by a newer version still opens.
   */
  strict?: boolean;
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
 * widget library. Three rules reach across parts: every id — node, connector, decoration, grid
 * item — is unique in the document, a connector joins two nodes the document has, and a widget of
 * type `element:<name>` names an element the document defines, with props its definition accepts.
 * An element's definition is held to the element contract: a template's markup and CSS to the
 * markup policy, its props schema to the keyword subset. Fields it does not know are ignored unless
 * `options.strict` — so a document written by a newer version still reads.
 */
export function validateViewDocument(value: unknown, options: ValidateOptions = {}): ViewDocumentIssue[] {
  const issues: ViewDocumentIssue[] = [];
  const doc = new Checker(issues, options.strict === true);

  if (!isRecord(value)) {
    issues.push({ path: '', message: 'expected a view document object' });
    return issues;
  }

  if (value.appearance !== undefined && value.appearance !== 'light' && value.appearance !== 'dark') {
    doc.expected(['appearance'], 'expected "light" or "dark"', value.appearance);
  }
  if (value.elements !== undefined && doc.record(value, ['elements'])) checkElements(doc, value.elements as Record<string, unknown>);

  if (value.kind === 'canvas') {
    doc.known(value, [], CANVAS_FIELDS, 'canvas view');
    checkCanvasView(doc, value);
  } else if (value.kind === 'grid') {
    doc.known(value, [], GRID_FIELDS, 'grid view');
    checkGridView(doc, value);
  } else if (isRecord(value.kind) && 'kind' in value.kind) {
    // { "kind": { "kind": "canvas", … } } — the document nested in its own first key.
    doc.fail(['kind'], 'expected "canvas" or "grid" — "kind" holds an object with its own "kind": the document is wrapped one level too deep; send the document itself');
  } else doc.expected(['kind'], 'expected "canvas" or "grid"', value.kind);

  return issues;
}

/** The fields each part of a document has — what `strict` holds a written document to. */
const CANVAS_FIELDS = ['kind', 'appearance', 'elements', 'background', 'nodes', 'connectors', 'decorations'];
const GRID_FIELDS = ['kind', 'appearance', 'elements', 'columns', 'items'];
const NODE_FIELDS = ['id', 'x', 'y', 'width', 'height', 'anchored', 'caption', 'widget'];
const GRID_ITEM_FIELDS = ['id', 'span', 'spanMedium', 'height', 'widget'];
const CONNECTOR_FIELDS = ['id', 'fromNodeId', 'toNodeId', 'label', 'labelAt', 'style', 'bindings'];
const CONNECTOR_STYLE_FIELDS = ['stroke', 'strokeWidth', 'dash', 'arrow'];
const RECT_FIELDS = ['id', 'type', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'radius', 'dash', 'label', 'labelAt', 'labelSize'];
const TEXT_FIELDS = ['id', 'type', 'x', 'y', 'text', 'fontSize', 'fill', 'anchor', 'background'];
const WIDGET_FIELDS = ['type', 'props', 'bindings'];
const BINDING_FIELDS = ['adapter', 'ref', 'map'];
const VALUE_MAP_FIELDS = ['values', 'ranges', 'otherwise'];
const RANGE_FIELDS = ['min', 'max', 'value'];
const BACKGROUND_FIELDS = ['image'];
const IMAGE_FIELDS = ['src', 'width', 'height', 'referencePoints'];
const ELEMENT_FIELDS = ['render', 'props', 'template', 'script', 'style', 'size', 'resources'];

function checkCanvasView(doc: Checker, value: Record<string, unknown>): void {
  if (doc.record(value, ['background'])) {
    const background = value.background as Record<string, unknown>;
    doc.known(background, ['background'], BACKGROUND_FIELDS, 'background');
    if (background.image !== undefined && doc.record(background, ['background', 'image'])) {
      const image = background.image as Record<string, unknown>;
      doc.known(image, ['background', 'image'], IMAGE_FIELDS, 'background image');
      doc.string(image, ['background', 'image', 'src']);
      doc.number(image, ['background', 'image', 'width']);
      doc.number(image, ['background', 'image', 'height']);
      if (image.referencePoints !== undefined) checkReferencePoints(doc, image.referencePoints, ['background', 'image', 'referencePoints']);
    }
  }

  const nodeIds = new Set<string>();
  if (doc.array(value, ['nodes'])) {
    (value.nodes as unknown[]).forEach((node, i) => {
      checkNode(doc, node, ['nodes', String(i)]);
      if (isRecord(node) && typeof node.id === 'string') nodeIds.add(node.id);
    });
  }
  if (doc.array(value, ['connectors'])) {
    (value.connectors as unknown[]).forEach((connector, i) => {
      const at = ['connectors', String(i)];
      if (!doc.isRecordAt(connector, at)) return;
      doc.known(connector, at, CONNECTOR_FIELDS, 'connector', CONNECTOR_HINT);
      doc.id(connector, [...at, 'id']);
      for (const end of ['fromNodeId', 'toNodeId']) {
        if (typeof connector[end] !== 'string') doc.expected([...at, end], 'expected a string', connector[end]);
        else if (!nodeIds.has(connector[end] as string)) doc.fail([...at, end], `no node has the id "${connector[end] as string}" — a connector joins two nodes of /nodes`);
      }
      doc.optionalString(connector, [...at, 'label']);
      if (connector.labelAt !== undefined && !(typeof connector.labelAt === 'number' && connector.labelAt >= 0 && connector.labelAt <= 1)) {
        doc.expected([...at, 'labelAt'], 'expected a number from 0 (the fromNodeId end) to 1 (the toNodeId end)', connector.labelAt);
      }
      if (connector.style !== undefined && doc.record(connector, [...at, 'style'])) {
        const style = connector.style as Record<string, unknown>;
        doc.known(style, [...at, 'style'], CONNECTOR_STYLE_FIELDS, 'connector style');
        doc.optionalColor(style, [...at, 'style', 'stroke']);
        if (style.strokeWidth !== undefined && !(Number.isFinite(style.strokeWidth) && (style.strokeWidth as number) > 0)) {
          doc.expected([...at, 'style', 'strokeWidth'], 'expected a number greater than 0', style.strokeWidth);
        }
        if (style.dash !== undefined && !STROKE_DASHES.includes(style.dash as StrokeDash)) {
          doc.fail([...at, 'style', 'dash'], 'expected "solid", "dashed" or "dotted"');
        }
        if (style.arrow !== undefined && !CONNECTOR_ARROWS.includes(style.arrow as ConnectorArrow)) {
          doc.fail([...at, 'style', 'arrow'], 'expected "none", "end" (pointing at toNodeId), "start" (pointing at fromNodeId) or "both"');
        }
      }
      if (connector.bindings !== undefined && doc.record(connector, [...at, 'bindings'])) {
        const bindings = connector.bindings as Record<string, unknown>;
        for (const key of Object.keys(bindings)) {
          if (!(CONNECTOR_BINDABLE as readonly string[]).includes(key)) {
            doc.fail([...at, 'bindings', key], `a connector binds only ${CONNECTOR_BINDABLE.join(', ')}`);
          }
        }
        checkBindings(doc, bindings, [...at, 'bindings']);
      }
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
    doc.known(item, at, GRID_ITEM_FIELDS, 'grid item');
    doc.id(item, [...at, 'id']);
    doc.optionalSpan(item, [...at, 'span'], GRID_COLUMNS);
    doc.optionalSpan(item, [...at, 'spanMedium'], GRID_COLUMNS_MEDIUM);
    if (item.height !== undefined && !(Number.isFinite(item.height) && (item.height as number) > 0)) {
      doc.expected([...at, 'height'], 'expected a number greater than 0', item.height);
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
  doc.known(node, at, NODE_FIELDS, 'node');
  doc.id(node, [...at, 'id']);
  doc.number(node, [...at, 'x']);
  doc.number(node, [...at, 'y']);
  doc.optionalNumber(node, [...at, 'width']);
  doc.optionalNumber(node, [...at, 'height']);
  if (typeof node.anchored !== 'boolean') doc.expected([...at, 'anchored'], 'expected true or false', node.anchored);
  doc.optionalString(node, [...at, 'caption']);
  checkWidget(doc, node, at);
}

/** The widget of a node or grid item — `at` is the path of the one that carries it. */
function checkWidget(doc: Checker, placed: Record<string, unknown>, at: string[]): void {
  if (!doc.record(placed, [...at, 'widget'])) return;
  const widget = placed.widget as Record<string, unknown>;
  doc.known(widget, [...at, 'widget'], WIDGET_FIELDS, 'widget', WIDGET_HINT);
  doc.string(widget, [...at, 'widget', 'type']);
  const propsAreRecord = widget.props === undefined || doc.record(widget, [...at, 'widget', 'props']);
  const bindingsAreRecord = widget.bindings === undefined || doc.record(widget, [...at, 'widget', 'bindings']);
  if (typeof widget.type === 'string' && propsAreRecord && bindingsAreRecord) checkElementUse(doc, widget, at);
  if (widget.bindings === undefined || !bindingsAreRecord) return;
  checkBindings(doc, widget.bindings as Record<string, unknown>, [...at, 'widget', 'bindings']);
}

/** Each binding's own shape — a widget's or a connector's, `at` the path of the bindings object. */
function checkBindings(doc: Checker, bindings: Record<string, unknown>, at: string[]): void {
  for (const [key, binding] of Object.entries(bindings)) {
    const bindingAt = [...at, key];
    if (!isRecord(binding)) {
      doc.fail(bindingAt, 'expected a binding object ({ adapter, ref })');
      continue;
    }
    doc.known(binding, bindingAt, BINDING_FIELDS, 'binding');
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
    doc.known(definition, at, ELEMENT_FIELDS, 'element definition');
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
      if (!(Number.isFinite(size[side]) && (size[side] as number) > 0)) doc.expected([...at, 'size', side], 'expected a number greater than 0', size[side]);
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
  doc.known(map, at, VALUE_MAP_FIELDS, 'value map');
  if (map.values === undefined && map.ranges === undefined) {
    doc.fail(at, 'expected values, ranges or both');
    return;
  }
  if (map.values !== undefined) doc.record(map, [...at, 'values']);
  if (map.ranges === undefined || !doc.array(map, [...at, 'ranges'])) return;
  (map.ranges as unknown[]).forEach((range, i) => {
    const rangeAt = [...at, 'ranges', String(i)];
    if (!doc.isRecordAt(range, rangeAt)) return;
    doc.known(range, rangeAt, RANGE_FIELDS, 'range');
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
    doc.known(shape, at, RECT_FIELDS, 'rect decoration', SHAPE_HINT);
    doc.number(shape, [...at, 'width']);
    doc.number(shape, [...at, 'height']);
    doc.optionalColor(shape, [...at, 'stroke']);
    doc.optionalNumber(shape, [...at, 'strokeWidth']);
    if (shape.radius !== undefined && !(Number.isFinite(shape.radius) && (shape.radius as number) >= 0)) {
      doc.expected([...at, 'radius'], 'expected a number of 0 or more', shape.radius);
    }
    if (shape.dash !== undefined && !STROKE_DASHES.includes(shape.dash as StrokeDash)) {
      doc.fail([...at, 'dash'], 'expected "solid", "dashed" or "dotted"');
    }
    if (shape.label !== undefined) doc.string(shape, [...at, 'label']);
    doc.placement(shape, [...at, 'labelAt']);
    if (shape.labelSize !== undefined && !(Number.isFinite(shape.labelSize) && (shape.labelSize as number) > 0)) {
      doc.expected([...at, 'labelSize'], 'expected a number greater than 0', shape.labelSize);
    }
  } else {
    doc.known(shape, at, TEXT_FIELDS, 'text decoration', SHAPE_HINT);
    doc.string(shape, [...at, 'text']);
    doc.optionalNumber(shape, [...at, 'fontSize']);
    doc.placement(shape, [...at, 'anchor']);
    doc.optionalColor(shape, [...at, 'background']);
  }
  doc.optionalColor(shape, [...at, 'fill']);
}

/** What to do instead, for the fields a writer most often reaches for where the format has none. */
const CONNECTOR_HINT = 'Its text goes in label (labelAt places it along the line), its colour, width, dash and arrowheads in style: { stroke, strokeWidth, dash, arrow }.';
const SHAPE_HINT = 'A frame’s name is its label (labelAt places it inside the frame); a text’s background fills a box behind it.';
const WIDGET_HINT = 'A prepared widget’s data, mapping and options go inside props.';

/** Field checks that record an issue at a path and report whether the field passed. The last
 * path segment names the field read from the given object. */
class Checker {
  /** Where each id was first seen — ids are unique across the whole document. */
  private readonly ids = new Map<string, string>();
  /** The elements the document defines: the definition when it holds, `null` when it is defined but does not. */
  readonly elements = new Map<string, ElementDefinition | null>();

  constructor(
    private readonly issues: ViewDocumentIssue[],
    private readonly strict: boolean
  ) {}

  /** With `strict`: every field of `owner` is one of `fields` — the place at `at`, called `noun`. */
  known(owner: Record<string, unknown>, at: string[], fields: readonly string[], noun: string, hint?: string): void {
    if (!this.strict) return;
    for (const key of Object.keys(owner)) {
      if (!fields.includes(key)) {
        this.fail([...at, key], `a ${noun} has no "${key}" — it would be kept but never drawn. A ${noun} has: ${fields.join(', ')}.${hint ? ` ${hint}` : ''}`);
      }
    }
  }

  /** An optional point of a box — one of `PLACEMENTS`. */
  placement(owner: Record<string, unknown>, at: string[]): void {
    const value = owner[at[at.length - 1]];
    if (value !== undefined && !PLACEMENTS.includes(value as Placement)) this.expected(at, `expected one of ${PLACEMENTS.map(p => `"${p}"`).join(', ')}`, value);
  }

  /** An optional decoration colour — a string, and with `strict` one of the forms every canvas reads. */
  optionalColor(owner: Record<string, unknown>, at: string[]): void {
    const value = owner[at[at.length - 1]];
    if (value === undefined) return;
    if (typeof value !== 'string') this.expected(at, 'expected a string', value);
    else if (this.strict && !isDrawingColor(value)) this.fail(at, `"${value}" is not a colour a canvas reads — use ${DRAWING_COLOR_FORMS}`);
  }

  get issueCount(): number {
    return this.issues.length;
  }

  id(owner: Record<string, unknown>, at: string[]): void {
    const id = owner[at[at.length - 1]];
    if (typeof id !== 'string') {
      this.expected(at, 'expected a string', id);
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
      this.expected(at, `expected a whole number from 1 to ${columns}`, value);
    }
  }

  fail(at: string[], message: string): void {
    this.issues.push({ path: pointer(at), message });
  }

  /** A value of the wrong kind: what was expected, and what came — a writer (a model above all) does not re-read what
   *  it sent, so "expected true or false" alone reads as a mystery when it sent `{"enum":["false"]}`. */
  expected(at: string[], expectation: string, value: unknown): void {
    this.fail(at, `${expectation} — ${received(value)}`);
  }

  isRecordAt(value: unknown, at: string[]): value is Record<string, unknown> {
    if (isRecord(value)) return true;
    this.expected(at, 'expected an object', value);
    return false;
  }

  record(owner: Record<string, unknown>, at: string[]): boolean {
    return this.isRecordAt(owner[at[at.length - 1]], at);
  }

  array(owner: Record<string, unknown>, at: string[]): boolean {
    if (Array.isArray(owner[at[at.length - 1]])) return true;
    this.expected(at, 'expected an array', owner[at[at.length - 1]]);
    return false;
  }

  string(owner: Record<string, unknown>, at: string[]): void {
    if (typeof owner[at[at.length - 1]] !== 'string') this.expected(at, 'expected a string', owner[at[at.length - 1]]);
  }

  optionalString(owner: Record<string, unknown>, at: string[]): void {
    if (owner[at[at.length - 1]] !== undefined) this.string(owner, at);
  }

  number(owner: Record<string, unknown>, at: string[]): void {
    if (!Number.isFinite(owner[at[at.length - 1]])) this.expected(at, 'expected a finite number', owner[at[at.length - 1]]);
  }

  optionalNumber(owner: Record<string, unknown>, at: string[]): void {
    if (owner[at[at.length - 1]] !== undefined) this.number(owner, at);
  }
}

/** A short account of a value, for an error: what kind it is and the start of it. */
function received(value: unknown): string {
  if (value === undefined) return 'it is missing';
  const text = (json: string) => (json.length > 60 ? `${json.slice(0, 57)}…` : json);
  if (Array.isArray(value)) return `got a list of ${value.length}${value.length ? `: ${text(JSON.stringify(value))}` : ''}`;
  if (typeof value === 'object' && value !== null) return `got an object ${text(JSON.stringify(value))}`;
  if (typeof value === 'string') return `got the text ${text(JSON.stringify(value))}`;
  return `got ${String(value)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pointer(segments: string[]): string {
  return segments.map(s => '/' + s.replace(/~/g, '~0').replace(/\//g, '~1')).join('');
}
