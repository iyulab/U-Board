import { describe, it, expect } from 'vitest';
import { serializeViewDocument, parseViewDocument, InvalidViewDocumentError } from './view-document-file';
import type { ViewDocument } from '../view-document';

function doc(overrides: Partial<ViewDocument> = {}): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [], ...overrides };
}

describe('serializeViewDocument / parseViewDocument', () => {
  it('round-trips a document unchanged', () => {
    const original = doc({
      background: { image: { src: 'plan.png', width: 800, height: 600 } },
      nodes: [{ id: 'n1', x: 10, y: 20, anchored: true, widget: { type: 'status', props: { data: { label: 'A', level: 'success', value: 'x' } } } }],
      connectors: [],
    });

    const restored = parseViewDocument(serializeViewDocument(original));
    expect(restored).toEqual(original);
  });

  it('rejects text that is not valid JSON', () => {
    expect(() => parseViewDocument('{not json')).toThrow(InvalidViewDocumentError);
  });

  it('rejects valid JSON that lacks the ViewDocument shape', () => {
    expect(() => parseViewDocument(JSON.stringify({ hello: 'world' }))).toThrow(InvalidViewDocumentError);
  });

  it('rejects a document with the wrong kind', () => {
    expect(() => parseViewDocument(JSON.stringify({ ...doc(), kind: 'grid' }))).toThrow(InvalidViewDocumentError);
  });

  it('rejects a document whose nodes/connectors are not arrays', () => {
    expect(() => parseViewDocument(JSON.stringify({ ...doc(), nodes: 'nope' }))).toThrow(InvalidViewDocumentError);
  });

  it('rejects a node with no widget, even though the top-level shape is otherwise valid', () => {
    const withWidgetlessNode = { ...doc(), nodes: [{ id: 'n1', x: 0, y: 0, anchored: false }] };
    expect(() => parseViewDocument(JSON.stringify(withWidgetlessNode))).toThrow(InvalidViewDocumentError);
  });
});
