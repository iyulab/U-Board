import { describe, it, expect } from 'vitest';
import { nodeSize, sizedNodes } from './node-size';
import { lintGeometry } from './lint-geometry';
import type { CanvasView, Node } from './view-document';

const icon = { render: 'template' as const, template: '<svg viewBox="0 0 24 24"></svg>', size: { width: 34, height: 34 } };
const node = (id: string, x: number, change: Partial<Node> = {}): Node => ({ id, x, y: 0, anchored: false, widget: { type: 'element:icon' }, ...change });

describe('nodeSize', () => {
  it('takes the node’s own size, else the size of the element it places, else 160 × 100 — each axis on its own', () => {
    const elements = { icon, bare: { render: 'template' as const, template: '<b></b>' } };
    expect(nodeSize(node('a', 0), elements)).toEqual({ width: 34, height: 34 });
    expect(nodeSize(node('a', 0, { width: 120 }), elements)).toEqual({ width: 120, height: 34 });
    expect(nodeSize(node('a', 0, { widget: { type: 'element:bare' } }), elements)).toEqual({ width: 160, height: 100 });
    expect(nodeSize(node('a', 0, { widget: { type: 'element:missing' } }), elements)).toEqual({ width: 160, height: 100 });
    expect(nodeSize(node('a', 0, { widget: { type: 'gauge' } }), elements)).toEqual({ width: 160, height: 100 });
    // A name the board does not define as its own — not one inherited by every object.
    expect(nodeSize(node('a', 0, { widget: { type: 'element:constructor' } }), elements)).toEqual({ width: 160, height: 100 });
  });

  it('settles every node’s box, keeping a node that gives its own as it is', () => {
    const sized = node('b', 0, { width: 10, height: 20 });
    const nodes = sizedNodes({ nodes: [node('a', 0), sized], elements: { icon } });
    expect(nodes[0]).toMatchObject({ width: 34, height: 34 });
    expect(nodes[1]).toBe(sized);
  });

  it('is what the layout advice measures: icons 40 apart do not overlap, though default boxes would', () => {
    const doc: CanvasView = { kind: 'canvas', background: {}, connectors: [], elements: { icon }, nodes: [node('a', 0), node('b', 40)] };
    expect(lintGeometry(doc)).toEqual([]);
    const { elements: _elements, ...withoutSize } = doc;
    expect(lintGeometry({ ...withoutSize, elements: { icon: { ...icon, size: undefined } } }).length).toBeGreaterThan(0);
  });
});
