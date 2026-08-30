import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { toCanvasKit } from './to-canvas-kit';
import type { ResolvedViewDocument } from '../resolve-document';

function doc(overrides: Partial<ResolvedViewDocument> = {}): ResolvedViewDocument {
  return {
    kind: 'canvas',
    background: {},
    nodes: [],
    connectors: [],
    ...overrides,
  };
}

// 'unknown-widget' has no primary data field known to u-widgets, so `frameQuality` falls back to
// worst-first-across-all-bindings — the pre-BD-20260828-04 behavior these existing fixtures test.
function overlayFor(quality: Record<string, 'live' | 'stale' | 'disconnected'>, widgetType = 'unknown-widget') {
  const { overlays } = toCanvasKit(
    doc({
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: widgetType, props: {}, quality } }],
    })
  );
  return overlays[0].content as ReactElement<{
    style?: Record<string, unknown>;
    title?: string;
    children?: ReactElement[];
  }>;
}

function liveRegionFor(quality: Record<string, 'live' | 'stale' | 'disconnected'>, widgetType = 'unknown-widget') {
  const [, liveRegion] = overlayFor(quality, widgetType).props.children ?? [];
  return liveRegion as ReactElement<{ role?: string; 'aria-live'?: string; children?: string }>;
}

describe('toCanvasKit', () => {
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

  it('adds no scene objects for a document with no background, decorations, or connectors', () => {
    const { scene, overlays } = toCanvasKit(doc());
    expect(scene.getObjects()).toHaveLength(0);
    expect(overlays).toHaveLength(0);
  });

  it('draws a line connecting the center of two nodes', () => {
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
    expect(line).toMatchObject({ points: [50, 50, 250, 50] });
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

    const frame = overlays[0].content as ReactElement<{
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

    it('lists each abnormal binding by its own prop path when more than one is at fault (BD-20260828-03)', () => {
      const frame = overlayFor({
        'data.value': 'live',
        'data.threshold': 'disconnected',
        'data.zone': 'disconnected',
        'data.lastKnown': 'stale',
      });
      expect(frame.props.title).toBe(
        'disconnected — no value has been reached (data.threshold, data.zone) · ' +
          'stale — showing last known value (data.lastKnown)'
      );
    });

    it('gives stale and disconnected distinct border *styles*, not just distinct colors', () => {
      const stale = overlayFor({ state: 'stale' });
      const disconnected = overlayFor({ state: 'disconnected' });
      expect(stale.props.style?.border).toContain('dashed');
      expect(stale.props.style?.border).not.toContain('dotted');
      expect(disconnected.props.style?.border).toContain('dotted');
      expect(disconnected.props.style?.border).not.toContain('dashed');
    });

    describe('primary-field frame scoping (BD-20260828-04)', () => {
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
