/** A node's footprint when its own width/height weren't set — shared by every consumer that
 * needs to know a node's on-screen extent (the renderer, the authoring scene mapping) so they
 * never compute it independently and drift apart. */
export const DEFAULT_NODE_WIDTH = 160;
export const DEFAULT_NODE_HEIGHT = 100;

/** A newly-added rect decoration's footprint — larger than a node's default so a freshly placed
 * "labeled frame" is immediately distinguishable from a widget placeholder and roomy enough to
 * drag around existing nodes before resizing it to fit. */
export const DEFAULT_DECORATION_WIDTH = 240;
export const DEFAULT_DECORATION_HEIGHT = 160;
