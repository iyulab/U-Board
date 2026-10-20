import { CONNECTOR_ARROWS, CONNECTOR_BINDABLE, CONNECTOR_ROUTES, PLACEMENTS, STROKE_DASHES, GRID_COLUMNS, GRID_COLUMNS_MEDIUM, GRID_MAX_ROW_SPAN, TRIGGER_ACTIONS, TRIGGER_EVENTS, isTriggerLink, type ConnectorArrow, type ConnectorRoute, type Placement, type StrokeDash } from './view-document.js';
import type { ElementDefinition, PropsSchema } from './view-document.js';
import { ELEMENT_NAME, elementNameOf } from './elements/element-type.js';
import { parseTemplate } from './elements/template.js';
import { checkStyle, checkTemplateMarkup, isResourceOrigin } from './elements/markup-policy.js';
import { checkPropsSchema, checkPropsValue } from './elements/props-schema.js';
import { VIEW_BOX, symbolReferences } from './elements/symbols.js';
import { DRAWING_COLOR_FORMS, isDrawingColor } from './css-color.js';
import { THEME_COLORS, isThemeColor } from './theme-colors.js';
import { isLabelPattern, labelNamesValue, labelPatternError } from './connector-label.js';
import { instancePartId, instanceParts, parameterValues, placeholdersIn } from './components.js';
import type { ComponentDefinition, ComponentInstance } from './view-document.js';

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
  doc.optionalColor(value, ['accent']);
  if (doc.strict && isThemeColor(value.accent)) doc.fail(['accent'], `the board's accent is a colour itself — a theme name (${THEME_COLORS.join(', ')}) goes where a part is coloured`);
  // Before the elements: a template's `<use href="#…">` is checked against the symbols the board defines.
  if (value.symbols !== undefined && doc.record(value, ['symbols'])) checkSymbols(doc, value.symbols as Record<string, unknown>);
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

  if ((value.kind === 'canvas' || value.kind === 'grid') && value.triggers !== undefined && doc.array(value, ['triggers'])) {
    checkTriggers(doc, value.triggers as unknown[], value.kind, [...(value.kind === 'canvas' ? partIds(value.nodes) : gridPartIds(value.items)), ...doc.instanceNodeIds]);
  }

  return issues;
}

/** The fields each part of a document has — what `strict` holds a written document to. */
const CANVAS_FIELDS = ['kind', 'appearance', 'accent', 'elements', 'symbols', 'background', 'nodes', 'connectors', 'decorations', 'triggers', 'components', 'instances'];
const GRID_FIELDS = ['kind', 'appearance', 'accent', 'elements', 'symbols', 'columns', 'items', 'triggers'];
const NODE_FIELDS = ['id', 'x', 'y', 'width', 'height', 'anchored', 'caption', 'widget', 'states'];
const GRID_ITEM_FIELDS = ['id', 'span', 'spanMedium', 'rowSpan', 'height', 'widget', 'states'];
// `widget` is known so that holding both is said once, as that — not also as a field a canvas cell lacks.
const GRID_CANVAS_ITEM_FIELDS = ['id', 'span', 'spanMedium', 'rowSpan', 'height', 'canvas', 'widget'];
const CELL_CANVAS_FIELDS = ['background', 'nodes', 'connectors', 'decorations'];
const CELL_CANVAS_HINT = `A canvas cell is { id, canvas: { background, nodes, connectors, decorations }, span, spanMedium, rowSpan, height } — the board's elements, symbols and triggers stay on the board.`;
const CONNECTOR_FIELDS = ['id', 'fromNodeId', 'toNodeId', 'label', 'labelAt', 'style', 'bindings'];
const CONNECTOR_STYLE_FIELDS = ['stroke', 'strokeWidth', 'dash', 'arrow', 'route'];
const RECT_FIELDS = ['id', 'type', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'radius', 'dash', 'label', 'labelAt', 'labelSize', 'labelFill'];
const TEXT_FIELDS = ['id', 'type', 'x', 'y', 'text', 'fontSize', 'fill', 'anchor', 'background'];
const SYMBOL_FIELDS = ['viewBox', 'markup'];
const WIDGET_FIELDS = ['type', 'props', 'bindings'];
const BINDING_FIELDS = ['adapter', 'ref', 'map'];
const VALUE_MAP_FIELDS = ['values', 'ranges', 'otherwise'];
const RANGE_FIELDS = ['min', 'max', 'value'];
const STATES_FIELDS = ['from', 'map', 'looks'];
const STATE_LOOK_FIELDS = ['outline', 'blink', 'hidden'];
const STATES_HINT = 'A state is named from one binding of this widget: { from: "<its binding key>", map: { values, ranges, otherwise }, looks: { "<state>": { outline, blink, hidden } } }.';
const BACKGROUND_FIELDS = ['image'];
const IMAGE_FIELDS = ['src', 'width', 'height', 'referencePoints'];
const ELEMENT_FIELDS = ['render', 'props', 'template', 'script', 'style', 'size', 'resources'];
const COMPONENT_FIELDS = ['params', 'nodes', 'connectors', 'decorations'];
const COMPONENT_NODE_FIELDS = NODE_FIELDS.filter(field => field !== 'anchored');
const INSTANCE_FIELDS = ['id', 'component', 'x', 'y', 'anchored', 'params'];
const COMPONENT_HINT = 'A component is { params, nodes, connectors, decorations } — its parts placed from its own origin; an instance { id, component, x, y, anchored, params } draws it.';

