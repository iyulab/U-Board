import { describe, it, expect } from 'vitest';
import { canMakeComponent, detachInstance, makeComponent, newComponentName, newInstanceId } from './component-editing';
import { validateViewDocument } from '../validate-view-document';
import { expandComponents } from '../components';
import type { CanvasView, Node } from '../view-document';

const node = (id: string, x: number, y: number, extra: Partial<Node> = {}): Node => ({ id, x, y, anchored: false, widget: { type: 'gauge' }, ...extra });

const board = (): CanvasView => ({
  kind: 'canvas',
  background: {},
  nodes: [node('hall', 0, 0), node('temp', 300, 100), node('speed', 300, 220)],
  connectors: [
    { id: 'link', fromNodeId: 'temp', toNodeId: 'speed' },
    { id: 'feed', fromNodeId: 'hall', toNodeId: 'temp' },
  ],
  decorations: [{ id: 'frame', type: 'rect', x: 290, y: 80, width: 180, height: 260 }],
  triggers: [
    { on: { event: 'click', node: 'temp' }, do: [{ action: 'focus', node: 'speed' }] },
    { on: { event: 'open' }, when: { node: 'speed', state: 'x' }, do: [{ action: 'emit', name: 'e' }] },
  ],
});

describe('makeComponent', () => {
  it('makes the chosen parts a component drawn by an instance where they were, the board’s lines and triggers renamed', () => {
    const made = makeComponent(board(), ['temp', 'speed', 'frame', 'link'], 'card', 'card-1');
    expect(made.nodes.map(n => n.id)).toEqual(['hall']);
    expect(made.decorations).toEqual([]);
    expect(made.components?.card).toEqual({
      nodes: [
        { id: 'temp', x: 10, y: 20, widget: { type: 'gauge' } },
        { id: 'speed', x: 10, y: 140, widget: { type: 'gauge' } },
      ],
      connectors: [{ id: 'link', fromNodeId: 'temp', toNodeId: 'speed' }],
      decorations: [{ id: 'frame', type: 'rect', x: 0, y: 0, width: 180, height: 260 }],
    });
    expect(made.instances).toEqual([{ id: 'card-1', component: 'card', x: 290, y: 80, anchored: false }]);
    expect(made.connectors).toEqual([{ id: 'feed', fromNodeId: 'hall', toNodeId: 'card-1/temp' }]);
    expect(made.triggers).toEqual([
      { on: { event: 'click', node: 'card-1/temp' }, do: [{ action: 'focus', node: 'card-1/speed' }] },
      { on: { event: 'open' }, when: { node: 'card-1/speed', state: 'x' }, do: [{ action: 'emit', name: 'e' }] },
    ]);
    expect(validateViewDocument(made, { strict: true })).toEqual([]);
    // Drawn as it was.
    const before = expandComponents(board()).nodes.map(n => [n.x, n.y]);
    expect(expandComponents(made).nodes.map(n => [n.x, n.y]).sort()).toEqual(before.sort());
  });

  it('takes the lines between the chosen nodes even when only the nodes are chosen', () => {
    expect(makeComponent(board(), ['temp', 'speed'], 'card', 'c1').components?.card.connectors).toEqual([{ id: 'link', fromNodeId: 'temp', toNodeId: 'speed' }]);
  });

  it('refuses what an instance cannot hold, and leaves the board as it is', () => {
    const doc = board();
    doc.nodes[2] = { ...doc.nodes[2], anchored: true };
    expect(canMakeComponent(doc, ['temp', 'speed'])).toBe(false);
    expect(makeComponent(doc, ['temp', 'speed'], 'card', 'c1')).toBe(doc);
    expect(canMakeComponent(board(), ['link'])).toBe(false);
    expect(canMakeComponent(board(), ['temp'])).toBe(true);
    expect(makeComponent(board(), ['temp'], 'Card', 'c1').components).toBeUndefined();
  });

  it('names a new component and instance with what is not taken', () => {
    const made = makeComponent(board(), ['temp'], newComponentName(board()), newInstanceId(board()));
    expect(newComponentName(made)).toBe('component-2');
    expect(newInstanceId(made)).toBe('instance-2');
  });
});

describe('detachInstance', () => {
  it('draws an instance as the board’s own parts, values filled in, lines and triggers renamed — the component stays', () => {
    const made = makeComponent(board(), ['temp', 'speed', 'frame'], 'card', 'c1');
    const withParam: CanvasView = {
      ...made,
      components: { card: { ...made.components!.card, params: { type: 'object', properties: { name: { type: 'string' } } }, nodes: made.components!.card.nodes.map(n => ({ ...n, caption: '{{name}}' })) } },
      instances: [{ ...made.instances![0], params: { name: 'P1' } }],
    };
    const detached = detachInstance(withParam, 'c1');
    expect(detached.instances).toEqual([]);
    expect(detached.components?.card).toBeDefined();
    expect(detached.nodes.map(n => [n.id, n.x, n.y, n.caption])).toEqual([
      ['hall', 0, 0, undefined],
      ['c1-temp', 300, 100, 'P1'],
      ['c1-speed', 300, 220, 'P1'],
    ]);
    expect(detached.connectors.map(c => [c.id, c.fromNodeId, c.toNodeId])).toEqual([
      ['feed', 'hall', 'c1-temp'],
      ['c1-link', 'c1-temp', 'c1-speed'],
    ]);
    expect(detached.decorations?.map(d => d.id)).toEqual(['c1-frame']);
    expect(detached.triggers?.[0].on).toEqual({ event: 'click', node: 'c1-temp' });
    expect(validateViewDocument(detached, { strict: true })).toEqual([]);
  });
});
