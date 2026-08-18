/** A node's footprint when its own width/height weren't set — shared by every consumer that
 * needs to know a node's on-screen extent (the renderer, the authoring scene mapping) so they
 * never compute it independently and drift apart. */
export const DEFAULT_NODE_WIDTH = 160;
export const DEFAULT_NODE_HEIGHT = 100;
