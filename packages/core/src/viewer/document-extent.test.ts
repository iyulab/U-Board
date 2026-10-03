import { describe, it, expect } from 'vitest';
import { documentExtent } from './document-extent';
import { DEFAULT_NODE_HEIGHT } from '../layout-defaults';
import type { ViewDocument } from '../view-document';

function doc(partial: Partial<ViewDocument>): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [], ...partial };
}

function node(id: string, x: number, y: number, size?: { width: number; height: number }) {
  return { id, x, y, ...size, anchored: false, widget: { type: 'uw-status' } };
}

describe('documentExtent', () => {
  it('is null for a document with nothing to show', () => {
    expect(documentExtent(doc({}))).toBeNull();
  });

  it('is the background image rect when the content lies on it', () => {
    const d = doc({
      background: { image: { src: 'bg.png', width: 1200, height: 800 } },
      nodes: [node('n1', 100, 100)],
    });
    expect(documentExtent(d)).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
  });

  it('spans nodes at their default footprint when they carry no size of their own', () => {
    const d = doc({ nodes: [node('n1', 10, 20), node('n2', 300, 400, { width: 50, height: 60 })] });
    expect(documentExtent(d)).toEqual({ x: 10, y: 20, width: 340, height: 440 });
  });

  it('grows past the background to include content placed outside it', () => {
    const d = doc({
      background: { image: { src: 'bg.png', width: 400, height: 300 } },
      nodes: [node('n1', -50, 250)],
    });
    expect(documentExtent(d)).toEqual({ x: -50, y: 0, width: 450, height: 250 + DEFAULT_NODE_HEIGHT });
  });

  it('includes rect decorations and the anchor point of text decorations', () => {
    const d = doc({
      decorations: [
        { id: 'r', type: 'rect', x: 0, y: 0, width: 200, height: 100 },
        { id: 't', type: 'text', x: 500, y: 300, text: 'Line A' },
      ],
    });
    expect(documentExtent(d)).toEqual({ x: 0, y: 0, width: 500, height: 300 });
  });
});
