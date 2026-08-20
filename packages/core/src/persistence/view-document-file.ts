import type { ViewDocument } from '../view-document';

/** Thrown when a file selected for import isn't a ViewDocument — the file-open boundary is the
 * one place this app validates untrusted input (docs/architecture.md — internal data is
 * trusted; a file picked by the author could be anything). */
export class InvalidViewDocumentError extends Error {}

export function serializeViewDocument(doc: ViewDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Parses and shape-checks a ViewDocument from file contents. Checks structure only (the four
 * top-level fields) — not every node/widget field — matching this app's boundary-only validation
 * policy; a structurally valid but semantically odd document (e.g. an unknown widget type) is a
 * renderer concern, not a parse-time one. */
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
    Array.isArray(v.connectors)
  );
}
