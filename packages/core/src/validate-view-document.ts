import type { ViewDocument } from './view-document.js';

/** One way a value fails to be a `ViewDocument`: where (an RFC 6901 JSON Pointer into the value,
 * `""` for the value itself) and what was expected there. */
export interface ViewDocumentIssue {
  path: string;
  message: string;
}

/**
 * Checks that `value` has every field the `ViewDocument` type promises, at every level — the
 * nodes, each widget and binding in them, connectors, decorations and the background. Returns
 * every problem found (empty when the value is a valid document), so a caller can say exactly what
 * to fix rather than only that something is wrong.
 *
 * Structure only. It does not interpret what the format leaves opaque — a binding's `ref` belongs
 * to its adapter, a widget's `type` and `props` to its widget library — and it does not judge
 * references between parts of a document (a connector naming a node that is not there is drawn as
 * nothing, not rejected). Fields it does not know are ignored, so a document written by a newer
 * version still reads.
 */
export function validateViewDocument(value: unknown): ViewDocumentIssue[] {
  const issues: ViewDocumentIssue[] = [];
  const doc = new Checker(issues);

  if (!isRecord(value)) {
    issues.push({ path: '', message: 'expected a view document object' });
    return issues;
  }
  if (value.kind !== 'canvas') doc.fail(['kind'], 'expected "canvas"');

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

  if (value.appearance !== undefined && value.appearance !== 'light' && value.appearance !== 'dark') {
    doc.fail(['appearance'], 'expected "light" or "dark"');
  }

  if (doc.array(value, ['nodes'])) {
    (value.nodes as unknown[]).forEach((node, i) => checkNode(doc, node, ['nodes', String(i)]));
  }
  if (doc.array(value, ['connectors'])) {
    (value.connectors as unknown[]).forEach((connector, i) => {
      const at = ['connectors', String(i)];
      if (!doc.isRecordAt(connector, at)) return;
      doc.string(connector, [...at, 'id']);
      doc.string(connector, [...at, 'fromNodeId']);
      doc.string(connector, [...at, 'toNodeId']);
    });
  }
  if (value.decorations !== undefined && doc.array(value, ['decorations'])) {
    (value.decorations as unknown[]).forEach((shape, i) => checkShape(doc, shape, ['decorations', String(i)]));
  }

  return issues;
}

/** True when `value` is a valid `ViewDocument` — `validateViewDocument` found nothing. */
export function isViewDocumentShape(value: unknown): value is ViewDocument {
  return validateViewDocument(value).length === 0;
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
  doc.string(node, [...at, 'id']);
  doc.number(node, [...at, 'x']);
  doc.number(node, [...at, 'y']);
  doc.optionalNumber(node, [...at, 'width']);
  doc.optionalNumber(node, [...at, 'height']);
  if (typeof node.anchored !== 'boolean') doc.fail([...at, 'anchored'], 'expected true or false');

  if (!doc.record(node, [...at, 'widget'])) return;
  const widget = node.widget as Record<string, unknown>;
  doc.string(widget, [...at, 'widget', 'type']);
  if (widget.props !== undefined) doc.record(widget, [...at, 'widget', 'props']);
  if (widget.bindings === undefined || !doc.record(widget, [...at, 'widget', 'bindings'])) return;

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
  doc.string(shape, [...at, 'id']);
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
  constructor(private readonly issues: ViewDocumentIssue[]) {}

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