/** A canvas view's spatial layer — or, at `at`, a grid's canvas cell, which has only that layer: its components are
 *  the board's, and a cell has none. */
function checkCanvasView(doc: Checker, value: Record<string, unknown>, at: string[] = []): void {
  if (doc.record(value, [...at, 'background'])) {
    const background = value.background as Record<string, unknown>;
    const bg = [...at, 'background'];
    doc.known(background, bg, BACKGROUND_FIELDS, 'background');
    if (background.image !== undefined && doc.record(background, [...bg, 'image'])) {
      const image = background.image as Record<string, unknown>;
      doc.known(image, [...bg, 'image'], IMAGE_FIELDS, 'background image');
      doc.string(image, [...bg, 'image', 'src']);
      doc.number(image, [...bg, 'image', 'width']);
      doc.number(image, [...bg, 'image', 'height']);
      if (image.referencePoints !== undefined) checkReferencePoints(doc, image.referencePoints, [...bg, 'image', 'referencePoints']);
    }
  }

  const nodeIds = new Set<string>();
  if (doc.array(value, [...at, 'nodes'])) {
    (value.nodes as unknown[]).forEach((node, i) => {
      checkNode(doc, node, [...at, 'nodes', String(i)]);
      if (isRecord(node) && typeof node.id === 'string') nodeIds.add(node.id);
    });
  }
  const cell = at.length > 0;
  if (!cell) {
    if (value.components !== undefined && doc.record(value, ['components'])) checkComponents(doc, value.components as Record<string, unknown>);
    if (value.instances !== undefined && doc.array(value, ['instances'])) {
      (value.instances as unknown[]).forEach((instance, i) => checkInstance(doc, instance, ['instances', String(i)]));
    }
    for (const id of doc.instanceNodeIds) nodeIds.add(id);
  }
  if (doc.array(value, [...at, 'connectors'])) {
    const where = cell ? `${pointer([...at, 'nodes'])} — the same cell` : doc.instanceNodeIds.length > 0 ? '/nodes or of an instance (<instance id>/<part id>)' : '/nodes';
    (value.connectors as unknown[]).forEach((connector, i) => checkConnector(doc, connector, [...at, 'connectors', String(i)], nodeIds, where));
  }
  if (value.decorations !== undefined && doc.array(value, [...at, 'decorations'])) {
    (value.decorations as unknown[]).forEach((shape, i) => checkShape(doc, shape, [...at, 'decorations', String(i)]));
  }
}

