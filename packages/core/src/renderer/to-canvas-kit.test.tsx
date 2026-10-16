import React from 'react';
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { toCanvasKit } from './to-canvas-kit';
import { NodeFrame, type NodeFrameProps } from './node-frame';
import type { ResolvedCanvasView, ResolvedConnector } from '../resolve-document';
import type { ResolvedWidget } from '../adapter';
import type { Connector } from '../view-document';
import { KO_LABELS } from '../labels-ko';

/** What a node's overlay draws: its `NodeFrame`, expanded one level so the frame's own elements can be read. */
function frameOf(content: React.ReactNode): ReactElement {
  const element = content as ReactElement<NodeFrameProps>;
  expect(element.type).toBe(NodeFrame);
  return NodeFrame(element.props);
}

/** A resolved canvas view; a connector given without `quality` is taken as unbound. */
function doc(
  overrides: Omit<Partial<ResolvedCanvasView>, 'connectors'> & { connectors?: Array<Connector & Partial<Pick<ResolvedConnector, 'quality'>>> } = {}
): ResolvedCanvasView {
  return {
    kind: 'canvas',
    background: {},
    nodes: [],
    ...overrides,
    connectors: (overrides.connectors ?? []).map(connector => ({ quality: {}, ...connector })),
  };
}

// 'unknown-widget' has no primary data field known to u-widgets, so `frameQuality` falls back to
// worst-first-across-all-bindings — the behavior these fixtures test.
function overlayFor(quality: Record<string, 'live' | 'stale' | 'disconnected'>, widgetType = 'unknown-widget') {
  const { overlays } = toCanvasKit(
    doc({
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: widgetType, props: {}, quality } }],
    })
  );
  return frameOf(overlays[0].content) as ReactElement<{
    style?: Record<string, unknown>;
    title?: string;
    children?: ReactElement[];
  }>;
}

function childrenOf(frame: ReactElement<{ children?: ReactElement[] }>) {
  return React.Children.toArray(frame.props.children) as ReactElement<Record<string, unknown>>[];
}

function liveRegionFor(quality: Record<string, 'live' | 'stale' | 'disconnected'>, widgetType = 'unknown-widget') {
  const liveRegion = childrenOf(overlayFor(quality, widgetType)).find(child => child.props.role === 'status');
  return liveRegion as ReactElement<{ role?: string; 'aria-live'?: string; children?: string }>;
}

/** The visible quality mark of a node built from `widget`, or `undefined` when it has none. */
function badgeFor(widget: Partial<ResolvedWidget> & Pick<ResolvedWidget, 'quality'>, options: Parameters<typeof toCanvasKit>[1] = {}) {
  const { overlays } = toCanvasKit(
    doc({ nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'unknown-widget', props: {}, ...widget } }] }),
    options
  );
  const badge = childrenOf(frameOf(overlays[0].content) as ReactElement<{ children?: ReactElement[] }>).find(child => 'data-quality-badge' in child.props);
  return badge as ReactElement<{ 'aria-hidden'?: string; style?: Record<string, unknown>; children?: string }> | undefined;
}

