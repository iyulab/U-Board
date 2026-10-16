import type { CanvasView, Node } from './view-document.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './layout-defaults.js';
import { elementNameOf } from './elements/element-type.js';

/** A box's settled size. */
export interface BoxSize {
  width: number;
  height: number;
}

/** A node whose box has its size settled (`sizedNodes`) — what everything that draws or measures a node takes. */
export type SizedNode = Node & BoxSize;

/**
 * A node's box: its own `width` and `height`; where it gives none, the `size` of the element it places — an element
 * declares its size as an image has its own — and otherwise {@link DEFAULT_NODE_WIDTH} × {@link DEFAULT_NODE_HEIGHT}.
 * Each axis on its own: a node may give its width and take its element's height.
 */
export function nodeSize(node: Pick<Node, 'width' | 'height' | 'widget'>, elements: CanvasView['elements']): BoxSize {
  const name = elementNameOf(node.widget.type);
  const own = name !== undefined && elements && Object.hasOwn(elements, name) ? elements[name].size : undefined;
  return { width: node.width ?? own?.width ?? DEFAULT_NODE_WIDTH, height: node.height ?? own?.height ?? DEFAULT_NODE_HEIGHT };
}

/** The board's nodes with their boxes' sizes settled — the one place a size left out is decided (`nodeSize`). */
export function sizedNodes<N extends Pick<Node, 'width' | 'height' | 'widget'>>(doc: { nodes: readonly N[]; elements?: CanvasView['elements'] }): Array<N & BoxSize> {
  return doc.nodes.map(node => (node.width !== undefined && node.height !== undefined ? (node as N & BoxSize) : { ...node, ...nodeSize(node, doc.elements) }));
}