/** A connector — of the board, or of a component (`nodeIds` the nodes it may join, `nodesWhere` where they are). */
function checkConnector(doc: Checker, connector: unknown, at: string[], nodeIds: ReadonlySet<string>, nodesWhere: string, params: ReadonlySet<string> = new Set()): void {
  if (!doc.isRecordAt(connector, at)) return;
  doc.known(connector, at, CONNECTOR_FIELDS, 'connector', CONNECTOR_HINT);
  doc.id(connector, [...at, 'id']);
  for (const end of ['fromNodeId', 'toNodeId']) {
    if (typeof connector[end] !== 'string') doc.expected([...at, end], 'expected a string', connector[end]);
    else if (!nodeIds.has(connector[end] as string)) doc.fail([...at, end], `no node has the id "${connector[end] as string}" — a connector joins two nodes of ${nodesWhere}`);
  }
  doc.optionalString(connector, [...at, 'label']);
  if (doc.strict && isLabelPattern(connector.label as string | undefined)) {
    const error = labelPatternError(connector.label as string, params);
    if (error) doc.fail([...at, 'label'], error);
    else if (labelNamesValue(connector.label as string, params) && !(isRecord(connector.bindings) && connector.bindings.label !== undefined)) {
      doc.fail([...at, 'label'], '{{value}} is filled by a binding of label — add bindings.label, or write the label without it');
    }
  }
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
    if (style.route !== undefined && !CONNECTOR_ROUTES.includes(style.route as ConnectorRoute)) {
      doc.fail([...at, 'style', 'route'], 'expected "straight" or "orthogonal" (out of the facing side, one turn, into the other)');
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
}

function checkGridView(doc: Checker, value: Record<string, unknown>): void {
  if (value.columns !== undefined && value.columns !== GRID_COLUMNS) doc.fail(['columns'], `expected ${GRID_COLUMNS}`);
  if (!doc.array(value, ['items'])) return;
  (value.items as unknown[]).forEach((item, i) => {
    const at = ['items', String(i)];
    if (!doc.isRecordAt(item, at)) return;
    const holdsCanvas = item.canvas !== undefined;
    doc.known(item, at, holdsCanvas ? GRID_CANVAS_ITEM_FIELDS : GRID_ITEM_FIELDS, holdsCanvas ? 'grid canvas cell' : 'grid item', holdsCanvas ? CELL_CANVAS_HINT : undefined);
    doc.id(item, [...at, 'id']);
    doc.optionalSpan(item, [...at, 'span'], GRID_COLUMNS);
    doc.optionalSpan(item, [...at, 'spanMedium'], GRID_COLUMNS_MEDIUM);
    doc.optionalSpan(item, [...at, 'rowSpan'], GRID_MAX_ROW_SPAN);
    if (item.height !== undefined && !(Number.isFinite(item.height) && (item.height as number) > 0)) {
      doc.expected([...at, 'height'], 'expected a number greater than 0', item.height);
    }
    if (holdsCanvas) {
      // A cell holds a widget or a canvas — not both.
      if (item.widget !== undefined) doc.fail([...at, 'widget'], 'a grid item holds a widget or a canvas, not both — move the widget into the canvas as a node, or into an item of its own');
      if (doc.record(item, [...at, 'canvas'])) {
        const canvas = item.canvas as Record<string, unknown>;
        doc.known(canvas, [...at, 'canvas'], CELL_CANVAS_FIELDS, 'canvas cell', CELL_CANVAS_HINT);
        checkCanvasView(doc, canvas, [...at, 'canvas']);
      }
      return;
    }
    checkWidget(doc, item, at);
    if (item.states !== undefined && doc.record(item, [...at, 'states'])) checkStates(doc, item.states as Record<string, unknown>, item.widget, [...at, 'states']);
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
  if (node.states !== undefined && doc.record(node, [...at, 'states'])) checkStates(doc, node.states as Record<string, unknown>, node.widget, [...at, 'states']);
}

/** The widget of a node or grid item — `at` is the path of the one that carries it. In a component its element props
 *  are not checked here (`elementProps: false`): a parameter fills them, so each instance checks them filled in. */
function checkWidget(doc: Checker, placed: Record<string, unknown>, at: string[], { elementProps = true } = {}): void {
  if (!doc.record(placed, [...at, 'widget'])) return;
  const widget = placed.widget as Record<string, unknown>;
  doc.known(widget, [...at, 'widget'], WIDGET_FIELDS, 'widget', WIDGET_HINT);
  doc.string(widget, [...at, 'widget', 'type']);
  const propsAreRecord = widget.props === undefined || doc.record(widget, [...at, 'widget', 'props']);
  const bindingsAreRecord = widget.bindings === undefined || doc.record(widget, [...at, 'widget', 'bindings']);
  if (typeof widget.type === 'string' && propsAreRecord && bindingsAreRecord) checkElementUse(doc, widget, at, { props: elementProps });
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
    if (!isRecord(definition) && ELEMENT_FIELDS.includes(name)) {
      // `{ "pump": { … }, "template": "<…>" }` — a field of a definition written one level too high.
      doc.expected(at, `expected an element definition — "${name}" is a field of one: put it inside its element, /elements/<name>/${name}`, definition);
      continue;
    }
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

function checkSymbols(doc: Checker, symbols: Record<string, unknown>): void {
  for (const [name, symbol] of Object.entries(symbols)) {
    const at = ['symbols', name];
    if (!ELEMENT_NAME.test(name)) doc.fail(at, 'expected a name of lowercase letters, digits and hyphens, starting with a letter (at most 40) — it is the id a <use href="#…"> places');
    if (!doc.isRecordAt(symbol, at)) continue;
    doc.symbols.add(name);
    doc.known(symbol, at, SYMBOL_FIELDS, 'symbol');
    if (symbol.viewBox !== undefined && !(typeof symbol.viewBox === 'string' && VIEW_BOX.test(symbol.viewBox))) {
      doc.expected([...at, 'viewBox'], 'expected four numbers, "min-x min-y width height", such as "0 0 24 24"', symbol.viewBox);
    }
    if (typeof symbol.markup !== 'string') {
      doc.expected([...at, 'markup'], 'expected SVG markup', symbol.markup);
      continue;
    }
    if (symbol.markup.includes('{{')) doc.fail([...at, 'markup'], 'a symbol has no values — let the element choose between symbols instead: href="#state-{{state}}"');
    for (const issue of checkTemplateMarkup(symbol.markup, [])) doc.fail([...at, 'markup'], issue.message);
  }
}

/** Whether markup gives a part of itself `id="name"`. */
function definesId(markup: string, name: string): boolean {
  return markup.includes(`id="${name}"`) || markup.includes(`id='${name}'`);
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
      for (const name of symbolReferences(definition.template)) {
        if (name.includes('{{') || doc.symbols.has(name) || definesId(definition.template, name)) continue;
        doc.fail([...at, 'template'], `<use href="#${name}">: no symbol "${name}" — define it in symbols, or give a part of this template id="${name}"`);
      }
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
 *  binding fills is taken as given — its value arrives at render time. `props: false` checks only that the element is
 *  defined; `defined: false` only its props, each issue followed by `context`. */
function checkElementUse(doc: Checker, widget: Record<string, unknown>, at: string[], { props = true, defined = true, context = '' } = {}): void {
  const name = elementNameOf(widget.type as string);
  if (name === undefined) return;
  const typeAt = [...at, 'widget', 'type'];
  if (!doc.elements.has(name)) {
    if (defined) doc.fail(typeAt, ELEMENT_NAME.test(name) ? `no element "${name}" is defined — add it under /elements` : 'expected "element:" followed by an element name');
    return;
  }
  const definition = doc.elements.get(name);
  if (!props || !definition?.props) return;
  const keys = Object.keys((widget.bindings as Record<string, unknown> | undefined) ?? {});
  // A key that starts with "props." writes into props.props — the element never sees it.
  const declared = definition.props.properties ?? {};
  for (const key of keys) {
    if (key.startsWith('props.') && !('props' in declared)) {
      doc.fail([...at, 'widget', 'bindings', key], `a binding's key is the path inside the element's props — "${key.slice('props.'.length)}", not "${key}"${context}`);
    }
  }
  const filled = new Set(keys.map(key => key.split('.')[0]));
  for (const issue of checkPropsValue(definition.props, widget.props ?? {}, filled)) doc.fail([...at, 'widget', 'props', ...issue.at], issue.message + context);
}

/** Where a component keeps each kind of part. */
const COMPONENT_PARTS = ['nodes', 'connectors', 'decorations'] as const;
/** A parameter's name — the `{{name}}` its parts use. */
const PARAM_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
/** The fields that name a part, which a parameter never fills. */
const PART_NAMING_FIELDS = ['id', 'fromNodeId', 'toNodeId'];

/** `{{value}}` in a component connector's bound label — the binding's value, not a parameter (unless one is named so). */
function isBoundLabelValue(list: string, part: unknown, use: { name: string; at: string[] }, partDepth: number, params: ReadonlySet<string>): boolean {
  return list === 'connectors' && use.name === 'value' && !params.has('value') && use.at.length === partDepth + 1 && use.at[partDepth] === 'label' && isRecord(part) && isRecord(part.bindings) && part.bindings.label !== undefined;
}

/** The components a board defines: each a small canvas of its own — its parts' ids unique among them, its connectors
 *  joining its own nodes — whose texts use only the parameters it declares. A definition that holds is kept for checking
 *  its instances; one that does not is still known by name. */
function checkComponents(doc: Checker, components: Record<string, unknown>): void {
  for (const [name, definition] of Object.entries(components)) {
    const at = ['components', name];
    // A document's own field put one level too deep (instances beside the definitions) reads as a component of that
    // name: say where it belongs, or the writer sends the same document again (a model did, three times).
    if (name !== 'components' && CANVAS_FIELDS.includes(name)) {
      doc.fail(at, `"${name}" is a field of the document, not a component — it goes at /${name}, beside /components`);
      continue;
    }
    if (!ELEMENT_NAME.test(name)) doc.fail(at, 'expected a name of lowercase letters, digits and hyphens, starting with a letter (at most 40)');
    if (!doc.isRecordAt(definition, at)) {
      doc.components.set(name, null);
      continue;
    }
    const before = doc.issueCount;
    doc.known(definition, at, COMPONENT_FIELDS, 'component', COMPONENT_HINT);
    const params = componentParams(doc, definition.params, [...at, 'params']);
    const parts = doc.scoped();
    const nodeIds = new Set<string>();
    if (doc.array(definition, [...at, 'nodes'])) {
      (definition.nodes as unknown[]).forEach((node, i) => {
        checkComponentNode(parts, node, [...at, 'nodes', String(i)]);
        if (isRecord(node) && typeof node.id === 'string') nodeIds.add(node.id);
      });
    }
    doc.componentNodeIds.set(name, [...nodeIds]);
    if (definition.connectors !== undefined && doc.array(definition, [...at, 'connectors'])) {
      (definition.connectors as unknown[]).forEach((connector, i) => checkConnector(parts, connector, [...at, 'connectors', String(i)], nodeIds, pointer([...at, 'nodes']), params));
    }
    if (definition.decorations !== undefined && doc.array(definition, [...at, 'decorations'])) {
      (definition.decorations as unknown[]).forEach((shape, i) => checkShape(parts, shape, [...at, 'decorations', String(i)]));
    }
    for (const list of COMPONENT_PARTS) {
      const items = definition[list];
      if (!Array.isArray(items)) continue;
      items.forEach((part, i) => {
        if (!isRecord(part)) return;
        const partAt = [...at, list, String(i)];
        if (typeof part.id === 'string' && (part.id.includes('/') || part.id.includes('{{'))) {
          doc.fail([...partAt, 'id'], 'expected an id without "/" or {{…}} — each instance names its parts <instance id>/<part id>');
        }
        for (const use of placeholdersIn(part, partAt)) {
          if (PART_NAMING_FIELDS.includes(use.at[use.at.length - 1]) || isBoundLabelValue(list, part, use, partAt.length, params)) continue;
          if (!params.has(use.name)) {
            doc.fail(use.at, `{{${use.name}}}: the component declares no parameter "${use.name}" — ${params.size > 0 ? `it has: ${[...params].join(', ')}` : 'declare it in params'}`);
          }
        }
      });
    }
    doc.components.set(name, doc.issueCount === before ? (definition as unknown as ComponentDefinition) : null);
  }
}

/** The names a component's `params` declares, checked to be an object schema of the props-schema subset. */
function componentParams(doc: Checker, schema: unknown, at: string[]): Set<string> {
  const names = new Set<string>();
  if (schema === undefined) return names;
  const issues = checkPropsSchema(schema);
  for (const issue of issues) doc.fail([...at, ...issue.at], issue.message);
  if (issues.length > 0) return names;
  const { type, properties } = schema as PropsSchema;
  if (type !== 'object') doc.fail([...at, 'type'], 'expected "object" — params is { type: "object", properties: { "<name>": { type, default } }, required }');
  for (const name of Object.keys(properties ?? {})) {
    if (!PARAM_NAME.test(name)) doc.fail([...at, 'properties', name], 'expected a name of letters, digits and underscores, starting with a letter — it is the {{name}} its parts use');
    names.add(name);
  }
  return names;
}

/** A node of a component — a node without `anchored`, which its instance gives. */
function checkComponentNode(doc: Checker, node: unknown, at: string[]): void {
  if (!doc.isRecordAt(node, at)) return;
  doc.known(node, at, COMPONENT_NODE_FIELDS, 'component node', 'Its instance says whether it is anchored.');
  doc.id(node, [...at, 'id']);
  doc.number(node, [...at, 'x']);
  doc.number(node, [...at, 'y']);
  doc.optionalNumber(node, [...at, 'width']);
  doc.optionalNumber(node, [...at, 'height']);
  doc.optionalString(node, [...at, 'caption']);
  checkWidget(doc, node, at, { elementProps: false });
  if (node.states !== undefined && doc.record(node, [...at, 'states'])) checkStates(doc, node.states as Record<string, unknown>, node.widget, [...at, 'states']);
}

/** A component instance: a component the board defines, a value for what its parts use — only parameters it declares,
 *  in the types it declares — and parts whose ids (`<instance id>/<part id>`) no other part of the board has. The
 *  element props its nodes give are checked filled in, at the component's path, naming the instance. */
function checkInstance(doc: Checker, instance: unknown, at: string[]): void {
  if (!doc.isRecordAt(instance, at)) return;
  doc.known(instance, at, INSTANCE_FIELDS, 'instance', COMPONENT_HINT);
  doc.id(instance, [...at, 'id']);
  if (typeof instance.id === 'string' && instance.id.includes('/')) doc.fail([...at, 'id'], 'expected an id without "/" — its parts are named <instance id>/<part id>');
  doc.number(instance, [...at, 'x']);
  doc.number(instance, [...at, 'y']);
  if (typeof instance.anchored !== 'boolean') doc.expected([...at, 'anchored'], 'expected true or false', instance.anchored);
  const paramsAreRecord = instance.params === undefined || doc.record(instance, [...at, 'params']);
  const name = instance.component;
  if (typeof name !== 'string') {
    doc.expected([...at, 'component'], 'expected the name of a component of /components', name);
    return;
  }
  if (!doc.components.has(name)) {
    const names = [...doc.components.keys()];
    doc.fail([...at, 'component'], `no component "${name}" is defined — ${names.length > 0 ? `the board has: ${names.join(', ')}` : 'define it under /components'}`);
    return;
  }
  const definition = doc.components.get(name);
  if (!definition) {
    // The component's own issues are reported at it; its parts' ids still stand, so what names them is not wrong too.
    if (typeof instance.id === 'string') for (const id of doc.componentNodeIds.get(name) ?? []) doc.instanceNodeIds.push(instancePartId(instance.id, id));
    return;
  }
  if (!paramsAreRecord || typeof instance.id !== 'string' || !Number.isFinite(instance.x) || !Number.isFinite(instance.y)) return;

  const given = (instance.params ?? {}) as Record<string, unknown>;
  const declared = definition.params?.properties ?? {};
  for (const key of Object.keys(given)) {
    if (!(key in declared)) {
      const names = Object.keys(declared);
      doc.fail([...at, 'params', key], `the component "${name}" has no parameter "${key}" — ${names.length > 0 ? `it has: ${names.join(', ')}` : 'it takes none'}`);
    }
  }
  const values = parameterValues(definition, { params: given });
  if (definition.params) {
    for (const issue of checkPropsValue(definition.params, values)) doc.fail([...at, 'params', ...issue.at], issue.message.replace('the element requires it', 'the component requires it'));
  }
  const required = new Set(definition.params?.required ?? []);
  const reported = new Set<string>();
  for (const list of COMPONENT_PARTS) {
    ((definition[list] ?? []) as unknown[]).forEach((part, i) => {
      for (const use of placeholdersIn(part, ['components', name, list, String(i)])) {
        if (reported.has(use.name) || PART_NAMING_FIELDS.includes(use.at[use.at.length - 1]) || isBoundLabelValue(list, part, use, 4, new Set(Object.keys(definition.params?.properties ?? {})))) continue;
        const value = values[use.name];
        if (value === undefined && !required.has(use.name)) {
          doc.fail([...at, 'params', use.name], `expected a value — the component "${name}" uses {{${use.name}}} and gives it no default`);
          reported.add(use.name);
        } else if (!use.whole && typeof value === 'object' && value !== null) {
          doc.fail([...at, 'params', use.name], `expected text, a number or true/false — {{${use.name}}} sits inside a text at ${pointer(use.at)}`);
          reported.add(use.name);
        }
      }
    });
  }

  const parts = instanceParts(definition, instance as unknown as ComponentInstance);
  for (const part of [...parts.nodes, ...parts.connectors, ...parts.decorations]) doc.claim(part.id, [...at, 'id']);
  for (const node of parts.nodes) doc.instanceNodeIds.push(node.id);
  parts.nodes.forEach((node, j) => {
    if (isRecord(node.widget) && typeof node.widget.type === 'string') {
      checkElementUse(doc, node.widget as unknown as Record<string, unknown>, ['components', name, 'nodes', String(j)], { defined: false, context: ` — for the instance "${instance.id as string}" (${pointer(at)})` });
    }
  });
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

const TRIGGER_FIELDS = ['on', 'when', 'do'];
const TRIGGER_EVENT_FIELDS: Record<string, string[]> = {
  click: ['event', 'node'],
  element: ['event', 'node', 'name'],
  enter: ['event', 'node', 'state'],
  leave: ['event', 'node', 'state'],
  open: ['event'],
};
const TRIGGER_ACTION_FIELDS: Record<string, string[]> = {
  'open-link': ['action', 'url'],
  focus: ['action', 'node'],
  emit: ['action', 'name'],
  'go-to-board': ['action', 'board'],
};
const TRIGGER_HINT = 'A trigger is { on: { event, node? }, when?: { node, state }, do: [{ action, … }] }.';

/** The ids of the parts a document places — those that are text. */
/** The parts of a grid a trigger can name: its widget items, and the nodes of its canvas cells. */
function gridPartIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap(item => (isRecord(item) && isRecord(item.canvas) ? partIds(item.canvas.nodes) : partIds([item])));
}

function partIds(parts: unknown): string[] {
  return Array.isArray(parts) ? parts.flatMap(part => (isRecord(part) && typeof part.id === 'string' ? [part.id] : [])) : [];
}

/** A board’s triggers: each event and action of a kind it knows, naming parts the board places. */
function checkTriggers(doc: Checker, triggers: unknown[], kind: 'canvas' | 'grid', parts: string[]): void {
  const noun = kind === 'canvas' ? 'node' : 'item';
  const part = (owner: Record<string, unknown>, at: string[]) => {
    const id = owner[at[at.length - 1]];
    if (typeof id !== 'string') doc.expected(at, `expected the id of a ${noun}`, id);
    else if (!parts.includes(id)) doc.fail(at, `"${id}" names no ${noun} — the board has: ${parts.length > 0 ? parts.slice(0, 20).join(', ') : 'none'}`);
  };
  const name = (owner: Record<string, unknown>, at: string[]) => {
    const value = owner[at[at.length - 1]];
    if (typeof value !== 'string' || value.length < 1 || value.length > 64) doc.expected(at, 'expected a name, 1 to 64 characters', value);
  };
  triggers.forEach((trigger, i) => {
    const at = ['triggers', String(i)];
    if (!doc.isRecordAt(trigger, at)) return;
    doc.known(trigger, at, TRIGGER_FIELDS, 'trigger', TRIGGER_HINT);
    if (doc.record(trigger, [...at, 'on'])) {
      const on = trigger.on as Record<string, unknown>;
      const onAt = [...at, 'on'];
      const fields = typeof on.event === 'string' ? TRIGGER_EVENT_FIELDS[on.event] : undefined;
      if (!fields) doc.expected([...onAt, 'event'], `expected one of ${TRIGGER_EVENTS_TEXT}`, on.event);
      else {
        doc.known(on, onAt, fields, `${on.event} event`);
        if (fields.includes('node')) part(on, [...onAt, 'node']);
        if (fields.includes('name')) name(on, [...onAt, 'name']);
        if (fields.includes('state') && (typeof on.state !== 'string' || on.state === '')) doc.expected([...onAt, 'state'], 'expected a state name', on.state);
      }
    }
    if (trigger.when !== undefined && doc.record(trigger, [...at, 'when'])) {
      const when = trigger.when as Record<string, unknown>;
      doc.known(when, [...at, 'when'], ['node', 'state'], 'trigger condition');
      part(when, [...at, 'when', 'node']);
      const states = Array.isArray(when.state) ? when.state : [when.state];
      if (states.length === 0 || !states.every(state => typeof state === 'string' && state !== '')) {
        doc.expected([...at, 'when', 'state'], 'expected a state name, or a list of them', when.state);
      }
    }
    if (!doc.array(trigger, [...at, 'do'])) return;
    const actions = trigger.do as unknown[];
    if (actions.length === 0) doc.fail([...at, 'do'], 'expected at least one action');
    actions.forEach((action, j) => {
      const actionAt = [...at, 'do', String(j)];
      if (!doc.isRecordAt(action, actionAt)) return;
      const fields = typeof action.action === 'string' ? TRIGGER_ACTION_FIELDS[action.action] : undefined;
      if (!fields) {
        doc.expected([...actionAt, 'action'], `expected one of ${TRIGGER_ACTIONS.map(a => `"${a}"`).join(', ')}`, action.action);
        return;
      }
      doc.known(action, actionAt, fields, `${action.action} action`);
      if (action.action === 'open-link' && !isTriggerLink(action.url)) {
        doc.expected([...actionAt, 'url'], 'expected an https:// address or a path on this installation (/…)', action.url);
      }
      if (action.action === 'focus') part(action, [...actionAt, 'node']);
      if (action.action === 'emit') name(action, [...actionAt, 'name']);
      if (action.action === 'go-to-board' && (typeof action.board !== 'string' || action.board === '' || action.board.length > 100)) {
        doc.expected([...actionAt, 'board'], 'expected the id of a board of this workspace', action.board);
      }
    });
  });
}

const TRIGGER_EVENTS_TEXT = TRIGGER_EVENTS.map(e => `"${e}"`).join(', ');

/** A part’s state rule: `from` names one of its widget’s bindings, its map gives state names, each look its fields. */
function checkStates(doc: Checker, rule: Record<string, unknown>, widget: unknown, at: string[]): void {
  doc.known(rule, at, STATES_FIELDS, 'state rule', STATES_HINT);
  const bindings = isRecord(widget) && isRecord(widget.bindings) ? Object.keys(widget.bindings) : [];
  if (typeof rule.from !== 'string') doc.expected([...at, 'from'], 'expected the key of one of this widget’s bindings', rule.from);
  else if (!bindings.includes(rule.from)) {
    doc.fail(
      [...at, 'from'],
      bindings.length > 0
        ? `"${rule.from}" names no binding of this widget — it has: ${bindings.join(', ')}`
        : `"${rule.from}" names no binding — this widget has no bindings; a state is read from one of them`
    );
  }
  if (doc.record(rule, [...at, 'map'])) {
    const map = rule.map as Record<string, unknown>;
    checkValueMap(doc, map, [...at, 'map']);
    checkStateNames(doc, map, [...at, 'map']);
  }
  if (rule.looks === undefined || !doc.record(rule, [...at, 'looks'])) return;
  for (const [name, look] of Object.entries(rule.looks as Record<string, unknown>)) {
    const lookAt = [...at, 'looks', name];
    if (!doc.isRecordAt(look, lookAt)) continue;
    doc.known(look, lookAt, STATE_LOOK_FIELDS, 'state look');
    doc.optionalColor(look, [...lookAt, 'outline']);
    doc.optionalBoolean(look, [...lookAt, 'blink']);
    doc.optionalBoolean(look, [...lookAt, 'hidden']);
  }
}

/** Every value a state rule’s map gives is a state’s name: text, not empty. */
function checkStateNames(doc: Checker, map: Record<string, unknown>, at: string[]): void {
  const name = (value: unknown, where: string[]) => {
    if (typeof value !== 'string' || value === '') doc.expected(where, 'expected a state name (text, not empty)', value);
  };
  if (isRecord(map.values)) for (const [key, value] of Object.entries(map.values)) name(value, [...at, 'values', key]);
  if (Array.isArray(map.ranges)) {
    map.ranges.forEach((range, i) => {
      if (isRecord(range) && 'value' in range) name(range.value, [...at, 'ranges', String(i), 'value']);
    });
  }
  if ('otherwise' in map) name(map.otherwise, [...at, 'otherwise']);
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
    doc.optionalColor(shape, [...at, 'labelFill']);
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
const CONNECTOR_HINT = 'Its text goes in label (labelAt places it along the line), its colour, width, dash, arrowheads and the way it runs in style: { stroke, strokeWidth, dash, arrow, route }.';
const SHAPE_HINT = 'A frame’s name is its label (labelAt places it inside the frame); a text’s background fills a box behind it.';
const WIDGET_HINT = 'A prepared widget’s data, mapping and options go inside props.';

/** Field checks that record an issue at a path and report whether the field passed. The last
 * path segment names the field read from the given object. */
class Checker {
  /** Where each id was first seen — ids are unique across the whole document. */
  private readonly ids = new Map<string, string>();
  /** The elements the document defines: the definition when it holds, `null` when it is defined but does not. */
  readonly elements: Map<string, ElementDefinition | null>;
  /** The symbols the document defines. */
  readonly symbols: Set<string>;
  /** The components the document defines: the definition when it holds, `null` when it is defined but does not. */
  readonly components: Map<string, ComponentDefinition | null>;
  /** The ids the nodes of component instances are drawn with — nodes a connector or a trigger may name. */
  readonly instanceNodeIds: string[] = [];
  /** The ids of each component's nodes, kept even when the component does not hold — so a line or a trigger naming a
   *  part of one of its instances is not also reported as naming nothing. */
  readonly componentNodeIds: Map<string, string[]>;

  constructor(
    private readonly issues: ViewDocumentIssue[],
    readonly strict: boolean,
    shared?: Checker
  ) {
    this.elements = shared?.elements ?? new Map();
    this.symbols = shared?.symbols ?? new Set();
    this.components = shared?.components ?? new Map();
    this.componentNodeIds = shared?.componentNodeIds ?? new Map();
  }

  /** A checker for a component's parts: the same issues, elements and symbols, ids of its own. */
  scoped(): Checker {
    return new Checker(this.issues, this.strict, this);
  }

  /** An instance's part takes `id` — reported at `at` when another part of the document has it. */
  claim(id: string, at: string[]): void {
    const first = this.ids.get(id);
    if (first === undefined) this.ids.set(id, pointer(at.slice(0, -1)));
    else this.fail(at, `one of its parts takes the id "${id}", which ${first} has — give the instance or the part another id`);
  }

  /** With `strict`: every field of `owner` is one of `fields` — the place at `at`, called `noun`. */
  known(owner: Record<string, unknown>, at: string[], fields: readonly string[], noun: string, hint?: string): void {
    if (!this.strict) return;
    for (const key of Object.keys(owner)) {
      if (!fields.includes(key)) {
        const a = /^[aeiou]/.test(noun) ? 'an' : 'a';
        this.fail([...at, key], `${a} ${noun} has no "${key}" — it would be kept but never drawn. ${a === 'an' ? 'An' : 'A'} ${noun} has: ${fields.join(', ')}.${hint ? ` ${hint}` : ''}`);
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
    else if (this.strict && !isDrawingColor(value) && !isThemeColor(value)) {
      this.fail(at, `"${value}" is not a colour a canvas reads — use ${DRAWING_COLOR_FORMS}, or a theme colour: ${THEME_COLORS.map(name => `"${name}"`).join(', ')}`);
    }
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

  optionalBoolean(owner: Record<string, unknown>, at: string[]): void {
    const value = owner[at[at.length - 1]];
    if (value !== undefined && typeof value !== 'boolean') this.expected(at, 'expected true or false', value);
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
