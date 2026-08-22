import type { ViewDocument } from '../view-document.js';

/** Thrown when a file selected for import isn't a ViewDocument — the file-open boundary is the
 * one place this app validates untrusted input (docs/architecture.md — internal data is
 * trusted; a file picked by the author could be anything). */
export class InvalidViewDocumentError extends Error {}

export function serializeViewDocument(doc: ViewDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Parses and shape-checks a ViewDocument from file contents. Checks structure only (the
 * top-level fields, plus that each node actually has a `widget`) — not every widget field — matching
 * this app's boundary-only validation policy; a structurally valid but semantically odd document
 * (e.g. an unknown widget type) is a renderer concern, not a parse-time one. `Node.widget` is
 * non-optional in the type, so a node missing it entirely is a structural defect, not a semantic
 * one — letting it through would let `node.widget` accesses elsewhere (e.g. the public share
 * routes) throw on data this function already had the field to reject. */
export function parseViewDocument(text: string): ViewDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new InvalidViewDocumentError('File is not valid JSON.');
  }

  if (!isViewDocumentShape(value)) {
    throw new InvalidViewDocumentError(
      'File is not a ViewDocument (expected kind/background/nodes/connectors).'
    );
  }

  return value;
}

export function isViewDocumentShape(value: unknown): value is ViewDocument {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.kind === 'canvas' &&
    typeof v.background === 'object' &&
    v.background !== null &&
    Array.isArray(v.nodes) &&
    v.nodes.every(hasWidget) &&
    Array.isArray(v.connectors)
  );
}

function hasWidget(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return false;
  const widget = (node as Record<string, unknown>).widget;
  return typeof widget === 'object' && widget !== null;
}
