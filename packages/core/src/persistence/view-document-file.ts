import type { ViewDocument } from '../view-document.js';
import { validateViewDocument, type ViewDocumentIssue } from '../validate-view-document.js';

/** Thrown when a file selected for import isn't a ViewDocument — the file-open boundary is one of
 * the places untrusted input enters (docs/architecture.md — internal data is trusted; a file picked
 * by the author could be anything). `issues` says what is wrong and where. */
export class InvalidViewDocumentError extends Error {
  constructor(message: string, readonly issues: ViewDocumentIssue[] = []) {
    super(message);
  }
}

export function serializeViewDocument(doc: ViewDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Parses a ViewDocument from file contents (JSON text) and validates it with
 * `validateViewDocument` — every structural problem is rejected here rather than surfacing later
 * as a crash in a renderer or route that trusted the type. */
export function parseViewDocument(text: string): ViewDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new InvalidViewDocumentError('File is not valid JSON.');
  }

  const issues = validateViewDocument(value);
  if (issues.length > 0) {
    const [first] = issues;
    const more = issues.length > 1 ? ` (and ${issues.length - 1} more)` : '';
    throw new InvalidViewDocumentError(
      `File is not a valid view document: ${first.path || 'document'} — ${first.message}${more}.`,
      issues
    );
  }

  return value as ViewDocument;
}