describe('toCanvasKit', () => {
  it('hands each node its state and looks, and still draws connectors to a hidden node', () => {
    const widget: ResolvedWidget = { type: 'status', props: {}, quality: {} };
    const out = toCanvasKit(doc({
      nodes: [
        { id: 'a', x: 0, y: 0, width: 10, height: 10, anchored: false, widget, state: 'off', states: { from: 'v', map: { values: { x: 'off' } }, looks: { off: { hidden: true } } } },
        { id: 'b', x: 50, y: 0, width: 10, height: 10, anchored: false, widget },
      ],
      connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b' }],
    }));
    const frame = out.overlays[0].content as ReactElement<NodeFrameProps>;
    expect(frame.props.state).toBe('off');
    expect(frame.props.looks).toEqual({ off: { hidden: true } });
    expect(out.scene.getObjects().some(o => o.type === 'line')).toBe(true);
  });

  it('adds an image DrawingObject for the background when one is set', () => {
    const { scene } = toCanvasKit(
      doc({ background: { image: { src: 'plan.png', width: 800, height: 600 } } })
    );

    const objects = scene.getObjects();
    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({ type: 'image', src: 'plan.png', width: 800, height: 600 });
  });

  it('adds a rect/text DrawingObject for each decoration, ahead of nodes', () => {
    const { scene } = toCanvasKit(
      doc({
        decorations: [
          { id: 'deco-1', type: 'rect', x: 0, y: 0, width: 400, height: 300, stroke: '#334155' },
          { id: 'deco-2', type: 'text', x: 8, y: 8, text: 'Core Banking' },
        ],
      })
    );

    const objects = scene.getObjects();
    expect(objects).toHaveLength(2);
    expect(objects[0]).toMatchObject({ type: 'rect', width: 400, height: 300, stroke: '#334155' });
    expect(objects[1]).toMatchObject({ type: 'text', text: 'Core Banking' });
  });

  it('draws a decoration colour of "none" as nothing — not as the colour drawn before it', () => {
    const { scene } = toCanvasKit(
      doc({
        decorations: [
          { id: 'zone', type: 'rect', x: 0, y: 0, width: 100, height: 50, fill: 'none', stroke: '#8a8a8a' },
          { id: 'edge', type: 'rect', x: 0, y: 60, width: 100, height: 50, fill: '#eef', stroke: 'None' },
          { id: 'ghost', type: 'text', x: 0, y: 0, text: 'hidden', fill: 'none' },
        ],
      })
    );
    const [zone, edge, ghost] = scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
    expect(zone).not.toHaveProperty('fill');
    expect(zone.stroke).toBe('#8a8a8a');
    expect(edge).not.toHaveProperty('stroke');
    expect(edge.fill).toBe('#eef');
    expect(ghost.fill).toBe('transparent');
  });

  it('adds no scene objects for a document with no background, decorations, or connectors', () => {
    const { scene, overlays } = toCanvasKit(doc());
    expect(scene.getObjects()).toHaveLength(0);
    expect(overlays).toHaveLength(0);
  });

  it('draws a line between two nodes, from the edge of one box to the edge of the other', () => {
    const { scene } = toCanvasKit(
      doc({
        nodes: [
          { id: 'n1', x: 0, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'metric', props: { data: { value: 1 } }, quality: {} } },
          { id: 'n2', x: 200, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'metric', props: { data: { value: 2 } }, quality: {} } },
        ],
        connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
      })
    );

    const line = scene.getObjects().find(o => o.type === 'line');
    expect(line).toMatchObject({ points: [100, 50, 200, 50], stroke: '#94a3b8', strokeWidth: 2 });
  });

  it('draws a connector’s label on a chip at its middle, its style, and connectors of one pair side by side', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const { scene } = toCanvasKit(
      doc({
        nodes: [
          { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
          { id: 'b', x: 300, y: 0, width: 100, height: 100, anchored: false, widget },
        ],
        connectors: [
          { id: 'c1', fromNodeId: 'a', toNodeId: 'b', label: '26.78Kbps', style: { stroke: '#2563eb', strokeWidth: 3, dash: 'dashed' } },
          { id: 'c2', fromNodeId: 'b', toNodeId: 'a' },
        ],
      })
    );
    const objects = scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
    const [first, second] = objects.filter(o => o.type === 'line');
    expect(first).toMatchObject({ id: 'c1', stroke: '#2563eb', strokeWidth: 3, dash: [6, 4] });
    expect(second).not.toHaveProperty('dash');
    // side by side: the two lines run 8 apart, both along y
    const ys = [first, second].map(line => (line.points as number[])[1]);
    expect(Math.abs(ys[0] - ys[1])).toBeCloseTo(8);
    const text = objects.find(o => o.id === 'c1#label');
    const chip = objects.find(o => o.id === 'c1#chip');
    expect(text).toMatchObject({ type: 'text', text: '26.78Kbps' });
    expect(chip).toMatchObject({ type: 'rect', fill: '#ffffff' });
        // labels come after every line, so no line crosses a label
    expect(objects.indexOf(chip!)).toBeGreaterThan(objects.indexOf(second));
  });

  it('places the labels of side-by-side connectors at different points along the line, so they do not stack', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const { scene } = toCanvasKit(
      doc({
        nodes: [
          { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
          { id: 'b', x: 400, y: 0, width: 100, height: 100, anchored: false, widget },
        ],
        connectors: [
          { id: 'c1', fromNodeId: 'a', toNodeId: 'b', label: '26.78Kbps' },
          { id: 'c2', fromNodeId: 'a', toNodeId: 'b', label: 'N/A' },
        ],
      })
    );
    const chips = (scene.getObjects() as readonly object[] as readonly Record<string, number>[]).filter(o => String(o.id).endsWith('#chip'));
    const [one, two] = chips;
    const apart = one.x + one.width <= two.x || two.x + two.width <= one.x;
    expect(apart).toBe(true);
  });

  it('draws arrowheads in the line’s colour with their tips on the boxes, the line stopping inside them', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const nodes = [
      { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
      { id: 'b', x: 300, y: 0, width: 100, height: 100, anchored: false, widget },
    ];
    const objects = (arrow: 'none' | 'end' | 'start' | 'both', strokeWidth?: number) =>
      toCanvasKit(doc({ nodes, connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', style: { stroke: '#16a34a', arrow, ...(strokeWidth && { strokeWidth }) } }] })).scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
    const heads = (list: readonly Record<string, unknown>[]) => list.filter(o => String(o.id).startsWith('c#arrow'));

    expect(heads(objects('none'))).toEqual([]);
    expect((objects('none').find(o => o.id === 'c') as { points: number[] }).points).toEqual([100, 50, 300, 50]);

    const end = objects('end');
    expect(heads(end)).toEqual([expect.objectContaining({ type: 'path', closed: true, fill: '#16a34a', points: [300, 50, 292, 53, 292, 47] })]);
    expect((end.find(o => o.id === 'c') as { points: number[] }).points).toEqual([100, 50, 296, 50]);

    const start = heads(objects('start'))[0] as { points: number[] };
    expect(start.points.slice(0, 2)).toEqual([100, 50]); // the tip on the `from` box

    expect(heads(objects('both'))).toHaveLength(2);
    // a wider line, a bigger head
    expect((heads(objects('end', 5))[0] as { points: number[] }).points.slice(2, 4)).toEqual([280, 57.5]);
  });

  it('runs an orthogonal connector out of the facing side, turning once at the middle of the gap, into the other', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const at = (x: number, y: number, id: string, w = 100) => ({ id, x, y, width: w, height: 100, anchored: false, widget });
    const line = (nodes: ReturnType<typeof at>[], style: Connector['style'] = {}, label?: string) => {
      const objects = toCanvasKit(doc({ nodes, connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', ...(label && { label }), style: { route: 'orthogonal', ...style } }] })).scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
      return { points: (objects.find(o => o.id === 'c') as { points: number[] }).points, objects };
    };
    // Further apart across than down: out of the right side, across to the middle, down, across into the left side.
    expect(line([at(0, 0, 'a'), at(300, 200, 'b')]).points).toEqual([100, 50, 200, 50, 200, 250, 300, 250]);
    // Further apart down than across: out of the bottom, down to the middle, across, down into the top.
    expect(line([at(0, 0, 'a'), at(40, 300, 'b')]).points).toEqual([50, 100, 50, 200, 90, 200, 90, 300]);
    // From right to left too, out of the left side.
    expect(line([at(300, 200, 'a'), at(0, 0, 'b')]).points).toEqual([300, 250, 200, 250, 200, 50, 100, 50]);
    // Lined up: straight across.
    expect(line([at(0, 0, 'a'), at(300, 0, 'b')]).points).toEqual([100, 50, 300, 50]);
    // Overlapping boxes leave no gap to turn in: drawn straight, as a straight connector is.
    expect(line([at(0, 0, 'a'), at(50, 50, 'b')]).points).toEqual(line([at(0, 0, 'a'), at(50, 50, 'b')], { route: 'straight' }).points);

    // The head points along the last run, its tip on the box; the line stops inside it.
    const headed = line([at(0, 0, 'a'), at(300, 200, 'b')], { arrow: 'end' });
    expect(headed.points).toEqual([100, 50, 200, 50, 200, 250, 296, 250]);
    expect(headed.objects.find(o => o.id === 'c#arrow0')).toMatchObject({ points: [300, 250, 292, 253, 292, 247] });
    // A label at the middle of the line's length — the middle of the run that turns.
    const labelled = line([at(0, 0, 'a'), at(300, 200, 'b')], {}, 'x');
    const text = labelled.objects.find(o => o.id === 'c#label') as { y: number; fontSize: number };
    expect(text.y + text.fontSize / 2).toBe(150);
  });

  it('keeps side-by-side orthogonal connectors apart along their whole length', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const nodes = [
      { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
      { id: 'b', x: 300, y: 200, width: 100, height: 100, anchored: false, widget },
    ];
    const route = { route: 'orthogonal' } as const;
    const objects = toCanvasKit(doc({ nodes, connectors: [{ id: 'c1', fromNodeId: 'a', toNodeId: 'b', style: route }, { id: 'c2', fromNodeId: 'b', toNodeId: 'a', style: route }] })).scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
    const [one, two] = ['c1', 'c2'].map(id => (objects.find(o => o.id === id) as { points: number[] }).points);
    expect(one).toEqual([100, 46, 196, 46, 196, 246, 300, 246]);
    expect(two).toEqual([300, 254, 204, 254, 204, 54, 100, 54]);
  });

  it('places a label where its labelAt says along the line, from the fromNodeId end', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const nodes = [
      { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
      { id: 'b', x: 500, y: 0, width: 100, height: 100, anchored: false, widget },
    ];
    const left = (connector: { fromNodeId: string; toNodeId: string; labelAt?: number }) =>
      (toCanvasKit(doc({ nodes, connectors: [{ id: 'c', label: 'x', ...connector }] })).scene.getObjects() as readonly object[] as readonly Record<string, unknown>[]).find(o => o.id === 'c#label')!.x as number;
    // the line runs 100 → 500
    expect(left({ fromNodeId: 'a', toNodeId: 'b', labelAt: 0.25 })).toBeLessThan(left({ fromNodeId: 'a', toNodeId: 'b' }));
    expect(left({ fromNodeId: 'b', toNodeId: 'a', labelAt: 0.25 })).toBeGreaterThan(left({ fromNodeId: 'a', toNodeId: 'b' }));
  });

  it('draws a node’s caption centred under its box on a chip, over the connectors', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const { scene } = toCanvasKit(
      doc({
        nodes: [
          { id: 'a', x: 0, y: 0, width: 40, height: 40, anchored: false, caption: 'Catalyst9300.nmslab.local', widget },
          { id: 'b', x: 200, y: 0, width: 40, height: 40, anchored: false, widget },
        ],
        connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b' }],
      })
    );
    const objects = scene.getObjects() as readonly object[] as readonly Record<string, unknown>[];
    const caption = objects.find(o => o.id === 'a#caption') as Record<string, number> & { text: string };
    expect(caption.text).toBe('Catalyst9300.nmslab.local');
    expect(caption.y).toBe(44); // 4 under the box
    expect(caption.x).toBeLessThan(0); // wider than the box: centred, so it starts left of it
    expect(objects.some(o => o.id === 'b#caption')).toBe(false);
    expect(objects.findIndex(o => o.id === 'a#caption-chip')).toBeGreaterThan(objects.findIndex(o => o.id === 'c'));
  });

  it('rims a bound label that is not showing a current value, as a widget frame is', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const nodes = [
      { id: 'a', x: 0, y: 0, width: 40, height: 40, anchored: false, widget },
      { id: 'b', x: 300, y: 0, width: 40, height: 40, anchored: false, widget },
    ];
    const chip = (quality: Record<string, 'live' | 'stale' | 'disconnected'>) =>
      (toCanvasKit(doc({ nodes, connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', label: '26 Kbps', quality }] })).scene.getObjects() as readonly object[] as readonly Record<string, unknown>[]).find(o => o.id === 'c#chip');
    expect(chip({ label: 'live' })).not.toHaveProperty('stroke');
    expect(chip({ label: 'stale' })).toMatchObject({ stroke: '#f59e0b' });
    expect(chip({ label: 'live', 'style.stroke': 'disconnected' })).toMatchObject({ stroke: '#6b7280' });
  });

  it('lays a display-only mark over each connector, carrying its label for a reader and the quality it shows', () => {
    const widget = { type: 'metric', props: {}, quality: {} };
    const nodes = [
      { id: 'a', x: 0, y: 0, width: 100, height: 100, anchored: false, widget },
      { id: 'b', x: 300, y: 0, width: 100, height: 100, anchored: false, widget },
    ];
    const { overlays } = toCanvasKit(
      doc({
        nodes,
        connectors: [
          { id: 'c1', fromNodeId: 'a', toNodeId: 'b', label: '26 Kbps', style: { arrow: 'end' }, quality: { label: 'stale' } },
          { id: 'c2', fromNodeId: 'b', toNodeId: 'a' },
        ],
      })
    );
    expect(overlays.map(o => o.id)).toEqual(['a', 'b', 'c1', 'c2']);
    const [one, two] = overlays.slice(2);
    expect(one).toMatchObject({ interactive: false, x: 100 });
    expect(one.x + one.width).toBe(300); // to the arrow's tip on b
    expect(one.height).toBeGreaterThan(11); // the label's chip
    const mark = one.content as ReactElement<Record<string, unknown> & { children?: ReactElement[] }>;
    expect(mark.props).toMatchObject({ 'data-connector-id': 'c1', 'data-quality': 'stale' });
    const parts = childrenOf(mark);
    expect(parts.map(p => p.props.children)).toEqual(['26 Kbps', 'stale — showing last known value']);
    expect(parts[1].props).toMatchObject({ role: 'status', 'aria-live': 'polite' });
    expect((two.content as ReactElement<Record<string, unknown>>).props).not.toHaveProperty('data-quality');
  });

  it('marks a node frame with the quality its headline value shows, not when live', () => {
    expect(overlayFor({ value: 'stale' }).props).toMatchObject({ 'data-quality': 'stale' });
    expect(overlayFor({ value: 'live' }).props).not.toHaveProperty('data-quality');
  });

  it('skips a connector referencing a node that does not exist, without throwing', () => {
    expect(() =>
      toCanvasKit(doc({ connectors: [{ id: 'c1', fromNodeId: 'missing', toNodeId: 'also-missing' }] }))
    ).not.toThrow();
  });

  it('produces one overlay per node, positioned at the node and sized by it (or a default)', () => {
    const { overlays } = toCanvasKit(
      doc({
        nodes: [
          { id: 'sized', x: 10, y: 20, width: 300, height: 150, anchored: true, widget: { type: 'metric', quality: {}, props: {} } },
          { id: 'unsized', x: 0, y: 0, anchored: false, widget: { type: 'metric', quality: {}, props: {} } },
        ],
      })
    );

    expect(overlays.find(o => o.id === 'sized')).toMatchObject({ x: 10, y: 20, width: 300, height: 150 });
    const unsized = overlays.find(o => o.id === 'unsized')!;
    expect(unsized.width).toBeGreaterThan(0);
    expect(unsized.height).toBeGreaterThan(0);
  });

  it("passes the node's widget type and props through as a u-widgets spec", () => {
    const { overlays } = toCanvasKit(
      doc({
        nodes: [
          {
            id: 'n1',
            x: 0,
            y: 0,
            anchored: false,
            widget: { type: 'gauge', props: { data: { value: 73 } }, quality: {} },
          },
        ],
      })
    );

    const frame = frameOf(overlays[0].content) as ReactElement<{
      children: [ReactElement<{ spec: Record<string, unknown> }>, ReactElement];
    }>;
    const [widget] = frame.props.children;
    expect(widget.props.spec).toEqual({ widget: 'gauge', data: { value: 73 } });
  });

  describe('connection-quality visual indicator', () => {
    it('adds no border and no title when a widget has no bindings at all', () => {
      const frame = overlayFor({});
      expect(frame.props.style?.border).toBeUndefined();
      expect(frame.props.title).toBeUndefined();
    });

    it('draws the widget in the light palette whatever the page or system theme — it sits on the board, not the page', () => {
      const frame = overlayFor({});
      const children = React.Children.toArray(frame.props.children) as React.ReactElement<{ theme?: string }>[];
      expect(children.find(child => child.props.theme !== undefined)?.props.theme).toBe('light');
    });

    it('draws a text decoration with no colour of its own in a light ink on a dark board, and keeps a chosen one', () => {
      const decorations = [
        { id: 't1', type: 'text' as const, x: 0, y: 0, text: 'Zone A' },
        { id: 't2', type: 'text' as const, x: 0, y: 20, text: 'Zone B', fill: '#f59e0b' },
      ];
      const fills = (appearance?: 'light' | 'dark') =>
        toCanvasKit(doc({ appearance, decorations })).scene.getObjects().filter(o => o.type === 'text').map(o => (o as { fill?: string }).fill);
      expect(fills('dark')).toEqual(['#e5e7eb', '#f59e0b']);
      expect(fills()).toEqual([undefined, '#f59e0b']);
    });

    it('draws the widget in the dark palette on a dark board', () => {
      const { overlays } = toCanvasKit(
        doc({ appearance: 'dark', nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'unknown-widget', props: {}, quality: {} } }] })
      );
      const children = React.Children.toArray((frameOf(overlays[0].content) as ReactElement<{ children?: ReactElement[] }>).props.children) as React.ReactElement<{ theme?: string }>[];
      expect(children.find(child => child.props.theme !== undefined)?.props.theme).toBe('dark');
    });

    it("has the widget speak the labels' language", () => {
      const { overlays } = toCanvasKit(
        doc({ nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'unknown-widget', props: {}, quality: {} } }] }),
        { locale: 'ko-KR' }
      );
      const children = React.Children.toArray((frameOf(overlays[0].content) as ReactElement<{ children?: ReactElement[] }>).props.children) as React.ReactElement<{ locale?: string }>[];
      expect(children.find(child => child.props.locale !== undefined)?.props.locale).toBe('ko-KR');
    });

    it('adds no border when every binding is live (ISA-101 — normal state is unmarked)', () => {
      const frame = overlayFor({ state: 'live', load: 'live' });
      expect(frame.props.style?.border).toBeUndefined();
      expect(frame.props.title).toBeUndefined();
    });

    it('marks a stale binding with a distinct border and an explanatory title', () => {
      const frame = overlayFor({ state: 'stale' });
      expect(frame.props.style?.border).toContain('dashed');
      expect(frame.props.title).toMatch(/stale/);
    });

    it('marks a disconnected binding with a distinct border and an explanatory title', () => {
      const frame = overlayFor({ state: 'disconnected' });
      expect(frame.props.style?.border).toContain('dotted');
      expect(frame.props.title).toMatch(/disconnected/);
    });

    it('shows the worst binding when a widget has several bindings of mixed quality', () => {
      const frame = overlayFor({ state: 'live', load: 'stale', mode: 'disconnected' });
      expect(frame.props.title).toMatch(/disconnected/);
    });

    it('keeps the plain label when only one binding is abnormal, even alongside live ones', () => {
      const frame = overlayFor({ state: 'live', load: 'live', mode: 'disconnected' });
      expect(frame.props.title).toBe('disconnected — no value has been reached');
    });

    it('lists each abnormal binding by its own prop path when more than one is at fault', () => {
      const frame = overlayFor({
        'data.value': 'live',
        'data.threshold': 'disconnected',
        'data.zone': 'disconnected',
        'data.lastKnown': 'stale',
      });
      expect(frame.props.title).toBe(
        'disconnected — no value has been reached (data.threshold; data.zone) · ' +
          'stale — showing last known value (data.lastKnown)'
      );
    });

    it('says in the title and the announcement how long ago a stale value was obtained', () => {
      const observedAt = new Date(Date.now() - 5 * 60_000 - 10_000).toISOString();
      const { overlays } = toCanvasKit(
        doc({
          nodes: [{
            id: 'n1', x: 0, y: 0, anchored: false,
            widget: { type: 'unknown-widget', props: {}, quality: { v: 'stale' }, reasons: { v: 'transport' }, observedAt: { v: observedAt } },
          }],
        })
      );
      const frame = frameOf(overlays[0].content) as ReactElement<{ title?: string; children?: ReactElement<{ children?: string }>[] }>;
      expect(frame.props.title).toBe('stale — showing last known value (data source unreachable, 5 minutes ago)');
      expect(childrenOf(frame).find(child => child.props.role === 'status')?.props.children).toBe(frame.props.title);
    });

    it('gives stale and disconnected distinct border *styles*, not just distinct colors', () => {
      const stale = overlayFor({ state: 'stale' });
      const disconnected = overlayFor({ state: 'disconnected' });
      expect(stale.props.style?.border).toContain('dashed');
      expect(stale.props.style?.border).not.toContain('dotted');
      expect(disconnected.props.style?.border).toContain('dotted');
      expect(disconnected.props.style?.border).not.toContain('dashed');
    });

    describe('primary-field frame scoping', () => {
      // gauge's only bound-able data field is `value` — u-widgets knows this is the headline
      // value actually shown on the gauge.
      it('adds no border when a secondary binding fails but the primary (data.value) is live', () => {
        const frame = overlayFor(
          { 'data.value': 'live', 'data.threshold': 'disconnected', 'data.zone': 'disconnected' },
          'gauge'
        );
        expect(frame.props.style?.border).toBeUndefined();
      });

      it('still borders the frame when the primary binding itself is the one that failed', () => {
        const frame = overlayFor({ 'data.value': 'disconnected', 'data.threshold': 'live' }, 'gauge');
        expect(frame.props.style?.border).toContain('dotted');
      });

      it('adds no border when the primary field is unbound, even if a secondary binding failed', () => {
        const frame = overlayFor({ 'data.threshold': 'disconnected' }, 'gauge');
        expect(frame.props.style?.border).toBeUndefined();
      });

      it('picks "value" as status\'s primary field, not the also-required "label"', () => {
        const frame = overlayFor({ 'data.label': 'disconnected', 'data.value': 'live' }, 'status');
        expect(frame.props.style?.border).toBeUndefined();
      });

      it('still shows the per-property breakdown in the title, even when the frame has no border', () => {
        // The frame (summary/master-caution) and the tooltip (drill-down) answer different
        // questions — a live-but-not-primary binding failure stays visible on hover even once it
        // stops driving the frame.
        const frame = overlayFor(
          { 'data.value': 'live', 'data.threshold': 'disconnected', 'data.zone': 'disconnected' },
          'gauge'
        );
        expect(frame.props.style?.border).toBeUndefined();
        expect(frame.props.title).toMatch(/disconnected/);
      });

      it('keeps the pre-existing worst-first behavior for a widget type with no known primary field', () => {
        const frame = overlayFor({ x: 'live', y: 'disconnected' }, 'chart.line');
        expect(frame.props.style?.border).toContain('dotted');
      });
    });
  });

  describe('connection-quality mark on the node — readable without hovering or a screen reader', () => {
    const now = Date.parse('2026-10-12T22:33:00Z');
    const minuteAgo = '2026-10-12T22:32:00Z';

    it('shows none while the value is live', () => {
      expect(badgeFor({ quality: { 'data.value': 'live' } })).toBeUndefined();
    });

    it('names a source that answers but has not updated, and how old its value is', () => {
      const badge = badgeFor(
        { quality: { 'data.value': 'stale' }, reasons: { 'data.value': 'lagging' }, observedAt: { 'data.value': minuteAgo } },
        { now }
      );
      expect(badge?.props.children).toBe('Source behind · 1 minute ago');
    });

    it('names a source that does not answer in other words than one that is behind — they call for different people', () => {
      const behind = badgeFor({ quality: { 'data.value': 'stale' }, reasons: { 'data.value': 'lagging' } });
      const unreachable = badgeFor({ quality: { 'data.value': 'stale' }, reasons: { 'data.value': 'transport' } });
      expect(unreachable?.props.children).toBe('No reply from source');
      expect(unreachable?.props.children).not.toBe(behind?.props.children);
    });

    it('names the state when the adapter gave no cause', () => {
      expect(badgeFor({ quality: { 'data.value': 'disconnected' } })?.props.children).toBe('No value');
    });

    it('is hidden from assistive technology, which hears the full text from the status region', () => {
      expect(badgeFor({ quality: { 'data.value': 'stale' } })?.props['aria-hidden']).toBe('true');
    });

    it("takes the frame's colour, and the binding the frame reports — not a secondary one", () => {
      expect(badgeFor({ quality: { 'data.value': 'stale' } })?.props.style?.background).toContain('--ub-quality-stale');
      const { overlays } = toCanvasKit(
        doc({ nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', props: {}, quality: { 'data.value': 'live', 'data.threshold': 'disconnected' } } }] })
      );
      const children = childrenOf(frameOf(overlays[0].content) as ReactElement<{ children?: ReactElement[] }>);
      expect(children.some(child => 'data-quality-badge' in child.props)).toBe(false);
    });

    it("speaks the labels' language", () => {
      const badge = badgeFor(
        { quality: { 'data.value': 'stale' }, reasons: { 'data.value': 'lagging' }, observedAt: { 'data.value': minuteAgo } },
        { now, qualityText: KO_LABELS.qualityText }
      );
      expect(badge?.props.children).toBe('원천 갱신 늦음 · 1분 전');
    });
  });

  describe('connection-quality screen-reader announcement', () => {
    // A separate sibling node, not a role/aria-live on the frame `<div>` itself or on `UWidget`:
    // each `uw-*` custom element already renders its own role inside its own shadow root (e.g.
    // `role="list"` for `status`, `role="meter"`/`"progressbar"` for `gauge`), and putting the
    // live region there instead avoids any chance of colliding with that.
    it('always renders a dedicated status live region, separate from the widget', () => {
      const liveRegion = liveRegionFor({ state: 'live' });
      expect(liveRegion.props.role).toBe('status');
      expect(liveRegion.props['aria-live']).toBe('polite');
    });

    it('leaves the live region empty when every binding is live (ISA-101 — normal state is unmarked)', () => {
      expect(liveRegionFor({ state: 'live', load: 'live' }).props.children).toBe('');
    });

    it('leaves the live region empty when a widget has no bindings at all', () => {
      expect(liveRegionFor({}).props.children).toBe('');
    });

    it('announces the same explanatory text as the title when stale', () => {
      expect(liveRegionFor({ state: 'stale' }).props.children).toMatch(/stale/);
    });

    it('announces the same explanatory text as the title when disconnected', () => {
      expect(liveRegionFor({ state: 'disconnected' }).props.children).toMatch(/disconnected/);
    });

    it('announces the same per-property breakdown as the title when several bindings are at fault', () => {
      const quality = { 'data.value': 'live', 'data.threshold': 'disconnected', 'data.lastKnown': 'stale' } as const;
      expect(liveRegionFor(quality).props.children).toBe(overlayFor(quality).props.title);
    });
  });
});
